# Work Planner

A personal task planner built as a single HTML file. Works on any device — phone, tablet, or desktop — with optional cross-device sync via Supabase and AI-powered features via Gemini.

---

## Features

- **AI task creation** — describe a task in plain English and the AI extracts the title, due date, priority, category, and subtasks automatically
- **AI overview** — a two-line daily briefing: what's outstanding plus a sharp (and occasionally insulting) note about anything overdue
- **Task management** — add, edit, complete, and delete tasks; undo accidental deletes with a 5-second toast
- **Duplicate tasks** — copy any task with one click to reuse it as a template
- **Subtasks** — break tasks into steps, each with their own due date and completion state
- **Progress bars** — per-task completion percentage tracked across subtasks
- **Bulk actions** — select multiple tasks to complete or delete them all at once
- **Categories & sub-categories** — collapsible 2-level category tree with custom colour-coded dot indicators
- **Priority flags** — high / medium / low priority with visual indicators
- **Recurring tasks** — daily, weekly, monthly, or yearly repeat labels
- **Attachments** — link files, URLs (clickable), and images to tasks
- **Search** — live filtering across task titles, notes, and subtask text
- **Calendar view** — month grid, agenda list, and timeline showing tasks by due date
- **Today dashboard** — hero card with overall progress ring, My tasks status (To Do / In Progress / Done), Active projects with per-category ring charts, and Today's schedule
- **Upcoming view** — future tasks grouped by This week / Later
- **Completion streaks** — tracks how many consecutive days you've completed at least one task
- **Export** — download all your tasks as CSV or JSON for backup or import
- **Settings panel** — choose default view, reorder nav tabs, pick a theme (Soft / Vibrant / Mono), switch between Cards and Compact rows layout, pick an accent colour, and enable browser reminders
- **Demo mode** — unauthenticated visitors always see seed data; nothing writes to storage until signed in
- **Dark mode** — toggle between light and dark themes
- **Responsive layout** — full desktop sidebar on wide screens, mobile bottom-nav on phones
- **Offline first** — everything saves to localStorage instantly; works with no internet
- **Cross-device sync** — optional Supabase backend syncs your data across devices; stays signed in automatically

---

## Getting Started

### Option A — Local only (no account needed)

1. Clone the repo or download `index.html`
2. Run `npm run dev` — this generates `config.js` and serves the app at `http://localhost:3000`
3. Start adding tasks — data saves to your browser's localStorage

### Option B — Cross-device sync with Supabase

#### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New project**, give it a name and set a database password
3. Wait ~2 minutes for the project to spin up

#### 2. Create the database table

In your Supabase project go to **SQL Editor → New query**, paste and run:

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

#### 3. Add your credentials

Copy your **Project URL** and **anon public** key from Supabase **Settings → API**.

Create a `.env` file in the project root:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional — enables AI features
GEMINI_API_KEY=your-gemini-key
```

Run `npm run dev` — it reads `.env` and generates `config.js` automatically before starting the server.

#### 4. Create your account

1. Open `http://localhost:3000` — the app loads in demo mode
2. Click your **avatar** in the sidebar footer
3. Enter your email and a password, then click **Create account**
4. Check your email for a confirmation link and click it
5. Sign in — your session persists automatically

#### 5. Deploy to GitHub Pages

The repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that deploys automatically on every push to `main`.

1. Add secrets in **GitHub → Settings → Secrets → Actions**:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`
2. Go to **Settings → Pages → Source** and set it to **GitHub Actions**
3. Push to `main` — GitHub Actions builds and deploys the site with your credentials injected

> **Privacy note:** The Supabase anon key is safe to commit — it only grants access to authenticated users' own data, protected by Row Level Security. The Gemini API key lives in `.env` (gitignored) locally and in GitHub Secrets for deployment.

---

## Using the App

### Today dashboard

The app opens to the **Today** view, which shows:

- **Hero card** — your name, today's date, an overall progress ring, and two AI buttons
- **My tasks** — three status cards (To Do / In Progress / Done) that navigate to filtered views when clicked
- **Active projects** — per-category cards with circular progress rings; click any to filter to that category
- **Today's schedule** — overdue and today's tasks, with sort controls

### AI features

**AI overview** — click the button in the hero card to get a two-line briefing: what's outstanding and what to tackle next. If anything is overdue, expect a creative insult.

**AI task** — click the **AI task** button and describe your task in plain English:
- `"Call dentist Thursday, high priority"` → Health task, due Thursday, high priority
- `"Prep Q3 slides for Friday — subtasks: outline, draft, review"` → Work task, due Friday, 3 subtasks
- `"Pay electricity bill monthly"` → Finance task, recurring monthly

Press **Enter** or **Create** to submit. The AI extracts title, due date, priority, category, subtasks, and recurrence, then creates the task immediately.

AI features require a `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) in `.env`. They fall back gracefully when no key is configured.

### Adding tasks manually

**Desktop:** Click **+ New task** in the top-right corner  
**Mobile:** Tap the **+** floating button at the bottom-centre

Fill in title, notes, due date, repeat, category, priority, subtasks, and attachments. Press **Add task** or **⌘ + Enter** to save.

### Signing out

Click the **red arrow (→)** icon in the sidebar footer to sign out. The app immediately resets to demo seed data — your real tasks reload next time you sign in.

### Completing tasks

Click the checkbox on the left of any task. For tasks with subtasks, each subtask has its own checkbox and the progress bar updates as you complete them.

### Filtering tasks

**Desktop:** Click any category in the left sidebar  
**Mobile:** Use the filter chips below the search bar

### Categories

Click the **⚙** icon next to "Categories" in the sidebar to open the category manager — add, rename, recolour, or delete categories and sub-categories.

### Calendar view

Three sub-views — switch with the tabs at the top right:

- **Month** — grid; click any day to see tasks due that day
- **Agenda** — chronological day-by-day list
- **Timeline** — horizontal bar chart across the next 14 days

### Sync status

The dot next to your name in the sidebar footer:
- **Green** — all changes synced
- **Amber pulsing** — sync in progress
- **Grey** — local only / offline

### Settings

Click the **⚙** icon in the sidebar footer:
- **Default view**, **Tab order**, **Theme** (Soft / Vibrant / Mono)
- **Task layout** — Cards or Compact rows
- **Accent colour**, **Reminders**
- **Export** — download tasks as CSV or JSON

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘ + Enter` | Save task in editor |
| `Escape` | Close modal / dismiss AI panel |
| `Enter` | Submit AI task / add subtask |

---

## Data & Privacy

- All data is stored in your **browser's localStorage** — always available offline
- With Supabase enabled, data is also stored in your **private database** — only your account can access it
- Unauthenticated visitors always see demo seed data — nothing is saved until signed in
- No analytics, no tracking, no third-party data sharing
- The app is entirely self-contained in one HTML file — no server required
