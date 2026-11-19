// 養魚目標：後台設定
// 到 Supabase 專案的 Project Settings → API，把下面兩個值換成你自己的。
// 兩個都留空的話，App 會用「示範模式」在本機執行（資料只存在這台裝置）。
window.FISH_CONFIG = {
  supabaseUrl: '',      // 例：https://abcdefghijkl.supabase.co
  supabaseAnonKey: '',  // 例：sb_publishable_... 或 eyJhbGciOi...（anon public key，可以放在前端）
  aiReview: false       // AI 審核：目前先關閉（上傳證明就算餵食成功）。之後要開啟請看 README 的「之後加入 AI 審核」
};
