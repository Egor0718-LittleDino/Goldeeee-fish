-- 之後要開啟 AI 審核時才執行：
-- 讓餵食紀錄只能由後端審核函式寫入，使用者無法自己把結果改成「通過」。
drop policy if exists "feeds: insert own" on public.feeds;
drop policy if exists "feeds: update own" on public.feeds;
