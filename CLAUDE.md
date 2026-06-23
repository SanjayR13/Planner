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
GEMINI_API_KEY=...        # AI overview + AI task creation + smart reschedule
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

For mobile testing use `viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true`. Always check `page.on('pageerror', ...)` after any UI change.

## Architecture

**Zero-build, single-file React app.** Everything lives in `index.html`:

- **`<style>` block** (lines ~12–330) — all CSS, using CSS custom properties
- **`<script type="text/babel">` block** (lines ~340–end) — all JSX compiled at runtime

CDN dependencies: `@supabase/supabase-js@2`, `react@18`, `react-dom@18`, `@babel/standalone`.

**Critical Babel note:** `<script type="text/babel" data-presets="react-classic">` — the `react-classic` preset is registered inline just before the script tag. Changing this breaks JSX compilation.

## Component reading order (top to bottom in the script block)

1. **Config + Supabase init** — reads `window.APP_CONFIG`; falls back to local-only if init fails
2. **`ICON_PATHS`** — SVG path map; add new icons here (`lock`, `at` added recently)
3. **Data helpers** — `fmtDate`, `parseYmd`, `ymd`, `dateStatus`, `bucketOf`, `sortTasks`
4. **`DEFAULT_CATEGORIES` + `CATEGORIES` global** — mutable global kept in sync via `useEffect` in `AppRoot`
5. **`catStyle` / `catDotColor`** — derive per-category colours from `{h, c, hex}` fields
6. **`aiOverviewLocal`** — local 2-line task summary (no API needed); used as fallback
7. **`Ring`** — SVG circular progress ring used in the hero card and project cards
8. **`StudioDashboard`** — Desktop Today/All tab dashboard: hero card (with AI overview, AI task, smart reschedule), 3-col My tasks status rows, Active projects grid
9. **`MobileHero`** — Mobile-only hero card shown on Today and All Tasks tabs; has its own AI overview, AI task creation, and smart reschedule — separate from `StudioDashboard`
10. **Calendar components** — `MonthGrid`, `AgendaView`, `TimelineView`, `MobileDayList`
11. **`TaskItem`** — single task card (subtasks inline, progress bar, context chips, blocked badge, actions)
12. **`TaskList`** — groups tasks by time bucket or category; passes `allTasks` to `TaskItem` for blocked-by resolution
13. **`TaskEditor`** — new/edit modal (title, notes, NL date, repeat, category, priority, contexts, blocked-by, subtasks, attachments)
14. **`CategoryManager`**, **`SettingsModal`**, **`AuthModal`** — management modals
15. **`EisenhowerView`**, **`WeeklyReview`** — additional view components
16. **`PlannerSurface`** — layout; owns all UI state (`tab`, `sort`, `search`, `catFilter`, `contextFilter`, `bulkMode`, reschedule state, etc.)
17. **`AppRoot`** — owns all data state; wires Supabase auth, `persist()` helper, streak, undo

## Mobile layout

Mobile uses a 4-tab bottom nav: the first 3 tabs from `orderedTabs` plus a fixed **Add** button:

```js
const mTabs = [...orderedTabs.slice(0, 3), 'add'];
```

The `'add'` entry renders as an accent-coloured tab icon that opens `TaskEditor`. There is no floating action button — `.fab-wrap` / `.fab` CSS is unused.

Available tab IDs (`TAB_DEF`): `today`, `all`, `calendar`, `matrix`, `review`. Desktop shows all tabs in `orderedTabs`; mobile shows only the first 3.

**Mobile keyboard / viewport stability:**
- `body { position: fixed; overflow: hidden; width: 100% }` — prevents iOS Safari from scrolling the viewport when a keyboard appears
- Inline `<script>` in `<head>` sets `--app-h` to `window.innerHeight` on load, only updating on width changes (orientation), never on height-only changes (keyboard). `.mobile` uses `height: var(--app-h)` so it never resizes when the keyboard opens.
- `interactive-widget=resizes-visual` in the viewport meta — Chrome 108+ lets the keyboard resize only the visual viewport, not the layout.
- All inputs/textareas/selects inside `.mobile` are forced to `font-size: 16px !important` — iOS Safari auto-zooms on any input with `font-size < 16px`.

