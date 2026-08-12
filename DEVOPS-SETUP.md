# DevOps Setup Runbook — Week 1

**Author**: DevOps Automator
**Date**: 2026-08-10
**Scope**: Turns the config-as-code in this repo into a live Week 1 environment (per `project-docs/sprint-roadmap.md` Week 1: "repo/CI setup, static hosting provisioned for the SPA, Shopify dev store provisioned").

**Read this first**: everything in this document that requires an account login, a payment method, an API token, or clicking "Create" in someone else's SaaS console is a **manual human step**. I don't have credentials for GitHub, Cloudflare, or Shopify, and I have not created any account, repo, project, or store on your behalf. What follows is (a) what's already done as files in this repo, and (b) the exact steps a human needs to run to make it real.

---

## 1. What's already done (config-as-code, no external accounts touched)

| File | Purpose |
|---|---|
| `webserial-tool/.github/workflows/ci.yml` | GitHub Actions workflow: on push/PR to `main`, installs deps (`npm ci`), lints (`npm run lint --if-present`), typechecks (`tsc -b`), builds (`vite build`), uploads the `dist/` artifact. Runs entirely inside GitHub's free Actions minutes — no secrets, no external service, nothing to provision. |
| `webserial-tool/public/_redirects` | Cloudflare Pages SPA rewrite: all routes → `index.html` (200), since this is a client-routed app. Vite copies everything in `public/` verbatim to the root of `dist/` at build time, which is exactly where Cloudflare Pages looks for `_redirects`. |
| `webserial-tool/public/_headers` | Cloudflare Pages custom headers: `Permissions-Policy: serial=(self)` on every route. Same `public/`-copy mechanism as above. |

Neither file does anything until a human connects the repo to GitHub and the hosting project to Cloudflare Pages (see below). They're inert text files sitting in the working tree right now.

**Update (2026-08-10): swapped from Vercel to Cloudflare Pages** per founder preference — see §2 below. The original `vercel.json` has been removed; if you ever want Vercel back, its equivalent config was `rewrites`+`headers` in a single JSON file, versus the two flat files here.

I verified `webserial-tool/package.json`'s actual scripts (`build`, `lint`) before writing `ci.yml` so the workflow matches what really exists rather than an assumed scaffold.

---

## 2. Static host choice: Cloudflare Pages

The architecture doc (`project-docs/architecture-stack-proposal.md`, §1 and §4) deliberately left Vercel/Netlify/Cloudflare Pages open — "functionally interchangeable... pick based on team familiarity, not architecture." DevOps Automator's original default was Vercel; the founder switched this to **Cloudflare Pages** on 2026-08-10. Same reasoning still applies, just on Cloudflare's platform:

