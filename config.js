// ============================================================
//  Work Planner — Browser Configuration
//  Edit this file to configure integrations.
//  index.html reads from window.APP_CONFIG at startup.
// ============================================================

window.APP_CONFIG = {

  // ----------------------------------------------------------
  //  Supabase — cross-device sync (optional)
  //  Get these from your Supabase project → Settings → API
  //  Leave blank to run in local-only mode (localStorage only)
  // ----------------------------------------------------------
  SUPABASE_URL:      'https://fisdmsuexkimkzxfxdsx.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_Q96nAsyVEx_zpqzMZDli6g_SoOJa3-2',

  // ----------------------------------------------------------
  //  OAuth providers — controls which buttons appear on the sign-in screen
  //  Supported: 'google', 'apple', 'github', 'discord'
  //  Must match what you have enabled in Supabase → Authentication → Providers
  // ----------------------------------------------------------
  OAUTH_PROVIDERS: [],

  // ----------------------------------------------------------
  //  AI features — powers the "AI overview" button on the Today dashboard
  //  Add your Gemini key to enable real AI summaries.
  //  Get one free at https://aistudio.google.com/apikey
  // ----------------------------------------------------------
  GEMINI_API_KEY:    '',   // ← paste your key here

  // ANTHROPIC_API_KEY: '',   // alternative: Claude (claude-haiku-4-5-20251001)

  // ----------------------------------------------------------
  //  Additional database (future)
  //  If you switch away from Supabase or add a second DB
  // ----------------------------------------------------------
  // DATABASE_URL:  '',
  // DATABASE_NAME: '',

};
