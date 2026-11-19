// 養魚目標：產生「這條魚的一生」回顧（Supabase Edge Function：recap）
// 需要的 Secret：ANTHROPIC_API_KEY（必填）、CLAUDE_MODEL / APP_TIMEZONE（選填）
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("CLAUDE_MODEL") ?? "claude-sonnet-5-5";
const TZ = Deno.env.get("APP_TIMEZONE") ?? "Asia/Taipei";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fmt = (t: number) => new Intl.DateTimeFormat("zh-TW", { timeZone: TZ, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(t));
const fmtD = (t: number) => new Intl.DateTimeFormat("zh-TW", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric" }).format(new Date(t));
const TYPE_LABEL: Record<string, string> = { short: "短期", mid: "中期", long: "長期" };
const OUTCOME: Record<string, string> = { graduated: "畢業（成功達成）", barely: "勉強過關", gone: "游走了（中途錯過太多次）" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "請先登入" }, 401);
    const { goalId } = await req.json();

    const { data: row } = await admin.from("goals").select("id,data").eq("id", goalId).eq("user_id", user.id).maybeSingle();
    if (!row) return json({ error: "找不到這個目標" }, 404);
    const g = row.data;
    if (!g.status || g.status === "active") return json({ error: "目標結束後才能寫回顧" }, 400);

    const { data: feedRows } = await admin.from("feeds").select("data").eq("goal_id", goalId).eq("user_id", user.id);
    const feeds = (feedRows ?? []).map((r) => r.data).sort((a, b) => a.ts - b.ts);
    const pass = feeds.filter((f) => f.verdict === "pass").length;
    const lines = feeds.map((f) => `- ${fmt(f.ts)} [${f.verdict}] ${f.summary || f.text}`).join("\n") || "（沒有紀錄）";

    const prompt = `你是「養魚目標 App」的回顧作者。用溫暖、具體、不浮誇的繁體中文，以第三人稱寫一段 150–220 字的「這條魚的一生」，回顧使用者這段目標旅程：做到了什麼、在哪裡卡住、最後的結果，結尾給一句下次可以怎麼做的建議。只輸出內文，不要標題。
目標：${g.title}
動機：${g.why || "未填"}
魚的名字：${g.fishName || "（未取名）"}
期間：${fmtD(g.start)} – ${fmtD(g.end)}，${TYPE_LABEL[g.type] ?? ""}目標
結果：${OUTCOME[g.status] ?? g.status}；通過 ${pass} 次餵食
每次餵食紀錄：
${lines}`;

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) throw new Error("後台尚未設定 ANTHROPIC_API_KEY");
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 900, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) throw new Error(`Claude API 錯誤 ${r.status}：${(await r.text()).slice(0, 300)}`);
    const j = await r.json();
    const recap = (j.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("").trim();

    g.recap = recap;
    const { error } = await admin.from("goals").update({ data: g, updated_at: new Date().toISOString() }).eq("id", goalId).eq("user_id", user.id);
    if (error) throw error;
    return json({ recap });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message ?? String(e) }, 500);
  }
});
