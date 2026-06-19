# CLAUDE.md

Guidance for working in this repository (personal site for Venkata Aditya Korada,
plus an RSVP page for Sravya's Seemantham).

## ⚠️ Build before you commit/merge to `master`

**The deployed site is served from `docs/`, and `docs/` is effectively the build
output (`dist/`) directory.** GitHub Pages publishes `docs/` on the default branch
(`master`). Source changes under `client/` do **not** go live until the project is
rebuilt and the regenerated `docs/` is committed.

So, whenever you change anything under `client/`:

```bash
npm install        # first time only
npm run build:prod # rebuilds docs/ (output-path = docs) and writes docs/CNAME
```

Then commit the updated `docs/` **together with** your source changes. Do not merge
or commit source-only changes to `master` without the corresponding rebuilt
`docs/` — the live site would be stale.

`dist/` is gitignored; `docs/` is the committed, served copy. `build:prod` points
webpack's `--output-path` at `docs` so the build lands directly where Pages serves.

## Architecture

Two things ship from this repo:

1. **Resume / portfolio SPA** — React 19 app in `client/`, built by webpack into
   `docs/index.html` + `docs/main.<hash>.js`. Served at `https://korada.in/`
   (custom domain via `docs/CNAME`).

2. **Seemantham RSVP page** — a hand-maintained **static** page at
   `docs/SravyaBabyShower/index.html` (plus `seemantham-invite.jpg`). It is NOT
   generated from React. The webpack config preserves it on rebuild via
   `clean: { keep: /SravyaBabyShower/ }`, so a build won't wipe it.
   - A React equivalent (`client/components/BabyShower.jsx` + `BabyShower.scss`)
     is kept in sync for dev/parity, but **the static file is what production
     serves** at `https://korada.in/SravyaBabyShower`. Edit the static file for
     any user-facing RSVP change.

## RSVP backend (Google Apps Script)

`google-apps-script/Code.gs` is the form backend (writes to the Google Sheet
"Seemantham - Sravya - rsvp", emails the hosts + the guest). It is deployed
manually as a Web App; the `/exec` URL is hardcoded as `GAS_URL` in both
`docs/SravyaBabyShower/index.html` and `client/components/BabyShower.jsx`.

**Gotcha:** editing `Code.gs` in this repo does nothing until it's pasted into the
Apps Script project AND redeployed as a **New version**
(Deploy → Manage deployments → edit → Version: "New version"). The `/exec` URL
stays the same. Page-only (HTML/CSS) changes do not require a redeploy.

## Commands

| Command | What it does |
| --- | --- |
| `npm run start` | Dev server (`webpack serve`) at http://localhost:3000 |
| `npm run build:prod` | Production build into `docs/` + writes `docs/CNAME` |

## Branch / deploy

- Default + deploy branch: `master`.
- GitHub Pages serves `docs/` from `master`; custom domain `korada.in` (`docs/CNAME`).
