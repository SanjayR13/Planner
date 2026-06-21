# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
npm start       # serves on http://localhost:3000
npm run dev     # same, without auto-opening a browser tab
```

No build step — the app is a single `index.html` file served statically.

## Visual verification

`playwright-core` is installed in `node_modules/`. Use it with the local Chromium:

```js
const { chromium } = require('./node_modules/playwright-core');
const browser = await chromium.launch({
  executablePath: '/Users/sanjayruparelia/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  headless: true, args: ['--no-sandbox']
});
```

Always check for console errors with `page.on('console', ...)` and `page.on('pageerror', ...)` after any UI change.

## Architecture

**Zero-build, single-file React app.** Everything lives in `index.html`:

- **`<style>` block** (lines ~12–200) — all CSS, using CSS custom properties
- **`<script type="text/babel">` block** (lines ~215–end) — all JSX compiled at runtime

Key runtime dependencies loaded from CDN:
- `@supabase/supabase-js@2` (UMD)
- `react@18` + `react-dom@18` (UMD)
- `@babel/standalone` — in-browser JSX transform

**Critical Babel note:** The `<script type="text/babel">` tag must use `data-presets="react-classic"`. The `react-classic` preset is registered inline just before the main script tag. Changing this will break JSX compilation.

## Component structure (inside the single script block)

Reading top to bottom:

1. **Config + Supabase init** — reads `window.APP_CONFIG`, creates `sb` client defensively
2. **`ICON_PATHS`** — SVG path map; add new icons here
3. **Data helpers** — date utils (`fmtDate`, `parseYmd`, `ymd`, `dateStatus`), sort/bucket functions
4. **`DEFAULT_CATEGORIES` + `CATEGORIES` global** — mutable global kept in sync via `useEffect` in `AppRoot`
5. **`catStyle` / `catDotColor`** — derive per-category colours from `{h, c, hex}` fields
6. **Calendar components** — `MonthGrid`, `AgendaView`, `TimelineView`, `MobileDayList`
7. **`TaskItem`** — single task card (subtasks, progress bar, actions)
8. **`TaskList`** — groups tasks by time bucket or category, renders `TaskItem`s
9. **`TaskEditor`** — new/edit modal (title, notes, due date, NL date, repeat, category, priority, subtasks, attachments)
10. **`CategoryManager`** — colour-picker modal for managing categories
11. **`SettingsModal`** — default view, tab order, theme, layout, accent colour, reminders, export
12. **`AuthModal`** — sign-in / sign-up / OAuth
13. **`EisenhowerView`**, **`WeeklyReview`** — additional view components
14. **`PlannerSurface`** — top-level layout component; owns all UI state (`tab`, `sort`, `search`, `catFilter`, `bulkMode`, etc.)
15. **`AppRoot`** — owns all data state (`tasks`, `categories`, `settings`, `dark`, `session`, `streak`); wires Supabase auth + sync

## Design system

Font: **Poppins** (400/500/600/700/800) loaded from Google Fonts.

All colours and radii are CSS custom properties on `:root`. Key tokens:

| Token | Value | Purpose |
|---|---|---|
| `--bg` | `#FDECD0` | Warm peach page background |
| `--surface` | `#FFFFFF` | Card / panel background |
| `--surface-2` | `#FEF5E4` | Subtle secondary surface |
| `--accent` | `#1B6B5C` | Primary teal (overridable via Settings) |
| `--red` / `--amber` / `--green` | — | Priority and status colours |
| `--r-lg` | `24px` | Task card radius |
| `--r-xl` | `32px` | Modal radius |

Dark mode is applied by adding `.dark` to the `.surface` element; all tokens are overridden in `.surface.dark { ... }`.

Per-category colour is driven by `{h, c, hex}` on each category object. `catStyle()` and `catDotColor()` compute the actual CSS from these fields.

## Configuration

`config.js` is the only file users edit. It sets `window.APP_CONFIG`:

- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — leave blank for local-only mode
- `OAUTH_PROVIDERS` — array of enabled OAuth providers (`'google'`, `'apple'`, etc.)

## Data layer

All state lives in React (`useState` in `AppRoot`). Two parallel persistence layers:

1. **localStorage** — written synchronously on every mutation
2. **Supabase** — debounced 1.5 s after each mutation, upserts one `user_data` row

### localStorage keys

| Key | Contents |
|---|---|
| `wp_tasks` | Task array (JSON) |
| `wp_cats` | Category array (JSON) |
| `wp_settings` | Settings object (JSON) |
| `wp_name` | Display name (string) |
| `wp_dark` | Dark mode boolean |
| `wp_streak` | `{count, last, longest}` |

### Settings defaults (`DEFAULT_SETTINGS`)

```js
{ defaultTab:'all', tabOrder:['all','calendar','today','upcoming'],
  theme:'soft', listLayout:'cards', accent:'#1B6B5C',
  subtaskMode:'collapsible', calendarDefault:'month',
  notificationsEnabled:false }
```

The `theme` field drives `vibrant` / `mono` boolean flags passed to every component. `listLayout` switches between `'cards'` and `'rows'`. The `accent` value is injected as `--accent` on the root element via inline style.

### Supabase schema

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

```bash
supabase start   # ports: 54321 (API), 54322 (DB), 54323 (Studio)
supabase stop
```
