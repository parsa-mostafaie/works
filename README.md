# Works

A single-page application for managing works with live editing, bulk actions, JSON import/export, localStorage persistence, **Jalali (Shamsi) date display**, and optional cross-device cloud sync via **GitHub Gist** — fully accessible from Iran without a VPN.

## Features

- **Live editing** — click ✎ to edit any work in a modal
- **Jalali (Shamsi) dates** — stored as ISO internally, displayed in Persian calendar (۱۵ مهر ۱۴۰۵)
- **Multiple sort modes** — date ascending/descending, updated time, title
- **Add / delete / bulk actions** — multi-select, mark done/active, delete many
- **Filter & search** — by free text, category, status, and even Jalali date text
- **Import / Export JSON** — full data portability
- **LocalStorage persistence** — everything saved automatically
- **Cross-tab sync** — BroadcastChannel + storage events keep tabs in sync
- **Cross-device cloud sync** — via a private GitHub Gist (no VPN needed in Iran)
- **In-app setup helper** — guided token + gist creation with one click
- **PWA-ready** — service worker + manifest for offline use
- **GitHub Pages deployment** — automatic via Actions

## Getting Started

### Local development

Just open `index.html` in a browser, or run a simple static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

### Deployment

Push to `main` — the GitHub Actions workflow deploys to GitHub Pages automatically.

Enable Pages once in your repo settings: **Settings → Pages → Source: GitHub Actions**.

## Dates: Jalali storage & display

- **Storage format:** every work's `date` field is stored as ISO Gregorian `YYYY-MM-DD`, so it's portable, sortable, and sync-safe.
- **Display format:** the UI converts to Jalali using `Utils.formatJalaliDate()` → `۱۵ مهر ۱۴۰۵`, with Persian digits and month names.
- **Editor:** the modal uses a native `<input type="date">` (for a reliable picker) and shows a live Jalali preview under it like `📅 ۱۵ مهر ۱۴۰۵ (۱۴۰۵/۰۷/۱۵)`.
- **Search:** matches both the raw ISO date and the Jalali text, so "مهر" or "1405" both work.
- **Sorting:** uses the underlying ISO date for correct chronological ordering.

The Jalali algorithm is implemented from scratch in `js/utils.js` — no external dependencies.

## Cloud Sync via GitHub Gist

Works syncs across devices through a **private GitHub Gist**. It uses only the `gist` scope on a personal access token, works fine from Iran without a VPN, and is free.

### Quick start

1. Open the app → click **⚙️** → **🔑 Setup Guide**
2. The guide walks you through:
   - Creating a **personal access token** (only the `gist` scope)
   - Creating a **secret gist** with a `works.json` file containing `[]`
   - Copying the **Gist ID** from the URL
3. Paste both values into Settings → **Test Connection** → **Sync Now**
4. Repeat on every device with the same Gist ID and token

### What the app does

- **On demand** (Sync button) or **every 60 s** — pulls remote, merges, pushes
- **Merge strategy:** last-write-wins by `updatedAt`, union of all item IDs
- **Nothing leaves your device** unless you configure a Gist ID and token

### Data model

```json
{
  "id": "id_...",
  "title": "Work title",
  "description": "Optional notes",
  "category": "essay",
  "date": "2026-10-07",
  "tags": ["urgent", "review"],
  "done": false,
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

### Endpoint format accepted

Both forms work in the **Gist ID or URL** field:

- Raw ID: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4`
- Full URL: `https://gist.github.com/your-user/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4`

The app extracts the ID automatically.

## Keyboard Shortcuts

| Keys | Action |
|------|--------|
| `Ctrl/Cmd + K` | Focus search |
| `Ctrl/Cmd + N` | New work |
| `Esc` | Close modal |

## File Structure

```
index.html         main page + setup guide modal + sort dropdown
styles.css         all styles
js/utils.js        helpers + Jalali <-> Gregorian conversion
js/storage.js      localStorage store with change events + cross-tab
js/sync.js         GitHub Gist sync client
js/ui.js           DOM rendering + sorting logic
js/app.js          orchestration + service worker registration
sw.js              service worker (offline cache)
manifest.json      PWA manifest
.github/workflows/deploy.yml
README.md
```

## Notes on the `[hidden]` fix

`styles.css` starts with:

```css
[hidden] { display: none !important; }
```

This ensures the `hidden` attribute always wins over any component `display` rule (e.g. `.modal { display: flex }`). Without this line, `el.hidden = true` in JS has no effect because author CSS beats the browser's default `[hidden] { display: none }`.

## License

MIT
