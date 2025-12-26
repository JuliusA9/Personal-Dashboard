# Copilot instructions for Personal Dashboard

Purpose: provide concise, actionable context for AI coding agents to be immediately productive in this small client-only dashboard project.

## Quick facts ✅
- Single-page client app: open `index.html` in a browser (or run a simple static server such as `python -m http.server`) to run.
- Files of interest: `index.html`, `app.js`, `styles.css`.
- No build system, no tests, no external dependencies.

## Big picture (architecture & why) 🔧
- This is a tiny client-side SPA: UI declared in `index.html`, application logic in `app.js`, styles in `styles.css`.
- State is entirely in-memory: the `tasks` array in `app.js` is the single source of truth and is not persisted to disk or remote services.
- UI is rendered from state via `render()` which re-builds the DOM for visible tasks and computes progress via `computeProgress()`.

## Key implementation patterns and examples 💡
- State and rendering
  - `tasks` array (top of `app.js`) stores objects: `{ id, title, category, dueDate, done, createdAt }`.
  - Use `addTask()` to add, and `render()` to update the DOM.
  - Example: filtering is performed by `applyFilters()` (filters: view, category, search); sorting uses dueDate then createdAt.

- Editing flow
  - `editingId` indicates which task is in edit mode; when set, `render()` replaces static task view with inputs and Save/Cancel buttons.
  - Save updates the `tasks` array directly (found in the Save handler inside `render()`).

- Date handling
  - Dates use ISO `YYYY-MM-DD` strings (see `todayISO()` and `formatDateHuman()` for parsing/formatting).
  - `computeProgress()` compares `dueDate === todayISO()` to determine "today" tasks.

- Theme
  - Theme toggle manipulates `document.documentElement.dataset.theme` (the app sets `data-theme="light" at startup in `app.js`; clicking the Toggle theme button flips between "light" and "dark").

## Important notes & gotchas ⚠️
- Categories are hard-coded in two places:
  - `index.html` select options (`taskCategory`, `categoryFilter`)
  - `app.js` edit-mode category list (`["School","Work","Gym","Life"]`)
  Keep them in sync or centralize if adding/removing categories.
- State is ephemeral: `tasks` is in-memory and not persisted — refreshing the page clears tasks. When adding persistence, update initialization and `addTask()` accordingly.
- Date format and today logic:
  - Use ISO `YYYY-MM-DD` strings for `dueDate` (see `todayISO()`); comparisons use strict string equality.
- UI is rendered entirely by `render()`; avoid mutating the DOM outside `render()` to keep state consistent.
- There are no tests or build steps in this repo.

## How to run & manual validation 🧪
- Run locally: open `index.html` in a browser or run `python -m http.server` and open http://localhost:8000
- Manual checks for PRs:
  1. Add task (with/without due date) and confirm it appears in list.
  2. Edit task (enter edit mode), change title/category/due date, Save and confirm changes persist in UI.
  3. Delete task and confirm it's removed; check progress and counts update.
  4. Toggle theme and verify UI colors switch.
  5. Test filters (view today/completed/all, category, and search).
  6. Test responsive layout under 900px and 420px.

## Quick dev tips 💡
- Use the browser console to inspect `tasks` (e.g., `tasks`) and call `addTask()` for quick testing.
- When refactoring UI, ensure `render()` still rebuilds necessary pieces and that `editingId` logic is preserved.

---

If you'd like, I can:
- Add line-numbered references or example code snippets for the edit/save flow, or
- Centralize category definitions into a single source and update `index.html` & `app.js` accordingly.

Please tell me which you'd prefer.