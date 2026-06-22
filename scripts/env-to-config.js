#!/usr/bin/env node
// Reads .env and writes config.js so the browser can access env vars.
// Run automatically via the predev / prestart npm hooks.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');

if (!fs.existsSync(envPath)) {
  console.log('[env-to-config] No .env found — skipping config.js generation.');
  process.exit(0);
}

const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = trimmed.indexOf('=');
  if (eq < 1) return;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  env[key] = val;
});

const get = (k) => (env[k] || '').replace(/'/g, "\\'");

const content = `// Auto-generated from .env — do not edit directly, do not commit.
window.APP_CONFIG = {
  SUPABASE_URL:      '${get('SUPABASE_URL')}',
  SUPABASE_ANON_KEY: '${get('SUPABASE_ANON_KEY')}',
  OAUTH_PROVIDERS:   [],

  GEMINI_API_KEY:    '${get('GEMINI_API_KEY')}',
  ANTHROPIC_API_KEY: '${get('ANTHROPIC_API_KEY')}',
};
`;

fs.writeFileSync(path.join(root, 'config.js'), content);
console.log('[env-to-config] config.js written from .env ✓');
