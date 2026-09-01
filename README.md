# SARN'T (`PatrickGrimes/sarge`)

Phone drill-sergeant workouts. One movement on screen. The GrokBot overwrites `workout.json` each morning. The app reads that file from this repo.

Live URL (after Pages is enabled): https://patrickgrimes.github.io/sarge/

## What you do once

1. Put these files in the repo root (not in a subfolder):
   - `index.html` `styles.css` `app.js` `sw.js`
   - `manifest.webmanifest` `icon-192.png` `icon-512.png`
   - `workout.json`
2. On GitHub: **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main`, folder `/ (root)`
   - Save
3. Wait a minute. Open https://patrickgrimes.github.io/sarge/
4. On the phone: Safari/Chrome → Share → **Add to Home Screen**
5. Connect **GitHub** to Grok, scoped to `PatrickGrimes/sarge` only.
6. Create a daily Grok Automation using `GROKBOT.md`.

After that you do not paste JSON. You only open the app and tap BEGIN.

## What the bot does every morning

Overwrite `workout.json` in this repo with today's object (schema inside `GROKBOT.md`). GitHub Pages publishes it. The app fetches `./workout.json` on launch.
