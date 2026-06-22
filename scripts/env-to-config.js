#!/usr/bin/env node
// Reads .env and writes config.local.js (API keys only).
// config.js is committed separately with safe public credentials.
// Run automatically via the predev / prestart npm hooks.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');

if (!fs.existsSync(envPath)) {
  console.log('[env-to-config] No .env found — skipping config.local.js generation.');
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

const content = `// Auto-generated from .env — do not commit (gitignored).
// Extends window.APP_CONFIG with local API keys.
Object.assign(window.APP_CONFIG || {}, {
  GEMINI_API_KEY:    '${get('GEMINI_API_KEY')}',
  ANTHROPIC_API_KEY: '${get('ANTHROPIC_API_KEY')}',
});
`;

fs.writeFileSync(path.join(root, 'config.local.js'), content);
console.log('[env-to-config] config.local.js written from .env ✓');
