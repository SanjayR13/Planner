# Work Planner

A personal task planner built as a single HTML file. Works on any device — phone, tablet, or desktop — with optional cross-device sync via Supabase.

---

## Features

- **Task management** — add, edit, complete, and delete tasks
- **Subtasks** — break tasks into steps, each with their own due date and completion state
- **Categories & sub-categories** — collapsible category tree with colour-coded dot indicators
- **Priority flags** — high / medium / low priority with visual indicators
- **Recurring tasks** — daily, weekly, monthly, or yearly repeats
- **Attachments** — link files, URLs, and images to tasks
- **Calendar view** — month grid, agenda list, and timeline showing tasks by due date
- **Progress bars** — per-task completion tracking across subtasks
- **Settings panel** — choose default view, reorder nav tabs, pick a theme (Soft / Vibrant / Mono), switch between Cards and Compact rows layout, pick an accent colour, and enable browser reminders
- **Dark mode** — toggle between light and dark themes
- **Responsive layout** — full desktop sidebar on wide screens, mobile bottom-nav on phones
- **Offline first** — everything saves to localStorage instantly; works with no internet
- **Cross-device sync** — optional Supabase backend syncs your data across devices; stays signed in automatically

---

## Getting Started

### Option A — Local only (no account needed)

1. Open `index.html` in any browser
2. Start adding tasks — everything saves automatically to your browser's local storage
3. Data persists between sessions on the same device

### Option B — Cross-device sync with Supabase

Follow the steps below to sync your data across phone, laptop, and any other device.

#### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New project** and give it a name (e.g. "work-planner")
3. Choose a region close to you and set a database password
4. Wait ~2 minutes for the project to spin up

#### 2. Create the database table

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New query** and paste the following:

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

3. Click **Run** — you should see "Success. No rows returned"

#### 3. Add your credentials to config.js

1. In Supabase, go to **Settings → API**
2. Copy the **Project URL** and **anon public** key
3. Open `config.js` in a text editor and fill in the two fields:

```js
SUPABASE_URL:      'https://your-project.supabase.co',
SUPABASE_ANON_KEY: 'your-anon-key',
```

4. Save the file — no rebuild needed

#### 4. Create your account

1. Open the file in a browser — the app loads immediately in local mode
2. Click the **avatar** in the bottom-left of the sidebar (or top-right on mobile)
3. Enter an optional display name, your email, and a password, then click **Create account**
4. Check your email for a confirmation link and click it
5. Sign in via the avatar — you're connected and will stay signed in automatically

#### 5. Publish to GitHub Pages (optional)

To access the planner from any device via a URL:

1. Create a new **private** GitHub repository
2. Commit both `index.html` and `config.js` (with your credentials filled in) to the repo
3. Go to **Settings → Pages**, set source to `main` branch, root folder
4. Your planner will be live at `https://yourusername.github.io/your-repo-name`
5. Bookmark it on your phone — add to home screen for an app-like experience

> **Privacy note:** The anon key in `config.js` is safe to commit to a private repo — it only grants access to authenticated users' own data. Row Level Security on Supabase ensures no one can read your tasks, even if they find the URL.

---

## Using the App

### Adding a task

**Desktop:** Click the **+ New task** button in the top-right corner  
**Mobile:** Tap the **+** floating button at the bottom-centre

Fill in:
- **Title** — what needs doing (required)
- **Notes** — details, context, links
- **Due date** — when it's due
- **Repeat** — how often it recurs
- **Category** — which group it belongs to
- **Priority** — high, medium, or low
- **Subtasks** — type and press Enter to add steps
- **Attachments** — add file names, URLs, or image references

Press **Add task** or hit **⌘ + Enter** to save.

### Completing tasks

Click or tap the **checkbox** on the left of any task to mark it done. For tasks with subtasks, each subtask has its own checkbox — the progress bar updates as you complete them.

### Filtering tasks

**Desktop:** Click any category or sub-category in the left sidebar  
**Mobile:** Use the filter chips that scroll horizontally below the search bar

Select **All tasks** to clear the filter.

### Searching

Type in the search bar (top of the page) to filter tasks by title or notes. Search and category filter work together.

### Categories

Click the **gear icon** (⚙) next to "Categories" in the sidebar to open the category manager. From there you can:
- Add new top-level categories
- Add sub-categories under any existing category
- Rename categories
- Change category colours using the colour wheel, hex code input, or preset swatches
- Delete categories (tasks in deleted categories move to the first available category)

### Sub-categories

Sub-categories sit under their parent in the sidebar. Click the **chevron arrow** (▶) to expand or collapse a parent's sub-categories — the chevron and the category name are separate click targets so you can expand without changing your filter. When collapsed, a badge shows how many tasks in the sub-categories are still outstanding. Clicking a sub-category filters to just that group; clicking the parent shows tasks across the parent and all its sub-categories.

### Account & sync

Click the **avatar** in the bottom-left of the sidebar (or top-right on mobile) to open the account panel:
- **Not signed in** — enter a display name (optional), email, and password to create an account or sign in
- **Signed in** — your initials appear in the avatar with a green ring; the panel shows your name, email, and a sign-out button

Once signed in, your session persists automatically — you won't need to sign in again on the same device. Your display name is saved locally and shown in the sidebar footer.

### Sync status

A small dot next to your name in the sidebar footer shows sync state:
- **Green** — all changes synced
- **Amber pulsing** — sync in progress
- **Grey** — local only (Supabase not configured, not signed in, or offline)

Changes sync automatically 1.5 seconds after your last edit.

### Calendar view

Click **Calendar** in the nav to see tasks by due date in three sub-views — switch with the tabs at the top right:

- **Month** — month grid; click any day to see that day's tasks
- **Agenda** — chronological list of upcoming days with tasks
- **Timeline** — horizontal bar chart showing when tasks fall in the month

Navigate months with the arrow buttons or click **Today** to jump back.

### Today view

The **Today** page opens with four summary cards — Due today, Overdue, This week, and Completed — followed by the task list grouped by Overdue and Today sections.

### Sorting

Use the sort controls to toggle between:
- **Due date** — soonest first
- **Priority** — high → medium → low, then by date

### Dark mode & appearance

Use the **moon/sun icon** in the sidebar footer (desktop) or header (mobile) to toggle dark mode.

### Settings

Click the **gear icon** (⚙) in the sidebar footer to open Settings:
- **Default view** — which page loads on startup (All Tasks, Calendar, Today, or Upcoming)
- **Tab order** — drag the four nav items into any order; on mobile the first two appear in the tab bar
- **Theme** — Soft (default warm tones), Vibrant (higher contrast), or Mono (greyscale)
- **Task layout** — Cards (spaced with shadows) or Compact rows (dense list)
- **Accent colour** — pick from preset swatches or enter a custom hex value
- **Reminders** — enable browser push notifications for due tasks

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘ + Enter` | Save task in editor |
| `Escape` | Close modal / cancel input |
| `Enter` | Add subtask (when subtask field is focused) |

---

## Data & Privacy

- All data is stored in your **browser's localStorage** — always available, even offline
- With Supabase enabled, data is also stored in your **private database** — only your account can access it
- Sessions persist automatically in localStorage; no cookies are used
- No analytics, no tracking, no third-party data sharing
- The app is entirely self-contained in one HTML file — no server required
- You can export your data at any time by querying your Supabase table directly or copying the localStorage values
