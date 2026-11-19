# 養魚目標 App：架設說明

這是一個可以「加到手機主畫面」的網頁版 App（PWA）。iPhone 和 Android 都能用，不需要上架。

目前版本**先不使用 AI 審核**：寫下這次的進度、附上照片，就算餵食成功。說明和照片都會存在後台，之後回顧時可以從魚身上看到。AI 審核的程式已經寫好，之後想加再照最後一節開啟就好。

```
fish-app/
├─ web/                         ← 網頁 App（整個資料夾部署到 Vercel）
│  ├─ index.html                  App 本體
│  ├─ config.js                   ★ 要填入你的 Supabase 網址與金鑰
│  ├─ manifest.webmanifest        App 名稱、圖示（讓它能加到主畫面）
│  ├─ sw.js                       離線快取
│  ├─ vercel.json
│  └─ icons/                      App 圖示
└─ supabase/
   ├─ migrations/
   │  ├─ 001_init.sql             ← 資料表、權限、照片空間（現在要執行）
   │  └─ 002_enable_ai_review.sql ← 之後開啟 AI 審核時才執行
   └─ functions/                  ← AI 審核用的後端程式（之後才需要）
      ├─ review-proof/index.ts
      └─ recap/index.ts
```

## 整體架構

| 部分 | 放在哪 | 做什麼 |
|---|---|---|
| 網頁 App | Vercel（免費） | 畫面、魚的動畫、建立目標、餵魚 |
| 登入 | Supabase Auth | Email + 密碼 |
| 資料庫 | Supabase Postgres | 目標、餵食紀錄、回顧 |
| 照片 | Supabase Storage | 證明照片原檔（私人，只有本人能看到） |

每個人只能讀寫自己的資料，這是由資料庫的權限規則（Row Level Security）把關的。

---

## 事前準備（都用網頁申請，全部免費）

1. **Supabase 帳號**：<https://supabase.com>
2. **GitHub 帳號**：<https://github.com>
3. **Vercel 帳號**：<https://vercel.com>（可以直接用 GitHub 登入）

> 以下選單名稱是撰寫時的版本，後台介面改版時位置可能略有不同。

---

## 步驟 1：建立 Supabase 專案

1. 登入 Supabase，按 **New project**。
2. 取一個名字（例如 `fish-goals`），設定資料庫密碼（請記下來），Region 選 **Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)**，離台灣比較近。
3. 等一兩分鐘，專案建立完成。

## 步驟 2：建立資料表

1. 左側選單打開 **SQL Editor**，按 **New query**。
2. 打開 `supabase/migrations/001_init.sql`，把全部內容貼上，按 **Run**。
3. 看到 `Success` 就完成了。到 **Table Editor** 應該會看到 `goals` 和 `feeds` 兩張表；到 **Storage** 會看到 `proofs` 空間。

## 步驟 3：設定登入方式

1. **Authentication → Sign In / Providers**：確認 **Email** 是開啟的。
2. 想省掉「註冊後要去信箱點確認連結」這一步的話，可以把 **Confirm email** 關掉。只有自己用的話建議關掉；要給別人用的話建議開著。

## 步驟 4：填寫 config.js

1. Supabase **Project Settings → API Keys**（舊版介面叫 **API**）。
2. 複製 **Project URL**，以及 **Publishable key**（舊版叫 `anon` `public` key）。
3. 打開 `web/config.js`，填進去。
   這個檔案在 `fish-app.zip` 裡：先把 zip 解壓縮（Windows：在檔案上按右鍵 →「解壓縮全部」），依序打開 `fish-app` → `web` 資料夾，就會看到 `config.js`。在它上面按右鍵 →「開啟檔案」→ 選「記事本」，填好後存檔（Ctrl + S）。

```js
window.FISH_CONFIG = {
  supabaseUrl: 'https://你的專案ID.supabase.co',
  supabaseAnonKey: 'sb_publishable_...（或 eyJ 開頭的 anon key）',
  aiReview: false
};
```

> 這兩個值本來就是設計給前端使用的，可以公開。**千萬不要**填 `service_role` 或 `secret` 金鑰。

## 步驟 5：部署網頁到 Vercel

