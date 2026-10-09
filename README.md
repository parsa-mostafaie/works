# Works

A single-page application for managing works (items) with live editing, bulk actions, JSON import/export, localStorage persistence, and optional cross-device cloud sync.

## Features

- **Live editing** — click ✎ to edit any work in a modal
- **Add / delete / bulk actions** — multi-select, mark done/active, delete many
- **Filter & search** — by free text, category, and status
- **Import / Export JSON** — full data portability
- **LocalStorage persistence** — everything saved automatically
- **Cross-tab sync** — BroadcastChannel + storage events keep tabs in sync
- **Cross-device cloud sync** — plug in a JSONBin.io (or compatible) endpoint
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

Push to `main` — the GitHub Actions workflow will deploy to GitHub Pages automatically.

Enable Pages once in your repo settings: **Settings → Pages → Source: GitHub Actions**.

## Cloud Sync Setup (Optional)

The app speaks a simple REST protocol compatible with [JSONBin.io](https://jsonbin.io):

1. Create a free JSONBin account.
2. Create a new bin with `[]` as content.
3. Copy the bin URL (e.g. `https://api.jsonbin.io/v3/b/XXXXXX`) and your Master Key.
4. Open the app → click ⚙️ → paste URL and key → **Sync Now**.

The app will then:
- Pull remote data on demand, or every 60 seconds automatically
- Merge by `id` using `updatedAt` (last-write-wins)
- Push the merged state back

Any REST endpoint that returns a JSON array, or an object with `.record` / `.items` / `.record.items` on `GET`, and accepts a JSON array on `PUT`, will work.

## Data Model

```json
{
  "id": "id_...",
  "title": "Work title",
  "description": "Optional notes",
  "category": "essay",
  "date": "2025-01-15",
  "tags": ["urgent", "review"],
  "done": false,
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

## Keyboard Shortcuts

| Keys | Action |
|------|--------|
| `Ctrl/Cmd + K` | Focus search |
| `Ctrl/Cmd + N` | New work |
| `Esc` | Close modal |

## File Structure

```
index.html         main page
styles.css         all styles
js/utils.js        helpers (uid, debounce, toast, ...)
js/storage.js      localStorage store with change events + cross-tab
js/sync.js         cloud sync client
js/ui.js           DOM rendering
js/app.js          orchestration + service worker registration
sw.js              service worker (offline cache)
manifest.json      PWA manifest
.github/workflows/deploy.yml
README.md
```

## License

MIT
