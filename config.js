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
  OAUTH_PROVIDERS: ['google', 'apple'],

  // ----------------------------------------------------------
  //  AI features (future)
  //  Uncomment and fill in when you add AI functionality
  // ----------------------------------------------------------
  // OPENAI_API_KEY:    '',
  // ANTHROPIC_API_KEY: '',
  // AI_MODEL:          'gpt-4o',        // or 'claude-sonnet-4-6'

  // ----------------------------------------------------------
  //  Additional database (future)
  //  If you switch away from Supabase or add a second DB
  // ----------------------------------------------------------
  // DATABASE_URL:  '',
  // DATABASE_NAME: '',

};
