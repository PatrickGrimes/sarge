# SARN'T

Daily PT orders for two recruits. One app, two bookmarks, two morning files.

| Recruit | URL | Sergeant | Accent | Workout file |
| --- | --- | --- | --- | --- |
| PAT | `/pat` | BRIGGS | `#FFE500` | `public/workouts/pat.json` |
| PAM | `/pam` | STRATTON | `#FF0A3F` | `public/workouts/pam.json` |

`/` is the picker. `/me` aliases to `/pat`. `?who=pat` / `?who=pam` also work.

Voice lives entirely in each workout JSON (`voice.preferredNames`, `pitch`, `rate`, and every spoken line). The app does not hard-code lines.

## Run

```bash
npm install
npm run dev
```

Then open the app and bookmark `/pat` or `/pam`.

## Morning bots

Overwrite the matching file. Keep the same shape as the existing JSON: `date`, `title`, `subtitle`, `durationMin`, `voice`, `exercises[]`.

Pat's bot should still be able to write `public/workouts/me.json` — the app falls back to it if `pat.json` is missing.

## Art

Original sergeant portraits are in `art/` (`briggs.jpg`, `stratton.jpg`). The app uses the cropped duotone versions under `public/images/`.
