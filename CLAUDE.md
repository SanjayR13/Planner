# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
npm run dev    # generates config.local.js from .env, then serves on http://localhost:3000
npm start      # same but opens a browser tab
```

Both commands run `scripts/env-to-config.js` first (via `predev`/`prestart` hooks). This reads `.env` and writes `config.local.js` (API keys only). `config.js` is committed separately with the public Supabase credentials.

## Configuration files

| File | Tracked | Purpose |
|---|---|---|
| `config.js` | ✅ committed | Public credentials: Supabase URL + anon key |
| `config.local.js` | ❌ gitignored | Local API keys: Gemini, Anthropic |
| `.env` | ❌ gitignored | Source of truth — `npm run dev` reads this |
| `config.example.js` | ✅ committed | Blank template for manual setup |

`index.html` loads `config.js` first, then tries to load `config.local.js` via a synchronous XHR (silent no-op if absent — e.g. on GitHub Pages). Both merge into `window.APP_CONFIG`.

`.env` keys:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...        # AI overview + AI task creation
ANTHROPIC_API_KEY=...     # optional alternative
```

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` — GitHub Actions workflow triggered on every push to `main`. It generates `config.local.js` from repository secrets (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`), then deploys via `actions/deploy-pages`. The committed `config.js` provides the Supabase credentials at runtime without needing secrets.

To push changes to the workflow file the GitHub token needs `workflow` scope — if not available, edit `.github/workflows/deploy.yml` in the GitHub UI instead.

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

- **`<style>` block** (lines ~12–320) — all CSS, using CSS custom properties
- **`<script type="text/babel">` block** (lines ~330–end) — all JSX compiled at runtime

CDN dependencies: `@supabase/supabase-js@2`, `react@18`, `react-dom@18`, `@babel/standalone`.

**Critical Babel note:** `<script type="text/babel" data-presets="react-classic">` — the `react-classic` preset is registered inline just before the script tag. Changing this breaks JSX compilation.

## Component reading order (top to bottom in the script block)

1. **Config + Supabase init** — reads `window.APP_CONFIG`; falls back to local-only if init fails
2. **`ICON_PATHS`** — SVG path map; add new icons here
3. **Data helpers** — `fmtDate`, `parseYmd`, `ymd`, `dateStatus`, `bucketOf`, `sortTasks`
4. **`DEFAULT_CATEGORIES` + `CATEGORIES` global** — mutable global kept in sync via `useEffect` in `AppRoot`
5. **`catStyle` / `catDotColor`** — derive per-category colours from `{h, c, hex}` fields
6. **`aiOverviewLocal`** — local 2-line task summary (no API needed); used as fallback
7. **`Ring`** — SVG circular progress ring used in the hero card and project cards
8. **`StudioDashboard`** — Today tab dashboard: hero card (with AI overview + AI task panels), 3-col My tasks status rows, Active projects grid. Props: `tasks`, `dark`, `displayName`, `accent`, `onToggleDark`, `onPickCat`, `onAdd`, `onPickStatus`, `onCreateTask`
9. **Calendar components** — `MonthGrid`, `AgendaView`, `TimelineView`, `MobileDayList`
10. **`TaskItem`** — single task card (subtasks inline, progress bar, actions)
11. **`TaskList`** — groups tasks by time bucket or category
12. **`TaskEditor`** — new/edit modal (title, notes, NL date, repeat, category, priority, subtasks, attachments)
13. **`CategoryManager`**, **`SettingsModal`**, **`AuthModal`** — management modals
14. **`EisenhowerView`**, **`WeeklyReview`** — additional view components
15. **`PlannerSurface`** — layout; owns all UI state (`tab`, `sort`, `search`, `catFilter`, `bulkMode`, etc.)
16. **`AppRoot`** — owns all data state; wires Supabase auth, `persist()` helper, streak, undo

## Design system (`skin-studio`)

The surface always has `skin-studio` in its className. Defined in CSS after the base rules, overriding the warm-peach `:root` palette:

| Token (studio light) | Value |
|---|---|
| `--bg` | `oklch(0.976 0.0015 250)` — very light gray |
| `--surface` | `oklch(1 0 0)` — pure white |
| `--accent` | user-configurable, default `#708871` |

Key studio-specific CSS patterns:
- Nav items, chips, buttons, icon-buttons: `border-radius: 99px`
- Modal head: `background: var(--accent); color: #fff; border-bottom: none`
- `.desktop.skin-studio .sidebar` — white bg, no border, subtle box-shadow
- `.desktop.skin-studio .status-list` — flex column overridden to 3-column grid

Dark mode: `.surface.dark` overrides tokens; studio dark uses near-black `oklch(0.04 0 0)`.

Per-category colour: `{h, c, hex}` on each category → `catStyle()` / `catDotColor()`. `hex` is preferred; `h`/`c` are oklch fallbacks.

## Data layer

All state in `AppRoot`. Two persistence layers gated on authentication:

```
persist(tasks, cats?) — only writes to localStorage when !IS_SUPABASE || session exists
scheduleSync(tasks, cats) — debounced 1.5s Supabase upsert, already gated on session
```

**Demo mode** (IS_SUPABASE configured, no session): tasks/categories always init from `DEFAULT_SEED`/`DEFAULT_CATEGORIES`. Nothing writes to localStorage. Sign-out resets state to seed. Amber banner shown.

**Local-only mode** (IS_SUPABASE not configured): localStorage used unconditionally.

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
  subtaskMode:'inline', calendarDefault:'month', notificationsEnabled:false }
```

`AppRoot` runs a one-time migration on init: upgrades old defaults (`defaultTab:'all'`, `subtaskMode:'collapsible'`, `tabOrder[0]==='all'`) and re-saves.

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

## AI features

Both AI features live in `StudioDashboard` and share the same API priority chain:
1. **Gemini** (`GEMINI_API_KEY`) — `gemini-2.0-flash` via REST
2. **Anthropic** (`ANTHROPIC_API_KEY`) — `claude-haiku-4-5-20251001`
3. **Local fallback** — always works, no key required

### AI overview (`runAi`)
Returns exactly 2 lines: outstanding summary + funny roast if overdue, motivational nudge if not. Falls back to `aiOverviewLocal` on any API error.

### AI task creation (`runAiTask`)
User types a natural-language description. A structured prompt sends today's date, relative date mappings, and the available category list to the AI. The AI returns JSON with: `title`, `notes`, `due`, `priority`, `categoryId`, `subtasks[]`, `recurring`. The task is created immediately via `onCreateTask` prop (wired to `root.saveTask`). Falls back to a bare title-only task if parsing fails.

## Supabase local dev

```bash
supabase start   # ports: 54321 (API), 54322 (DB), 54323 (Studio)
supabase stop
```