- Zero-config Vite detection in the Cloudflare Pages dashboard (framework preset: "Vite" — build command `npm run build`, output directory `dist`).
- Generous free tier (unlimited requests/bandwidth on Pages, unlike Vercel's bandwidth-metered free tier) — comfortably covers a single-SKU MVP's static SPA traffic.
- Native GitHub integration deploys on every push with **no CI secrets required** — same no-token pattern as the original Vercel setup, no `CLOUDFLARE_API_TOKEN` needed in GitHub Actions for this.
- HTTPS on every deployment (including preview URLs) by default, with **no configuration needed** — see the WebSerial/HTTPS note below.
- If the team ever wants DNS, CDN, and hosting under one account, this also sets that up for free — not required for MVP, just a side benefit of the platform choice.

The CI workflow doesn't change either way — it only builds and artifacts the app, it doesn't deploy, so this swap only touched `webserial-tool/public/_headers` and `_redirects` (replacing `vercel.json`).

### Why WebSerial makes HTTPS non-negotiable
The Web Serial API only runs in a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) — HTTPS in production, or `localhost` for local dev (Vite's dev server already satisfies this, see `webserial-tool/vite.config.ts`). This is not a nice-to-have or a later hardening pass: **the tool's core feature (`navigator.serial.requestPort()`) throws / is unavailable over plain HTTP.** Vercel (like Netlify and Cloudflare Pages) provisions HTTPS automatically and by default for every deployment, so this requirement is satisfied by the hosting choice itself with zero extra config — but flagging it here because it's an acceptance-blocking property of the deploy, not a preference.

---

## 3. Manual steps a human needs to do

### 3.1 GitHub repository
1. Create a GitHub repo for `webserial-tool` (either as its own repo, matching the assumption in `ci.yml`'s comment, or as a monorepo subfolder — if the latter, add a `paths: ['webserial-tool/**']` filter to the workflow's `on.push`/`on.pull_request` and a `working-directory: webserial-tool` default on the CI job's steps).
2. `git init`, commit, `git remote add origin <repo-url>`, `git push`. The working directory here (`/Users/josefnordin/Desktop/Project2`) is not currently a git repo — that init/push has to happen as part of this step.
3. (Recommended) Turn on branch protection for `main`: require the `CI / Install, lint, typecheck, build` check to pass before merge. This is a repo Settings → Branches change only a repo admin can make.

### 3.2 Cloudflare Pages project
1. Sign in to [dash.cloudflare.com](https://dash.cloudflare.com) (or create an account) with whatever email/org the founder wants billing/ownership tied to — **this account does not exist yet and I have not created it.**
2. Workers & Pages → Create → Pages → "Connect to Git" → select the GitHub repo from 3.1.
3. Build settings: framework preset **Vite**, build command `npm run build`, build output directory `dist`. If `webserial-tool` is a monorepo subfolder rather than repo root, set "Root directory" to `webserial-tool` in the same settings screen.
4. Save and Deploy. Cloudflare assigns a `*.pages.dev` preview/production URL automatically — **no real URL exists yet; do not treat any URL as live until this step has actually been run.**
5. (Optional, later) Attach a custom domain under the Pages project's "Custom domains" tab once the founder has one to point here — DNS changes are a human step with access to the domain registrar (trivial if the domain is already on Cloudflare DNS, still doable otherwise via CNAME).
6. No environment variables are needed for this Week 1-2 scaffold — the app has no backend calls (per the architecture doc, §1: "No backend required for MVP"). Skip the Pages "Environment variables" panel entirely until/unless a config-save backend gets built later.
7. `_headers` and `_redirects` (in `webserial-tool/public/`) are picked up automatically by Cloudflare Pages from the build output — no dashboard configuration needed for the SPA rewrite or the `Permissions-Policy` header.

### 3.3 Shopify Partner account + dev store
This is entirely outside my access — I cannot create a Shopify account, verify an email, or accept Shopify's terms on the founder's behalf.
1. Sign up at [partners.shopify.com](https://partners.shopify.com) with the founder's business email.
2. Create a Partner organization if one doesn't exist.
3. From the Partner dashboard: **Stores → Add store → Development store**. This is free and doesn't require a Shopify plan/subscription until the store actually goes live/transfers to a paid plan.
4. Note the resulting `*.myshopify.com` URL and admin login — hand these to whoever (Frontend Developer / Backend Architect per the roadmap) builds the product page and cart (Tasks 1.1–1.2) this week.
5. No payment credentials are needed to create the dev store itself; Shopify Payments activation (Task 1.3, Week 2) is a separate later step that does require real business/bank details from the founder.

### 3.4 Secrets / env vars — current status
**None are required right now.** Concretely:
- CI (`ci.yml`) needs zero secrets — it only builds and typechecks, it doesn't deploy.
- Cloudflare Pages' GitHub integration handles deploy auth on Cloudflare's side once connected in 3.2; no `CLOUDFLARE_API_TOKEN` needs to live in GitHub Actions secrets under this setup.
- Shopify dev store credentials (admin login, any future Storefront/Admin API tokens) belong in whoever's hands is building the Shopify-facing config — not in this repo, and not needed by the WebSerial SPA at all this week (the two are decoupled by design per the architecture doc).
- If a future config-save backend gets built (explicitly out of MVP scope per the architecture doc §4), that's the point secrets like a Postgres connection string or Workers API keys would need to be added to Cloudflare Pages' environment variables — not before.

---

## 4. Definition of done for this Week 1 DevOps slice

Per the roadmap's Week 1 "Done looks like": *"...WebSerial SPA repo exists with CI and the browser-support gate scaffolded (buildable/testable without hardware)."*

- [x] CI workflow written and matches the real `package.json` scripts (verified, not assumed).
- [x] Static-hosting config written, with the HTTPS/WebSerial constraint documented.
- [ ] Repo actually pushed to GitHub — **human step, 3.1**.
- [ ] Cloudflare Pages project actually connected/deployed — **human step, 3.2**.
- [ ] Shopify dev store actually provisioned — **human step, 3.3**.

I'm reporting this slice as config-complete, not environment-complete. No deployed URL, no live Shopify store, and no GitHub remote exist yet as a result of this task — those all require a human with real credentials to click through 3.1–3.3.

---

## 5. Week 2 addendum — PR preview deploys + Week 1 fix confirmation

**Date**: 2026-08-10
**Scope**: Per the roadmap's Week 2 "CI/CD hardening" line — this is a light-touch pass, not a rebuild. One thing added (a doc note), nothing added to `vercel.json`, and a status re-check on two fixes Evidence Collector's Week 1 QA pass found.

> **Historical note**: §5.1 and §5.2 below were written *before* the founder's later Cloudflare Pages switch (§1/§2) and still describe Vercel/`vercel.json` as they were at the time — kept as-is for an accurate record of what was verified when. Preview deploys work the same way on Cloudflare Pages (auto-deployed per-PR, zero extra config, same reasoning), and the `vercel.json` mentions below now map to `webserial-tool/public/_headers` + `_redirects`. See §1's update note for the swap itself.

### 5.1 Preview deploys on PR — confirmed, no config needed

Checked this rather than assumed it. Once the GitHub repo is connected to a Vercel project (step 3.2 below — still not done), Vercel's GitHub integration auto-deploys a unique preview URL for every push to a pull request, with **zero additional `vercel.json` config required**. This is default behavior of the Vercel-for-GitHub app, not something this repo's config needs to opt into. Source: [Vercel Docs — Deploying GitHub Projects with Vercel](https://vercel.com/docs/git/vercel-for-github), [Vercel Docs — Git Configuration](https://vercel.com/docs/project-configuration/git-configuration).

Specifics that matter for this repo:
- The existing `vercel.json` (`framework`, `buildCommand`, `outputDirectory`, `installCommand`, `rewrites`, `headers`) applies to every deployment — preview and production alike. The SPA rewrite and the `Permissions-Policy: serial=(self)` header will both be live on preview URLs automatically, no duplication needed.
- No environment variables need scoping to Preview vs. Production, because none exist yet (per §3.2.6 above — still true, no backend calls in this MVP).
- Vercel does have opt-in knobs (`git.deploymentEnabled` to restrict which branches deploy, `github.autoJobCancellation`) if the team ever wants to *narrow* the default "every branch/PR deploys" behavior — not needed at this repo's size, so left out. Worth revisiting only if preview-deploy volume becomes noisy.
- One real security-relevant default worth knowing, not configuring: PRs from a fork of the repo require a maintainer's manual authorization before Vercel deploys them, specifically to stop a stranger's PR from exfiltrating env vars/secrets. Doesn't affect this project today (no secrets exist), but will matter if the repo ever goes public.

**Net change to `vercel.json`: none.** It was already correct for this. This section exists so "does preview-on-PR work" has a documented, sourced answer instead of an assumption.

### 5.2 Week 1 fixes — status re-confirmed against current files (read fresh, not from memory)

Evidence Collector's Week 1 QA pass found two real gaps and I fixed both; re-verified both are still correctly in place as of this pass:

- **`npm ci` → `npm install`**: `webserial-tool/.github/workflows/ci.yml` (Install dependencies step) and `webserial-tool/vercel.json` (`installCommand`) both currently use `npm install`. Correct call — no `package-lock.json` is committed yet (confirmed: not present in `webserial-tool/`), so `npm ci` would fail immediately in CI. The `ci.yml` comment documents the intended fix-forward: first real `npm install` on a real machine should commit the resulting lockfile, then this reverts to `npm ci` for reproducible installs. Still open — this repo has never had `npm install` actually run against it (no Node/npm in this sandbox).
- **`.eslintrc.cjs`**: present at `webserial-tool/.eslintrc.cjs`, and the matching devDependencies (`eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`) are present in `webserial-tool/package.json`. `npm run lint` (`eslint .`) now has a config to run against instead of erroring immediately. Still unverified against a real install/lint run for the same reason as above — flagged honestly in the file's own header comment, not claimed as tested.

### 5.3 What's still manual (unchanged from §3, re-confirmed today)

No new manual work was added by this pass. Still true as of 2026-08-10:
- **No git repo exists yet.** `/Users/josefnordin/Desktop/Project2` is not a git repo (confirmed this session). Steps 3.1's `git init`/commit/push have not happened.
- **No Vercel account/project connected.** Step 3.2 has not happened — there is no live deployment, no preview URL, no production URL. The preview-on-PR behavior documented in §5.1 above is accurate about *what will happen once connected*, not a claim that it's happening now.
- **No Shopify dev store provisioned.** Step 3.3 unchanged.

Everything in this addendum is a documentation/verification pass plus zero net file changes to `vercel.json`. If the team wants CI/CD "hardened" further next week, the highest-value next step is still the same one blocking everything else in this doc: connect the repo to GitHub and Vercel (3.1–3.2), so the config that's been sitting inert since Week 1 actually runs for the first time.

### 5.4 Post-addendum fix — `cache: npm` would have failed without a lockfile

Evidence Collector's Week 2 QA pass (2026-08-10) caught one more real gap this addendum missed: `ci.yml`'s "Set up Node" step used `actions/setup-node@v4` with `cache: npm`, which requires a committed `package-lock.json` to compute its cache key and errors out without one — same root cause as the `npm ci` issue in §5.2, but a separate failure point the earlier fix didn't cover. Removed `cache: npm` from that step (comment left in `ci.yml` explaining why, and to re-add it once a lockfile exists). No change to `vercel.json` was needed for this one.

## 6. First real deployment attempt (2026-08-12) — Cloudflare Pages, live build logs

**This is the first time anything in this repo has actually run outside the sandbox it was built in** — real `npm`/`bun`, a real build, real errors instead of "UNVERIFIED" caveats. Two real failures hit, both fixed:

1. **Missing "Root directory" setting.** First build failed with `ENOENT ... package.json` at the repo root — Cloudflare was running `npm run build` at `/opt/buildhome/repo/`, not `webserial-tool/`, because the project's "Root directory (advanced)" setting wasn't set. Fixed by setting it to `webserial-tool` in the Cloudflare Pages project settings (dashboard-side config, not a repo file).
2. **Vite 5 incompatible with Cloudflare's newer Workers-based Vite integration.** Once the root directory was fixed, `npm run build` (`tsc -b && vite build`) succeeded cleanly — genuinely built, 38 modules, real `dist/` output. But the project was created under Cloudflare's newer unified **Workers** product (not classic Pages), whose deploy step runs `npx wrangler deploy` and auto-detects/configures a Vite integration that requires **Vite ≥ 6.0.0**. `webserial-tool/package.json` was pinned to `"vite": "^5.4.1"`; bumped to `"^6.0.0"`. `vite.config.ts` uses no APIs that changed between Vite 5 and 6 (plain `plugins`/`server.port`/`server.fs.allow`), so no other file needed touching.

**Positive signal worth noting**: `bun install` (Cloudflare's build image auto-selected `bun` over `npm` since no lockfile existed) resolved all `package.json` dependency ranges without conflict and installed 195 packages cleanly — the first real confirmation that the Week 1-2 dependency set (React 18, Vite, the ESLint/TypeScript-ESLint stack added after the Week 1 QA pass, etc.) is actually resolvable, not just internally consistent on paper.

**Still open after this fix**: confirm the redeploy actually succeeds end-to-end (build + `wrangler deploy`) and produces a live `*.pages.dev` (or `*.workers.dev`, depending on which product this ended up as) URL. Load it in Chrome/Edge to confirm the browser-support gate and connect flow actually render — this is the first opportunity to move Task 2.1 from "code reviewed" to genuinely "live and testable," per the roadmap's own Week 1 done-bar language.

### 6.1 Second deploy attempt — `_redirects` infinite loop, fixed by removing it

The Vite 6 bump fixed the build. Deploy then failed one step later, with a genuinely new error: `Invalid _redirects configuration: Line 1: Infinite loop detected... This would cause a redirect to strip .html or /index and end up triggering this rule again.`

Root cause: this project was created under Cloudflare's newer unified **Workers** product, not classic Pages. On this first real deploy, `wrangler deploy` auto-scaffolded a `wrangler.jsonc` (visible in the build log, generated into the ephemeral CI checkout — not written back to this repo) containing `"assets": { "not_found_handling": "single-page-application" }`. That's Cloudflare's own native SPA-fallback mechanism for this project type. Our hand-written `webserial-tool/public/_redirects` (`/* /index.html 200`, written back when this was still assumed to be classic Pages) does the *same* job via the older Pages-style rewrite convention — and the two together loop: the platform rewrites `/*` to `/index.html`, but `/index.html` still matches `/*`, so it tries again.

**Fix**: deleted `webserial-tool/public/_redirects`. The platform's own `not_found_handling: "single-page-application"` (auto-generated on every deploy, confirmed by the build log) already covers this — nothing needs to replace it. `public/_headers` (the `Permissions-Policy: serial=(self)` header) was left in place; that's a header-injection rule, not a redirect, and wasn't implicated in this error.

One thing to actually verify once a build succeeds: whether Workers Assets respects `public/_headers` the same way classic Pages did — that convention was designed for the older product. If the `Permissions-Policy` header isn't present on the live response (checkable via browser devtools → Network tab → response headers), the fallback is setting `headers` directly in `wrangler.jsonc`, though note that file is currently being auto-regenerated by wrangler on every deploy rather than committed, so that would need to become a committed file instead once/if it's needed.

### 6.2 Third deploy attempt — same error, root cause was actually a Cloudflare platform bug

Removing `public/_redirects` (§6.1) did **not** fix the error — the identical "Infinite loop detected" failure recurred on the next deploy, which meant the loop was never coming from our file at all.

**Root cause, confirmed against real sources, not guessed**: because `webserial-tool/wrangler.jsonc` was never committed to this repo, `wrangler deploy` treated every single build as a first-time Vite project and re-ran its interactive auto-scaffold flow (visible in every build log as "📄 Create wrangler.jsonc" / "🛠️ Configuring project for Vite"). That auto-generated config always set `assets.not_found_handling: "single-page-application"` — and that specific setting hits a **confirmed, currently-open Cloudflare platform bug**: their own infinite-loop validator false-positives on SPA fallback rules, including their own auto-generated ones.

Sources (checked directly, not assumed):
- [cloudflare/workers-sdk#10992](https://github.com/cloudflare/workers-sdk/issues/10992) — open, describes this exact auto-generated-config failure mode.
- [cloudflare/workers-sdk#11824](https://github.com/cloudflare/workers-sdk/issues/11824) — closed; a maintainer-validated workaround exists (serve the SPA fallback from a *renamed* file, e.g. `_index.html` instead of `index.html`, so the rule's target no longer matches its own catch-all pattern and the validator stops false-flagging it) — confirming the platform does support the underlying behavior, the validator itself is just over-aggressive.
- [Workers static assets docs — SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/) — confirms `assets.directory` is a required sibling field alongside `not_found_handling`, which the auto-generated config was actually missing (it only set `not_found_handling`, no `directory` — a second, separate defect in the auto-scaffold's output, moot now that we don't use it).

**Actual fix applied**: committed `webserial-tool/wrangler.jsonc` ourselves, which stops the auto-scaffold (and the bug) from firing on every build. This app currently has **zero client-side routes** — `App.tsx` switches screens via React state, not a router, everything lives at one URL — so SPA fallback isn't needed yet, and `not_found_handling` was simply omitted rather than worked around. If/when real client-side routing gets added later, apply the #11824-confirmed workaround (renamed fallback file) rather than `"single-page-application"` directly, since the underlying platform bug is still open as of this writing.
