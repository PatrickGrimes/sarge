# You have a repo named sarge. Do these next.

GitHub is not connected to Grok yet, so the files cannot be pushed from this chat. You upload them once.

## 1. Upload the app into `sarge`

In the GitHub repo page: **Add file → Upload files**.

Upload everything in the `sarge` folder:

- index.html
- styles.css
- app.js
- sw.js
- manifest.webmanifest
- icon-192.png
- icon-512.png
- workout.json
- README.md
- GROKBOT.md

Commit to `main` (or `master`, whichever GitHub created).

Files must sit at the **root** of the repo, not inside another folder.

## 2. Turn on GitHub Pages

Repo → **Settings → Pages**

- Source: Deploy from a branch
- Branch: `main` / `master`
- Folder: `/ (root)`
- Save

After a minute the app is:

`https://YOURUSER.github.io/sarge/`

If Pages asks for a workflow and fails, the branch setting above is the simple path. Do not pick `/docs` unless you moved the files there.

## 3. Put it on the phone

Open that URL in Safari (iPhone) or Chrome (Android).

- iPhone: Share → Add to Home Screen
- Android: menu → Add to Home screen / Install app

Tap BEGIN. The first tap is what lets it speak. It will try for a British voice; phones vary.

## 4. Connect GitHub to Grok (required for hands-off mornings)

On grok.com: **Connectors → GitHub → Connect**.

When GitHub asks which repos, give it **only `sarge`**.

Then tell Grok: “Create a daily 06:30 America/New_York automation using GROKBOT.md in sarge. Replace YOURUSER with my GitHub username.”

Until that connector exists, you can still use the app; you would just replace `workout.json` by hand.

## 5. Check it worked

- Pages URL loads a dark screen titled TUESDAY GRIND (sample file).
- BEGIN talks and shows JUMPING JACKS.
- After the bot’s first run, `workout.json` in the repo has today’s date.
