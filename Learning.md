# Learning Log — Portfolio Build & Deploy

Running log for this session. Will be restructured into a final summary
(with diagrams/tables) once the live site is confirmed working end to end.

## Timeline so far

1. Built the portfolio (React + Vite + Tailwind v4) from the brief — hero,
   project grid with modal detail view, toolbelt, currently-curious, contact
   form.
2. Verified locally via the preview dev server. The `preview_screenshot`
   tool timed out repeatedly with no underlying error — cross-checked with
   the accessibility snapshot and computed-style inspection instead, which
   confirmed the app was rendering correctly. **Lesson: a flaky screenshot
   tool isn't proof of a broken app — corroborate with a second signal
   (DOM snapshot, computed styles, console/network logs) before assuming
   the code is at fault.**
3. Decided on hosting: ruled out Google Drive (doesn't execute JS / serve
   live sites anymore), went with GitHub Pages since a GitHub account
   already existed.
4. Set repo naming convention: `shreyjari.github.io` for a root-domain
   "user site" (vs. a project-page subpath).
5. Committed a custom GitHub Actions workflow (`.github/workflows/deploy.yml`)
   to build via Vite and publish `dist/` to Pages.

## Problems hit, and how we found/fixed each one

### Problem 1 — Wrong remote repo
- **Symptom:** Pushed code, but `Settings → Pages` on `shreyjari.github.io`
  showed nothing related to our push.
- **Root cause:** `git remote add origin` was pointed at
  `github.com/shreyjari/portfolio.git`, a different repo than the one
  actually being checked (`shreyjari.github.io`).
- **Fix:** `git remote set-url origin` to the correct repo.
- **Lesson: always confirm `git remote -v` matches the exact repo you're
  looking at in the browser before debugging deploy behavior.**

### Problem 2 — Pages source set to "Deploy from a branch"
- **Symptom:** Visiting the live URL showed a bare, auto-generated Jekyll
  page ("Shrey Jariwala" heading, "This site is open source. Improve this
  page." footer) instead of the real site — even though a workflow run
  showed green.
- **Root cause:** GitHub Pages defaults new repos to "Deploy from a
  branch," which runs GitHub's own generic Jekyll build against whatever's
  in the branch. It has no concept of "run `npm run build` first" — it was
  literally rendering the repo's `README.md` through Jekyll's default
  theme. The green checkmark we saw earlier belonged to that generic
  `pages-build-deployment` workflow, not our custom one.
- **Fix:** `Settings → Pages → Source →` switch to **GitHub Actions**.
- **Lesson: a green checkmark in Actions doesn't tell you *which* workflow
  ran. Check the workflow *name*, not just pass/fail — "pages build and
  deployment" (GitHub's built-in) and "Deploy to GitHub Pages" (our custom
  one) are different things that can both appear in the same repo.**

### Problem 3 — Target repo had unrelated history
- **Symptom:** After fixing the remote, a normal `git push` was rejected.
- **Root cause:** `shreyjari.github.io` had been created on github.com with
  "Add a README" checked, giving it one auto-generated commit that shared
  no history with our local repo.
- **Fix:** Confirmed with the user that repo had nothing worth keeping,
  then `git push --force-with-lease` to overwrite it. (First attempt failed
  with "stale info" because the local `origin/main` tracking ref hadn't
  been fetched yet — `git fetch origin` before the force-push resolved
  that.)
- **Lesson: when initializing a new GitHub repo meant to receive an
  existing local project, create it *empty* (no README/gitignore/license)
  to avoid a history clash entirely.**

### Problem 4 — `npm ci` failing in CI only (the real blocker)
- **Symptom:** After fixing Pages source, the custom workflow now ran but
  failed at the `npm ci` step, twice in a row. Site stayed stuck on the old
  Jekyll deploy.
- **Diagnosis path:**
  1. GitHub Actions logs aren't fetchable via the public API without auth
     (403), and no `gh` CLI was available in this environment — so we
     worked entirely from the run/job status API
     (`/actions/runs`, `/actions/runs/{id}/jobs`) to isolate which step
     failed. The user then supplied the actual terminal error text
     directly.
  2. Reproducing `npm ci` locally on Windows initially *succeeded* —
     misleading, because the failure was Linux-specific (npm resolves
     platform-specific optional dependencies differently per OS).
  3. Actual error: `Missing: @emnapi/core@1.11.2 from lock file` /
     `Missing: @emnapi/runtime@1.11.2 from lock file`.
- **Root cause:** `package-lock.json` was generated on Windows. These two
  packages are transitive dependencies of the `wasm32-wasi` optional
  variant of `@tailwindcss/oxide` (Tailwind v4's native engine) — a
  variant that's irrelevant on Windows but that npm's lockfile is still
  supposed to fully describe for *every* platform. A known npm gap means
  lockfiles generated on one OS can under-describe another OS's transitive
  optional-dependency subtree, which makes `npm ci` (strict, lockfile-only)
  fail on a different OS even though `npm install` would work fine.
- **Fix:** Deleted `package-lock.json` and `node_modules`, ran a clean
  `npm install`, confirmed the two missing packages now appeared in the
  regenerated lockfile, verified `npm ci` succeeded locally, committed, and
  pushed. New Actions run succeeded.
- **Lesson: if a CI-only `npm ci` failure ever comes up again, check
  whether the lockfile was generated on a different OS than the CI runner
  before chasing anything else. A clean `rm package-lock.json node_modules
  && npm install` regenerate is the fast fix. Reproducing `npm ci` locally
  on the *same OS as CI* (Linux, here) would have caught this immediately
  instead of costing two failed runs — worth a Docker/WSL Linux container
  check for cross-platform lockfile issues in the future.**

### Problem 5 — Stale caching made verification noisy
- **Symptom:** Multiple times, a fetch/check of the live site kept
  returning old content even after a real fix had landed.
- **Root cause:** Two independent caches were in play — the `WebFetch` tool
  has its own 15-minute cache keyed loosely by URL, and GitHub Pages itself
  sits behind Fastly's CDN which can serve a cached edge copy for a few
  minutes after a new deploy. Separately, the user's own browser cache held
  onto the old page after a plain refresh.
- **Fix:** Cache-busted `WebFetch` calls with a throwaway query string
  parameter; verified real state via the GitHub Actions API (run status +
  head SHA) rather than trusting a single page fetch; recommended a hard
  refresh / incognito window on the user's end.
- **Lesson: when a "should be fixed now" check still shows the old state,
  don't assume the fix failed — first rule out caching at each layer (tool
  cache, CDN, browser) before re-diagnosing the underlying problem.**

## Status

- [x] Site builds and deploys correctly via GitHub Actions to
      `https://shreyjari.github.io/`
- [x] Confirmed via GitHub API: latest run (commit `7b3fb9a`) succeeded
- [ ] **Pending: user to confirm the live site renders correctly after a
      hard refresh / incognito check** — final summary + diagrams to follow
      once confirmed
- [ ] Formspree ID still needs to be swapped into `src/components/Contact.jsx`
      (line 4, `YOUR_FORM_ID`) for the contact form to actually deliver
      messages
- [ ] Stray `shreyjari/portfolio` repo (created during the remote mix-up)
      can be deleted on GitHub if desired — not connected to anything live