**Mobile-specific CSS overrides (all scoped to `.mobile`):**
- `.mobile .field-row { flex-direction: column }` — stacks Due Date and Repeat vertically in TaskEditor
- `.mobile .hero-foot { flex-direction: column; align-items: flex-start }` — hero count + actions stack instead of fighting for one row
- `.mobile .hero-ai { padding: 6px 10px; font-size: 12px }` — all 3 hero buttons fit on one row
- `.mobile .seg button { padding: 5px 9px; font-size: 12px }` — Month/Agenda/Timeline all fit in calendar header
- `.mobile .subtask-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis }` — subtask titles truncate instead of wrapping
- `.mobile .task-actions button[title="Duplicate"] { display: none }` — duplicate hidden to save horizontal space

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

### Task schema

Every task has these fields (`blankTask()` provides defaults for new tasks):

| Field | Type | Notes |
|---|---|---|
| `id` | string | `uid()` generated |
| `title` | string | |
| `notes` | string | |
| `categoryId` | string | references a category id |
| `priority` | `'high'`\|`'med'`\|`'low'`\|null | |
| `due` | `'YYYY-MM-DD'`\|null | |
| `recurring` | `'none'`\|`'daily'`\|`'weekly'`\|`'monthly'` | |
| `done` | boolean | |
| `subtasks` | `{id,title,due,done}[]` | |
| `attachments` | `{id,type,name,meta}[]` | type: `'file'`\|`'link'`\|`'image'` |
| `blockedBy` | string[] | IDs of tasks that must complete first |
| `contexts` | string[] | e.g. `['home','laptop']` — from `CONTEXT_PRESETS` |

`sortTasks(arr, sort, allTasks?)` — the optional `allTasks` param is used to push blocked tasks to the bottom of each group. `matchSearch` includes `contexts` in its search (supports `@tag` prefix).

### Context tags

`CONTEXT_PRESETS = ['home','work','laptop','calls','errands','online']`. Picker in `TaskEditor`; chips shown on task cards; filter row on mobile (below category chips) and sidebar section on desktop. `contextFilter` state lives in `PlannerSurface` and filters `base` tasks.

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
{ defaultTab:'today', tabOrder:['today','all','calendar'],
  theme:'soft', listLayout:'cards', accent:'#708871',
  subtaskMode:'inline', calendarDefault:'month', notificationsEnabled:false }
```

`AppRoot` runs a one-time migration on init: resets `defaultTab:'all'` → `'today'`, strips any tab IDs not in `TAB_DEF`, and resets `tabOrder` to default if the first entry was `'all'`.

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

All AI features use the same priority chain:
1. **Gemini** (`GEMINI_API_KEY`) — `gemini-2.5-flash` via REST
2. **Anthropic** (`ANTHROPIC_API_KEY`) — `claude-haiku-4-5-20251001`
3. **Local fallback** — always works, no key required

AI features exist in both `StudioDashboard` (desktop) and `MobileHero` (mobile) — the logic is duplicated between them, not shared.

### AI overview (`runAi`)
Returns exactly 2 lines: outstanding summary + funny roast if overdue, motivational nudge if not. Falls back to `aiOverviewLocal` on any API error.

### AI task creation (`runAiTask`)
User types a natural-language description. AI returns JSON: `title`, `notes`, `due`, `priority`, `categoryId`, `subtasks[]`, `recurring`. Task created immediately via `onCreateTask`. Falls back to a bare title-only task if parsing fails.

### Smart reschedule (`handleReschedule` in `PlannerSurface`)
Appears in the hero card when overdue tasks exist. Sends overdue tasks to the AI which returns `[{id, due}]` with suggested new dates. Fallback (no API key): high priority → today, medium → tomorrow, low → +3 days. Passed as `onReschedule` prop to both `StudioDashboard` and `MobileHero`.

## Supabase local dev

```bash
supabase start   # ports: 54321 (API), 54322 (DB), 54323 (Studio)
supabase stop
```
