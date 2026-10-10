# Works

A Persian-first, RTL, single-page task manager with a modern **glassmorphism UI**, inline **SVG icon system**, **Jalali (Shamsi) calendar** with a colorful month view, smart priority sorting, JSON import/export, localStorage persistence, and optional cross-device sync via a private **GitHub Gist** — fully accessible from Iran without a VPN.

---

## ✨ Features

| | |
|---|---|
| 🎨 **Glassmorphism UI** | Gradient background, animated blurred orbs, translucent panels with `backdrop-filter: blur(20px) saturate(180%)` |
| 🎯 **Inline SVG icons** | Feather-style icon set built from scratch — no emoji, no external library, no font dependency |
| 📅 **Jalali calendar** | Full Persian calendar with a colorful month grid, per-day event dots, legend, and expandable day summary |
| 🗓 **Jalali date picker** | Custom Shamsi picker built on top of the calendar modal — replaces native `<input type="date">` |
| 🔢 **Auto Persian digits** | All numeric display is Persian; text inputs auto-convert typed Latin digits to Persian on the fly |
| 🧠 **Smart priority sorting** | Three tiers: active+future (top), active+past (middle, red tint), done (bottom) — regardless of the sort mode |
| 🔗 **Multiple links per item** | `Label \| url` or bare `url`, one per line; rendered as clickable chips |
| 🏷 **Tags & categories** | Free-form tags with `#` and category chips; categories drive the calendar colors |
| 📥📤 **Import / Export JSON** | Full data portability with merge-or-replace prompt |
| 💾 **Local-first** | Everything saved to `localStorage` instantly |
| 🔄 **Cross-tab sync** | BroadcastChannel + `storage` event keep tabs in sync on the same device |
| ☁️ **Cross-device sync** | Optional GitHub Gist backend with an in-app 5-step setup guide |
| 📱 **PWA ready** | Service worker + manifest, offline-capable |
| 🚀 **Zero build** | Vanilla HTML/CSS/JS — open `index.html` and it just works |
| ⚙️ **Auto-deploy** | GitHub Actions workflow publishes to GitHub Pages on every push to `main` |

---

## 🚀 Getting Started

### Run locally

No build step. Either open `index.html` directly in a browser, or serve it locally:

```bash
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

Then visit http://localhost:8000.

### Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` — the workflow deploys automatically.
5. Your app will be live at `https://<user>.github.io/<repo>/`.

---

## 🗂 Project Structure

```
index.html               Main page + modals (item editor, settings, guide, calendar)
styles.css               Glassmorphism theme, RTL layout, calendar styles
manifest.json            PWA manifest (fa / rtl)
sw.js                    Service worker — offline cache
.github/workflows/
  deploy.yml             GitHub Pages deployment
js/
  utils.js               Jalali ↔ Gregorian conversion, SVG icons, Persian digits, URL parsing
  storage.js             localStorage store with change events + cross-tab BroadcastChannel
  sync.js                GitHub Gist sync client (pull / merge / push)
  calendar.js            Jalali calendar view + date picker
  ui.js                  List rendering, filtering, priority sorting
  app.js                 Orchestration, event wiring, service worker registration
```

---

## 📅 Jalali (Shamsi) Dates

All dates are stored internally as **ISO Gregorian** (`YYYY-MM-DD`) for portability and correct chronological sorting, and rendered as **Jalali** everywhere in the UI.

### Conversion

The Persian calendar conversion is implemented from scratch in `js/utils.js` — no external dependency:

```js
Utils.gregorianToJalali(2026, 10, 7);   // → [1405, 7, 15]
Utils.jalaliToGregorian(1405, 7, 15);   // → [2026, 10, 7]
Utils.isoToJalali('2026-10-07');        // → [1405, 7, 15]
Utils.jalaliToIso(1405, 7, 15);         // → '2026-10-07'
```

### Formatting

```js
Utils.formatJalaliDate('2026-10-07');   // → '۱۵ مهر ۱۴۰۵'
Utils.formatJalaliShort('2026-10-07');  // → '۱۴۰۵/۰۷/۱۵'
Utils.todayJalali();                    // → '۱۸ مهر ۱۴۰۵' (today)
```

### Leap year

Leap years follow the standard 33-year cycle, checked via:

```js
Utils.isLeapJalali(1403);   // → true
Utils.jalaliMonthDays(1403, 12); // → 30
Utils.jalaliMonthDays(1404, 12); // → 29
```

### Date picker

The item editor uses a **custom Jalali picker** instead of `<input type="date">`:

- Click the date field → opens the calendar modal in **pick mode**.
- Navigate months, click a day → closes and fills the field.
- Shows the formatted Persian date + short form + a "past" hint if the date is in the past.
- A dedicated **clear** button removes the date.

---

## 🗓 Calendar Modal

Click the calendar icon in the header to open the **colorful Jalali calendar**:

