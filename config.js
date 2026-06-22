// Work Planner — public configuration.
// Safe to commit: the Supabase anon key is public by design (protected by Row Level Security).
// For local API keys (Gemini etc.), create a .env file and run: npm run dev
window.APP_CONFIG = {
  SUPABASE_URL:      'https://fisdmsuexkimkzxfxdsx.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_Q96nAsyVEx_zpqzMZDli6g_SoOJa3-2',
  OAUTH_PROVIDERS:   [],
  GEMINI_API_KEY:    '',
  ANTHROPIC_API_KEY: '',
};
