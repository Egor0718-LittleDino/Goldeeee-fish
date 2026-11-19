-- 養魚目標 App：資料表、權限與照片儲存空間
-- 在 Supabase 的 SQL Editor 貼上整份檔案並執行一次即可。

-- 目標（每個目標就是一條魚）。App 可以直接新增、修改、刪除自己的目標。
create table if not exists public.goals (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 餵食紀錄（每次上傳的證明、說明文字，以及之後的 AI 審核結果）。
create table if not exists public.feeds (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id     text not null references public.goals(id) on delete cascade,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists feeds_goal_idx on public.feeds(goal_id);
create index if not exists feeds_user_idx on public.feeds(user_id);

alter table public.goals enable row level security;
alter table public.feeds enable row level security;

drop policy if exists "goals: read own"   on public.goals;
drop policy if exists "goals: insert own" on public.goals;
drop policy if exists "goals: update own" on public.goals;
drop policy if exists "goals: delete own" on public.goals;
create policy "goals: read own"   on public.goals for select using (user_id = auth.uid());
create policy "goals: insert own" on public.goals for insert with check (user_id = auth.uid());
create policy "goals: update own" on public.goals for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals: delete own" on public.goals for delete using (user_id = auth.uid());

drop policy if exists "feeds: read own"   on public.feeds;
drop policy if exists "feeds: insert own" on public.feeds;
drop policy if exists "feeds: update own" on public.feeds;
drop policy if exists "feeds: delete own" on public.feeds;
create policy "feeds: read own"   on public.feeds for select using (user_id = auth.uid());
-- 目前沒有 AI 審核，由 App 直接寫入自己的餵食紀錄。
-- 之後開啟 AI 審核時，執行 002_enable_ai_review.sql 拿掉下面兩條，改成只有後端能寫入。
create policy "feeds: insert own" on public.feeds for insert with check (user_id = auth.uid());
create policy "feeds: update own" on public.feeds for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "feeds: delete own" on public.feeds for delete using (user_id = auth.uid());

-- 證明照片原檔（私人空間，路徑格式：使用者ID/餵食紀錄ID/第幾張.jpg）
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

drop policy if exists "proofs: read own"   on storage.objects;
drop policy if exists "proofs: upload own" on storage.objects;
drop policy if exists "proofs: update own" on storage.objects;
drop policy if exists "proofs: delete own" on storage.objects;
create policy "proofs: read own" on storage.objects for select
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proofs: upload own" on storage.objects for insert
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proofs: update own" on storage.objects for update
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proofs: delete own" on storage.objects for delete
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