- **Month navigation** — previous / next, with an "امروز" (Today) button.
- **Week starts Saturday** — columns: ش ی د س چ پ ج.
- **Today** — gradient border and soft glow.
- **Selected day** — filled with the primary gradient.
- **Event dots** — up to 4 colored dots per day (colors match the category); `+N` badge for more.
- **Legend** — quick reference for category colors.
- **Selected day panel** — expandable list of events with:
  - Colored side bar per category
  - Title, description (2-line clamp, expand on click)
  - Inline links
  - Edit button → opens the item editor

### Category colors

| Category | Color |
|---|---|
| بیوانفورماتیک | `#10b981` (emerald) |
| کارسوق سمپاد | `#8b5cf6` (violet) |
| المپیاد | `#f59e0b` (amber) |
| جشنواره | `#ec4899` (pink) |
| فناوری و برنامه‌نویسی | `#3b82f6` (blue) |
| علوم شناختی | `#14b8a6` (teal) |
| مطالعه | `#6366f1` (indigo) |
| کنگره | `#06b6d4` (cyan) |
| پژوهش و فناوری | `#d946ef` (fuchsia) |
| هوش مصنوعی | `#0ea5e9` (sky) |
| سایر | `#94a3b8` (slate) |

Any unknown category is hashed to a stable HSL color.

---

## 🧠 Priority Sorting

Regardless of the sort mode you pick, items are grouped into three priority tiers:

| Tier | Condition | Visual |
|---|---|---|
| **0** | Active + date is today or in the future | Normal |
| **1** | Active + date is in the past (even if not marked done) | Amber border, yellow-tinted background, red date chip |
| **2** | Marked as done (any date) | Dimmed, strikethrough title |

Within each tier, your chosen sort applies: date ascending/descending, last updated, or alphabetical.

This means **overdue items automatically sink below active future items** — but stay visible above completed ones — so you can spot what's slipped without it cluttering the top of the list.

---

## 🔢 Persian Digits

Two-way digit handling:

- **Display** — every number (counts, stats, dates, day numbers) goes through `Utils.toPersianDigits()`.
- **Input** — every text input and textarea (except those marked `data-no-persianify`) auto-converts typed Latin digits to Persian in real time via the `input` event, preserving the caret position.
- **Storage** — digits that need to round-trip (tags) are converted back with `Utils.toLatinDigits()` before saving.

Link fields are excluded (`data-no-persianify`) since URLs must stay ASCII.

---

## 🎯 Icon System

All icons are inline SVG, defined in `js/utils.js` as a `ICONS` map:

```js
Utils.iconSvg('calendar', 16);
// → '<svg …><rect …/><line …/></svg>'
```

Two usage patterns:

**Static HTML** — put a placeholder:
```html
<span data-icon="calendar"></span>
```
Then call `Utils.injectIcons(root)` (called automatically on `DOMContentLoaded`, and you can re-invoke it after rendering dynamic content).

**Dynamic HTML** — call directly:
```js
'<span class="chip">' + Utils.iconSvg('tag', 12) + 'foo</span>'
```

Available icons:
`plus`, `x`, `check`, `undo`, `trash`, `edit`, `save`, `import`, `export`, `cloud`, `refresh`, `settings`, `search`, `tag`, `hash`, `calendar`, `link`, `filter`, `sort`, `chart`, `layers`, `inbox`, `book`, `external`, `plug`, `alert`, `shield`, `database`, `clock`, `flag`, `info`, `sliders`.

---

## ☁️ Cloud Sync via GitHub Gist

Works syncs across devices through a **private GitHub Gist**, using only the `gist` scope on a personal access token. No VPN required from Iran, no rate limits that matter, free forever.

### First-time setup

1. Open the app → click ⚙️ → **🔑 Setup Guide**.
2. The in-app guide walks you through:
   - **Create a personal access token** with only the `gist` scope (direct link in the guide).
   - **Create a secret gist** with a file named `works.json` containing `[]`.
   - **Copy the Gist ID** from the URL.
3. Back in Settings, paste the Gist ID and token → **Test Connection** → **Sync Now**.
4. On every other device, paste the **same** Gist ID and token.

### Behavior

- **Manual sync** — click the cloud button.
- **Auto-sync** — every 60 seconds when configured.
- **Merge strategy** — last-write-wins by `updatedAt`, union of all item IDs.
- **Push after merge** — the merged state is written back to the Gist.
- **No data leaves your device** unless a Gist ID and token are configured.

### Compatible backends

Any REST endpoint that supports this contract works:

- **GET** returns a JSON array, or an object with `.record`, `.items`, or `.record.items`.
- **PUT** accepts a JSON array as the request body.

Only the `sync.js` file would need changing to swap Gist for another backend.

---

## 🗄 Data Model

