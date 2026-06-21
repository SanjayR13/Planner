# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
npm start       # serves on http://localhost:3000
npm run dev     # same, without auto-opening a browser tab
```

No build step — the app is a single `index.html` file served statically.

## Architecture

This is a **zero-build, single-file React app**. All application logic lives in `index.html` as JSX compiled at runtime by `@babel/standalone`. There is no bundler, no `node_modules` beyond `serve`, and no TypeScript.

Key runtime dependencies loaded from CDN:
- `@supabase/supabase-js@2` (UMD) — optional cloud sync
- `react@18` + `react-dom@18` (UMD) — UI
- `@babel/standalone` — in-browser JSX transform

**Critical Babel note:** The `<script type="text/babel">` tag must use `data-presets="react-classic"` to force the classic JSX runtime. Newer versions of `@babel/standalone` default to the automatic runtime, which emits ES module `import` statements that crash in a non-module script tag. The `react-classic` preset is registered inline just before the main script tag.

## Configuration

`config.js` is the only file users edit. It sets `window.APP_CONFIG` which `index.html` reads at startup. Keys:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — leave blank to run in local-only mode (localStorage)
- `OAUTH_PROVIDERS` — array of OAuth providers enabled in the Supabase dashboard (`'google'`, `'apple'`, etc.)

The Supabase client is created defensively: if `createClient` throws (e.g. CDN failure, invalid key format), the app falls back to local-only mode instead of showing a blank page.

## Data layer

All state is in React (`useState`). Persistence has two layers that run in parallel:
1. **localStorage** — always written on every mutation (keys: `wp_tasks`, `wp_cats`, `wp_settings`, `wp_name`)
2. **Supabase** — debounced 1.5 s after each mutation, upserts a single `user_data` row keyed by `user_id`

The Supabase schema required in the remote project:
```sql
create table if not exists user_data (
  user_id uuid primary key references auth.users on delete cascade,
  tasks jsonb not null default '[]',
  categories jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table user_data enable row level security;
create policy "own data" on user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## Supabase local dev

The `supabase/` directory has CLI config for local development (`supabase start` / `supabase stop`). The local stack runs on ports 54321 (API), 54322 (DB), 54323 (Studio).