**方法 A：GitHub + Vercel（推薦，之後改版最方便）**

1. 到 GitHub 建立新的 repository（例如 `fish-goals`），Private 也可以。
2. 按 **uploading an existing file**，把整個 `fish-app` 資料夾的內容拖進去，按 **Commit changes**。
3. 到 Vercel 按 **Add New… → Project**，選剛剛的 repository，按 **Import**。
4. **Framework Preset** 選 **Other**，**Root Directory** 選 **`web`**，按 **Deploy**。
5. 完成後會得到一個網址，例如 `https://fish-goals.vercel.app`。

之後要改版，只要在 GitHub 上更新檔案，Vercel 就會自動重新部署。

**方法 B：Netlify Drop（不用 GitHub，最快）**

到 <https://app.netlify.com/drop>，直接把 `web` 資料夾拖進網頁就會得到網址。

## 步驟 6：把網址告訴 Supabase

**Authentication → URL Configuration**：

- **Site URL** 填你的 App 網址（例如 `https://fish-goals.vercel.app`）
- **Redirect URLs** 也加上同一個網址

這樣確認信裡的連結才會導回你的 App。

## 步驟 7：安裝到手機

- **iPhone**：用 **Safari** 打開網址 → 點下方「分享」→「**加入主畫面**」。
- **Android**：用 **Chrome** 打開網址 → 右上角選單 →「**安裝應用程式**」或「加到主畫面」。

打開後先註冊帳號，就可以開始養魚了。

---

## 確認一切正常

1. 註冊、登入 → 首頁**沒有**出現「示範模式」的提示。
2. 建立一個短期目標，按「餵魚」，寫一句進度、上傳一張照片，按「🍤 餵食」→ 出現「餵食成功！」，魚吃到飼料。
3. 到 Supabase **Table Editor → feeds**，可以看到剛剛那筆紀錄；**Storage → proofs** 可以看到照片。
4. 換一台手機或電腦登入同一個帳號，目標和紀錄都還在。

## 常見問題

| 狀況 | 可能原因與解法 |
|---|---|
| 首頁出現「示範模式」 | `config.js` 沒填，或填完沒有重新部署 |
| 登入時說 Email 或密碼不正確 | 開著 Confirm email 時，要先去信箱點確認連結 |
| 餵魚時出現「照片上傳失敗」 | 步驟 2 的 SQL 沒有完整執行，`proofs` 空間或它的權限沒建好，重新執行一次 `001_init.sql` |
| 建立目標或餵魚時出現「儲存失敗」 | 網路中斷，或 SQL 沒執行成功 |
| 按「餵魚」是灰色的 | 現在不在這一餐的餵食時段（預定時間前 18 小時才開放） |
| 改了網頁但手機上沒更新 | App 有離線快取，把 App 完全關掉再打開一次 |

## 目前還沒做的

- **推播提醒**：網頁版 App 的推播需要另外設定（Web Push），iPhone 也要 iOS 16.4 以上並先加到主畫面才能收到。
- **忘記密碼**：目前沒有重設密碼的畫面，需要時可以到 Supabase **Authentication → Users** 幫帳號寄重設信。

---

## 之後加入 AI 審核

程式都已經寫好，要開啟時：

1. 到 <https://console.anthropic.com> 儲值，在 **API Keys → Create Key** 建立金鑰（建議在 **Limits** 設每月用量上限）。
2. Supabase **Edge Functions → Secrets** 新增 `ANTHROPIC_API_KEY`，值貼上金鑰。
3. **Edge Functions → Deploy a new function → Via Editor**，依序建立 `review-proof` 和 `recap` 兩個函式，分別貼上 `supabase/functions/` 裡對應的 `index.ts`，按 **Deploy**（保持 Verify JWT 開啟）。
4. 在 **SQL Editor** 執行 `002_enable_ai_review.sql`：之後餵食紀錄只能由後端審核寫入，使用者無法自己改成「通過」。
5. 把 `web/config.js` 裡的 `aiReview` 改成 `true`，重新部署網頁。

開啟後：上傳的證明會交給 Claude 審核（通過／需補件／未通過），可以申訴一次，結束的目標也可以請 Claude 寫「這條魚的一生」。