```json
{
  "id": "id_lx2k3_a8f9z",
  "title": "ارسال پروپوزال",
  "description": "پروپوزال پروژه بیوانفورماتیک",
  "category": "بیوانفورماتیک",
  "date": "2026-09-02",
  "tags": ["مهلت", "پروژه"],
  "links": [
    { "label": "bio.sampad.gov.ir", "url": "https://bio.sampad.gov.ir/" }
  ],
  "done": false,
  "createdAt": 1744243200000,
  "updatedAt": 1744243200000
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique, auto-generated |
| `title` | string | Required |
| `description` | string | Optional |
| `category` | string | Free-form; drives calendar colors |
| `date` | string | ISO Gregorian `YYYY-MM-DD`, empty if unset |
| `tags` | string[] | Free-form |
| `links` | `{label, url}[]` | Auto-parsed from the multi-line input |
| `done` | boolean | Completed flag |
| `createdAt` / `updatedAt` | number | Epoch ms; `updatedAt` drives merge conflict resolution |

---

## 💾 Local Persistence & Cross-Tab Sync

- Every change is written to `localStorage` synchronously.
- Two `localStorage` keys:
  - `works.items.v1` — the item array
  - `works.settings.v1` — sync URL, token, sort preference
- Cross-tab sync via:
  - **BroadcastChannel** `'works-sync'` for immediate notification.
  - **`storage` event** as a fallback for browsers without BroadcastChannel.

So a change in one tab is reflected instantly in all other tabs on the same browser.

---

## 📥📤 Import / Export

**Export** — click the download icon. Produces `works-<timestamp>.json`:

```json
{
  "version": 1,
  "exportedAt": "2026-10-09T12:34:56.000Z",
  "items": [ … ]
}
```

**Import** — click the upload icon, pick a `.json` file. You'll be asked:
- **OK** → **merge** with existing items (last-write-wins by `id` + `updatedAt`).
- **Cancel** → **replace** everything.

Bare arrays are also accepted: `[{…}, {…}]`.

---

## ⌨️ Keyboard Shortcuts

| Keys | Action |
|---|---|
| `Ctrl/Cmd + K` | Focus search |
| `Ctrl/Cmd + N` | New item |
| `Esc` | Close any open modal |

---

## 🎨 Theming

All colors, radii, and blur strengths are defined as CSS custom properties in `:root` (`styles.css`):

```css
:root {
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --danger: #ef4444;
  --success: #10b981;
  --glass: rgba(255, 255, 255, 0.55);
  --glass-strong: rgba(255, 255, 255, 0.78);
  --blur: blur(20px) saturate(180%);
  --radius: 16px;
  /* … */
}
```

Change `--primary` and `--primary-hover` to re-skin the whole app in one shot.

The animated background orbs are three absolutely-positioned divs with a CSS keyframe `float` animation — easily adjusted or removed.

---

## 🌐 Browser Support

- Modern evergreen browsers (Chrome, Edge, Firefox, Safari).
- Requires `backdrop-filter` for the glass effect (all modern browsers support it).
- Uses `BroadcastChannel` for cross-tab sync — degrades gracefully to `storage` events in older browsers.
- No polyfills needed.

---

## 🔒 Privacy

- **Local-only mode** — the default. Nothing leaves your device.
- **Cloud mode** — items go only to the Gist endpoint you configure. No analytics, no telemetry, no third-party calls.
- **Token storage** — the GitHub token lives in `localStorage` in plain text. Don't use a production master key on a shared machine.
- **Secret gists** aren't listed in search but are readable by anyone with the URL. Don't store secrets inside your items.

---

## 🚧 Known Limitations

- **No deletion tombstones** — deleting an item on one device can resurrect it from another device that still has it with a newer `updatedAt`. If you need reliable cross-device deletes, add a `deleted: true` flag + filter in `ui.js`.
- **No real-time sync** — 60 s auto-sync worst case between devices (same-device tabs are instant).
- **Single shared Gist per user** — anyone with URL + token can read/write.
- **Last-write-wins only** — no field-level merge.
- **Item appears only on its start date** in the calendar — ranges stored in description aren't expanded.

---

## 🛠 Development Notes

- **No build, no bundler, no framework.** Just ES5+ vanilla JS in IIFE modules attached to `window`.
- **Module pattern** — each `js/*.js` file is an IIFE that attaches its export to `window` (`window.Store`, `window.UI`, `window.CalendarView`, …). Load order in `index.html` matters.
- **Event-driven store** — `Store extends EventTarget`; the UI subscribes to `'change'` and re-renders.
- **The `[hidden]` fix** — `styles.css` starts with:
  ```css
  [hidden] { display: none !important; }
  ```
  This is required because any explicit `display` in CSS beats the browser's default `[hidden] { display: none }`. Without it, `.modal { display: flex }` would prevent `el.hidden = true` from ever hiding the modal.

---

## 📄 License

MIT — do whatever you want.
