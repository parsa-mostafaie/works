# Works

A Persian-first, RTL single-page task manager with glassmorphism UI, SVG icons, **multi-day timing models**, a Jalali calendar, and optional cross-device sync via GitHub Gist.

## Timing models

Every item carries a `timeType` field that determines how its dates behave:

| `timeType` | Meaning | Fields used |
|---|---|---|
| `single`  | One-day event or one-shot deadline | `date`, `time?` |
| `range`   | Multi-day period (start → end) | `date`, `endDate`, `time?` |
| `ongoing` | Starts on a date, no fixed end | `date` |
| `tba`     | To be announced (no date yet) | — |

Additional fields:

- `isDeadline` — marks the item as a due-by / submission deadline (red badge in the list).
- `time` — optional `HH:MM` string, e.g. `16:00`.

The card in the list shows a chip with the full Persian timing string:

- `۱۵ مهر ۱۴۰۵`
- `از ۱۵ تا ۲۰ مهر ۱۴۰۵`
- `از ۱۵ مهر ۱۴۰۵ به بعد`
- `تاریخ نامعلوم`

…plus `— ساعت ۱۶:۰۰` when a time is set.

## Priority

Regardless of the chosen sort, items are grouped into three tiers:

| Tier | Condition |
|---|---|
| **0** | Active and not past |
| **1** | Active but past (based on **end** date for ranges) |
| **2** | Done |

Within each tier, your chosen sort applies. This means overdue items sink below active future items but stay above completed ones.

## Calendar

The calendar modal renders every range across all of its days, highlights multi-day spans, and shows per-day event dots colored by category. Click any day to see its events; click an event title to expand its description; click the pencil icon to edit it.

## Storage

- Items live in `localStorage` under `works.items.v2`.
- Legacy `works.items.v1` is migrated automatically on first load.
- Old items without a `timeType` are normalized to `single` if they have a `date`, or `tba` if they don't.

## Migrating an old export

Just import the JSON — the store normalizes every item on the way in. No manual editing required.

## Sync (optional)

Cloud sync uses a private GitHub Gist. Configure in **⚙️ → 🔑 Setup Guide**.

## License

MIT
