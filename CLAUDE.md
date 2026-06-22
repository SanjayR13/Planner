# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
npm run dev    # generates config.js from .env, then serves on http://localhost:3000
npm start      # same but opens browser tab
```

Both commands run `scripts/env-to-config.js` first (via `predev`/`prestart` hooks) — this reads `.env` and writes `config.js` so the browser can access env vars. **Never edit `config.js` directly**; it is gitignored and regenerated on every start.

## Configuration

`.env` is the source of truth for all credentials:

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...        # powers the AI overview button
ANTHROPIC_API_KEY=...     # optional alternative to Gemini
```

`config.example.js` is the committed blank template. `scripts/env-to-config.js` does the translation.

## Visual verification

`playwright-core` is installed in `node_modules/`. Use it with the local Chromium:

```js
const { chromium } = require('./node_modules/playwright-core');
const browser = await chromium.launch({
  executablePath: '/Users/sanjayruparelia/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  headless: true, args: ['--no-sandbox']
});
```

Always check `page.on('pageerror', ...)` after any UI change. Clear localStorage with `page.evaluate(() => localStorage.clear())` before testing default state.

## Architecture

**Zero-build, single-file React app.** Everything lives in `index.html`:

- **`<style>` block** (lines ~12–300) — all CSS, using CSS custom properties
- **`<script type="text/babel">` block** (lines ~315–end) — all JSX compiled at runtime

CDN dependencies: `@supabase/supabase-js@2`, `react@18`, `react-dom@18`, `@babel/standalone`.

**Critical Babel note:** `<script type="text/babel" data-presets="react-classic">` — the `react-classic` preset is registered inline just before the script. Changing this breaks JSX compilation.

## Component reading order (top to bottom in the script block)

1. **Config + Supabase init** — reads `window.APP_CONFIG`; falls back to local-only if Supabase init fails
2. **`ICON_PATHS`** — SVG path map; add new icons here
3. **Data helpers** — `fmtDate`, `parseYmd`, `ymd`, `dateStatus`, `bucketOf`, `sortTasks`
4. **`DEFAULT_CATEGORIES` + `CATEGORIES` global** — mutable global kept in sync via `useEffect` in `AppRoot`
5. **`catStyle` / `catDotColor`** — derive per-category colours from `{h, c, hex}` fields
6. **`aiOverviewLocal`** — generates a smart local task summary without an API key
7. **`Ring`** — SVG circular progress component used in the hero card and project cards
8. **`StudioDashboard`** — hero card, 3-col "My tasks" status rows, project grid; shown on the Today tab
9. **Calendar components** — `MonthGrid`, `AgendaView`, `TimelineView`, `MobileDayList`
10. **`TaskItem`** — single task card (subtasks inline, progress bar, actions)
11. **`TaskList`** — groups tasks by time bucket or category
12. **`TaskEditor`** — new/edit modal (title, notes, NL date, repeat, category, priority, subtasks, attachments)
13. **`CategoryManager`**, **`SettingsModal`**, **`AuthModal`** — management modals
14. **`EisenhowerView`**, **`WeeklyReview`** — additional view components
15. **`PlannerSurface`** — layout; owns all UI state (`tab`, `sort`, `search`, `catFilter`, `bulkMode`, etc.)
16. **`AppRoot`** — owns all data state; wires Supabase auth, `persist()` helper, streak, undo

## Design system (`skin-studio`)

The surface always has `skin-studio` in its className. This skin is defined in CSS after the base rules and overrides the warm-peach `:root` palette with a clean neutral one:

| Token (studio light) | Value |
|---|---|
| `--bg` | `oklch(0.976 0.0015 250)` — very light gray |
| `--surface` | `oklch(1 0 0)` — pure white |
| `--accent` | user-configurable, default `#708871` |

Key studio-specific CSS patterns:
- Nav items, chips, buttons, icon-buttons all get `border-radius: 99px` via `.skin-studio` selectors
- Modal head gets `background: var(--accent); color: #fff` — no border-bottom
- `.desktop.skin-studio .sidebar` — white background, no border, subtle box-shadow
- `.desktop.skin-studio .status-list` — overrides flex column to 3-column grid

Dark mode: `.surface.dark` overrides tokens. Studio dark uses near-black `oklch(0.04 0 0)` bg.

Per-category colour: `{h, c, hex}` fields → `catStyle()` / `catDotColor()`. `hex` is preferred; `h`/`c` are oklch hue/chroma fallbacks.

## Data layer

All state in `AppRoot`. Two persistence layers gated on authentication:

```
persist(tasks, cats?) — only writes to localStorage when !IS_SUPABASE || session exists
scheduleSync(tasks, cats) — debounced 1.5s Supabase upsert, already gated on session
```

**Demo mode** (IS_SUPABASE configured but no session): `tasks` and `categories` always initialise from `DEFAULT_SEED` / `DEFAULT_CATEGORIES`. Nothing writes to localStorage. Sign-out resets state back to seed. An amber banner warns the user.

**Local-only mode** (IS_SUPABASE not configured): localStorage used unconditionally, current behaviour.

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
{ defaultTab:'today', tabOrder:['today','upcoming','all','calendar'],
  theme:'soft', listLayout:'cards', accent:'#708871',
  subtaskMode:'inline', calendarDefault:'month',
  notificationsEnabled:false }
```

`AppRoot` runs a one-time migration on init: if saved settings have old defaults (`defaultTab:'all'`, `subtaskMode:'collapsible'`, `tabOrder[0]==='all'`), they are upgraded and re-saved to localStorage.

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

## AI overview

`StudioDashboard` contains the AI overview button. Priority chain:
1. **Gemini** (`GEMINI_API_KEY` in `.env`) — `gemini-2.0-flash` via REST
2. **Anthropic** (`ANTHROPIC_API_KEY` in `.env`) — `claude-haiku-4-5-20251001`
3. **`aiOverviewLocal`** — always available; analyses task data locally (no API needed)

Any API error (including 429 rate-limit) falls through to `aiOverviewLocal`.

## Supabase local dev

```bash
supabase start   # ports: 54321 (API), 54322 (DB), 54323 (Studio)
supabase stop
```
