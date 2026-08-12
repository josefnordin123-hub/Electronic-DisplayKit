# Sprint Roadmap — DIY Display Kit MVP

**Author**: Sprint Prioritizer
**Phase**: 2 — Sprint Roadmap (NEXUS-Sprint)
**Status**: Draft for Agents Orchestrator / Senior PM sign-off
**Date**: 2026-08-10
**Baseline**: 5 weeks (planning baseline). Compresses to 4 with explicit scope cuts (see Realism section). Extends to 6 only if the Reality Check Gate returns NEEDS WORK or hardware lead time slips — treat week 6 as a contingency buffer, not a default plan.
**Inputs**: `project-specs/diy-display-kit-setup.md`, `project-tasks/diy-display-kit-tasklist.md` (stack-locked), `project-docs/architecture-stack-proposal.md`, `project-docs/ux-foundation.md`

---

## How this roadmap is sequenced

Two facts drive the ordering, not just task numbering:

1. **Section 2 (WebSerial) and the hardware-dependent parts of Section 3 (pinout, soldering) cannot be truly validated without at least one real physical prototype unit.** Per the task list's own Technical Notes. Everything upstream of "prototype exists and works" is either commerce config (Shopify absorbs the risk) or design/schema work that doesn't need hardware yet.
2. **Section 4.1 (3D-print fulfillment decision) gates physical lead time, not code.** It has to be decided in week 1 even though it looks like "ops paperwork," because outsourced vendor lead times or in-house print-queue capacity can quietly become the actual launch blocker while the software looks done.

Everything else — Shopify commerce build (low technical risk, mostly configuration), onboarding doc structure, protocol schema design — is sequenced to run in parallel with those two hard dependencies, not to wait on them.

Evidence Collector and Reality Checker are present every week (continuous validation against acceptance criteria) — the full Phase 4 Reality Check Gate is a distinct, heavier event in the final week, not a repeat of the weekly checks.

---

## Week 1 — Unblock the two hard dependencies + scaffold everything else

**Goal**: Get the prototype unit into production and the 3D-print decision locked, while every non-hardware-dependent workstream starts in parallel.

**Task IDs targeted**:
- **4.1** — 3D-print fulfillment model decision (in-house vs. outsourced vs. hybrid). **Day 1-2, not "sometime this week."** This is the single highest-leverage early decision on the whole roadmap.
- **1.1** — Product page (Shopify config, low risk, no hardware dependency)
- **1.2** — Cart / order summary (Shopify config)
- **2.6** — Device-agnostic config protocol/schema — design work, doesn't need hardware in hand, and everything in Section 2 depends on this being right before UI gets built against it
- **4.4** (start) — Inventory tracking process definition — can be drafted now, doesn't block on 4.1
- **Critical-path action (not a numbered task, but load-bearing)**: order/assemble the first physical prototype unit (ESP32 + GC9A01 display + cables + first-pass enclosure print) **starting the same day as 4.1**, not after 4.1's process is fully formalized. A rough first print is enough to start hardware bring-up; the production-quality print workflow (4.2) can catch up.

**Core Team active**: Agents Orchestrator (phase kickoff, dependency sequencing), Senior Project Manager (tracks the two hard dependencies daily), Sprint Prioritizer (this roadmap, week-1 scope lock), UX Architect (final handoff review of the IA doc to Frontend Dev — mostly already done, spot-check only), Frontend Developer (Shopify theme scaffold, WebSerial SPA repo scaffold with browser-support gate skeleton per 2.1), Backend Architect (Shopify store setup, owns 2.6 schema authority, firmware protocol envelope design), DevOps Automator (repo/CI setup, static hosting provisioned for the SPA, Shopify dev store provisioned), Evidence Collector (confirms 4.1's written decision actually meets its acceptance criteria — vendor+lead-time or printer capacity numbers, not a vague preference), Reality Checker (flags hardware-timeline risk explicitly this week, doesn't wait until week 5 to say it).

**Support Team trigger this week**: **Rapid Prototyper** — pull in now for early firmware proof-of-concept (getting the GC9A01 driver + LVGL rendering something on the bench) in parallel with the ordered prototype unit arriving, so firmware risk surfaces in week 1, not week 3.

**Done looks like**: 4.1 decision is written with vendor/lead-time or in-house capacity numbers; prototype components are on order/in build; protocol schema v1 (2.6) is documented; Shopify dev store exists with a real product page and cart; WebSerial SPA repo exists with CI and the browser-support gate scaffolded (buildable/testable without hardware).

---

## Week 2 — Store build-out + WebSerial foundation (hardware arriving)

**Goal**: Finish the commerce build (low-risk, time-boxed hard) while WebSerial's non-hardware-dependent pieces get built, and operational workflow definition catches up to the 4.1 decision.

**Task IDs targeted**:
- **1.3** — Checkout/payment integration (Shopify Payments)
- **1.4** — Shipping cost handling at checkout
- **1.5** — Inventory deduction + oversell guard
- **2.1** — Browser support detection + fallback UX (no hardware needed — buildable and testable in any browser)
- **2.2** — Device connect flow (build against the arriving prototype; if it's delayed past mid-week, build/test against any generic serial device to de-risk the connect logic, then re-validate against the real unit the moment it lands)
- **4.2** — 3D-print production workflow setup (now that 4.1 is decided)
- **4.3** — Kit assembly/packing workflow definition
- **4.4** (finish) — Inventory tracking process, reorder thresholds
- **4.5** (start) — Shipping/carrier account setup

**Core Team active**: Frontend Developer (checkout UI, WebSerial connect flow + browser gate), Backend Architect (Shopify checkout/payment/inventory config, protocol refinement based on week-1 bench findings), DevOps Automator (CI/CD hardening, staging deploy for the SPA), UX Architect (reviews built checkout flow and Connect Device states against the IA doc's state table), Evidence Collector (tests each merged task against its acceptance criteria as it lands, not in a batch at sprint end), Reality Checker (weekly checkpoint — explicitly reports whether the prototype has actually arrived and whether 2.2 was validated against real hardware or only stubbed).

**Support Team trigger this week**: **Infrastructure Maintainer** — pull in only if Shopify custom-domain/DNS or the SPA's separate hosting setup gets non-trivial (e.g. cross-domain linking issues between the Shopify store and the independently-hosted SPA). Otherwise DevOps Automator alone covers this fine.

**Done looks like**: Checkout, payment, shipping cost, and inventory deduction work end-to-end on the dev store with a real test order; browser-support gate is live and correctly routes unsupported browsers; device connect flow works against the real prototype (or is flagged red if it's only been tested against a stub); 3D-print production workflow and packing workflow are written with named process owners; carrier account exists.

---

## Week 3 — WebSerial functionality against real hardware + onboarding doc verification + Growth Team activates

**Goal**: This is the week where "needs a physical unit" tasks actually get done, because the unit now exists and has been bring-up-tested since week 1.

**Task IDs targeted**:
- **1.6** — Order confirmation email
- **1.7** — Basic order admin view
- **2.3** — Text display config
- **2.4** — Image upload/config (the most technically novel piece — see Risk section, this is the first thing to watch for slippage)
- **2.5** — Simple widget/gauge config
- **2.7** — WebSerial error/disconnect handling
- **3.1** — Assembly guide (write + verify against the real prototype, not assumptions)
- **3.2** — Pinout reference (must match actual wiring on real hardware — verify now, not later)
- **3.3** — Soldering/wiring instructions (resolve the open hardware-fact question — pre-wired vs. solder-required — and document accordingly)
- **4.5** (finish) — Shipping/carrier setup, test label generation

**► Growth Team activates this week.** Growth Hacker, Content Creator, and Social Media Strategist begin launch planning in parallel with the Section 2/3 build work above. This is explicitly non-blocking — they work off the product page, onboarding doc structure, and brand direction already in place, and their output (launch content, social assets, messaging) is not a dependency for anything in Sections 1-4. If their work isn't ready by week 5, launch is not delayed for it.

**Core Team active**: Frontend Developer (2.3-2.5, 2.7, order admin UI), Backend Architect (order admin/email config, confirms with firmware side what ack signal is actually available for "sent confirmed" — an open question flagged in the UX doc), DevOps Automator (staging/prod pipeline hardening), UX Architect (validates onboarding doc structure matches the IA's linear/checklist design), Evidence Collector (tests every Section 2 feature against the real device, not the simulator/stub — this is the week the "tested against real hardware" bar actually applies), Reality Checker (checkpoint: is Section 3 documentation actually verified against hardware, or still assumption-based — this is exactly the kind of gap Reality Checker exists to catch before it reaches the gate).

**Support Team trigger this week**: none newly required. Rapid Prototyper's week-1 firmware groundwork should mean Frontend/Backend can build 2.3-2.5 without needing another prototyping pass — if it doesn't (driver instability, LVGL widget bugs surfacing only now), pull Rapid Prototyper back in.

**Done looks like**: Text, image, and widget configs all send to and are confirmed by the real prototype unit; disconnect/reconnect handling verified by physically unplugging the device mid-session; order admin and confirmation email work; assembly guide and pinout doc are verified against the actual built unit (photos/diagrams taken from the real hardware, not stock images); the soldering/pre-wired question is resolved and documented one way, not left ambiguous.

---

## Week 4 — Onboarding completion, doc hosting, ops hardening, first dry run

**Goal**: Close out remaining Section 3 tasks, stand up the doc site, and run the first full pipeline dry run early enough to leave a week for fixes.

**Task IDs targeted**:
- **3.4** — Firmware flashing guide (with troubleshooting section)
- **3.5** — First boot success checklist
- **3.6** — Onboarding doc hosting/navigation (single entry point, linked from confirmation email and product page)
- **4.6** — End-to-end fulfillment dry run (**first pass** — run it now, not for the first time in week 5, so there's runway to fix what it finds)

**Core Team active**: Frontend Developer (doc site build, remaining WebSerial polish/bug-fixing from week 3 findings), Backend Architect (shipping label generation integration for the dry run, any remaining order-status-to-shipped wiring), DevOps Automator (production hosting cutover, basic monitoring), UX Architect (walks the full onboarding flow end-to-end as a "beginner" would, per the target-user requirement), Evidence Collector (runs the full acceptance-criteria checklist across every Section 1-3 task ID delivered so far — this is the pre-gate evidence compilation starting early, not a week-5 scramble), Reality Checker (pre-gate audit begins — starts the "needs work" punch list now so week 5 isn't a surprise).

**Growth Team**: continues in parallel — content/social assets finalized, launch date coordination with Senior PM. Still non-blocking.

**Support Team trigger this week**: **Performance Benchmarker** — begin basic checks here (page load time on the SPA and Shopify store, WebSerial round-trip responsiveness) ahead of the formal pre-gate pass next week, so any real problem has a week of runway instead of surfacing at the gate itself. **Infrastructure Maintainer** — pull in if production hosting cutover (Shopify domain + SPA domain + doc site routing) surfaces DNS/cert issues.

**Done looks like**: Full onboarding doc site live, single entry point reachable from confirmation email and product page; firmware flashing guide complete with a real troubleshooting section (not hypothetical failure modes — ones actually hit during weeks 1-3 bring-up); first 4.6 dry run executed with every breakage logged against an owner and a task ID.

---

## Week 5 — Reality Check Gate (fix, re-validate, certify)

**Goal**: Close the punch list from week 4's dry run, re-verify everything against acceptance criteria, and run the formal Phase 4 Reality Check Gate. No new scope this week — bug-fix and evidence-compilation only.

**Task IDs targeted**: Whatever remains open from the week-4 punch list; re-run of **4.6** if the first pass found breakage; final acceptance-criteria sweep across **all task IDs 1.1-4.6**.

**Core Team active**: Evidence Collector (compiles the full evidence dossier — acceptance criteria met, with proof, for every task ID — this is what the gate is actually graded against), Reality Checker (runs the Phase 4 gate; **defaults to "NEEDS WORK" without overwhelming evidence**, per the spec's own phase plan — this is not a rubber stamp), Frontend Developer / Backend Architect / DevOps Automator (fix-only mode, no new features), UX Architect (final walkthrough of all three surfaces — store, WebSerial tool, onboarding — as a real customer would experience them in sequence), Senior Project Manager + Agents Orchestrator (go/no-go coordination, communicate gate outcome to founder), Sprint Prioritizer (final scope-cut arbitration if anything is still red at gate time — decides what genuinely must slip vs. what gets a same-week fix).

**Support Team trigger this week**: **Performance Benchmarker** — formal pre-gate pass (not the informal week-4 check): checkout flow speed, WebSerial send/confirm latency, doc site load time. This is an explicit gate input, not optional polish.

**Growth Team**: launch content and scheduling finalized, held pending gate certification — Growth Team does not publish/launch until Reality Checker certifies, even if their own work is ready early.

**Done looks like**: Reality Check Gate passes with a documented evidence trail, **or** returns a scoped, owned punch list — either outcome is a legitimate week-5 result; a false "looks done" pass is the failure mode this gate exists to prevent.

---

## Week 6 — Contingency buffer (conditional, not default)

Only activate if: the Week 5 gate returns NEEDS WORK with items that can't be closed in the same week, **or** the physical prototype/3D-print lead time slipped enough in weeks 1-3 that Section 2/3 hardware validation genuinely started late. If neither condition is true, week 5's gate pass is the launch trigger and week 6 isn't needed.

**If triggered**: Core Team stays in fix/re-validate mode only (no new scope), second 4.6 dry run, second (final) Reality Check Gate pass, then launch. Growth Team's already-prepared content ships once certified.

---

## Growth Team activation — explicit callout

**Week 3, start of week.** Growth Hacker, Content Creator, Social Media Strategist begin launch planning in parallel with the week 3-5 build sprints. They are never a blocking dependency for any Section 1-4 task — their work is downstream of the product/onboarding structure that exists by week 3, and their readiness is not a gate input. If their launch assets aren't ready by the week 5 gate, launch proceeds on the engineering side and Growth's rollout follows once ready — the arrow only points one direction.

---

## Support Team — trigger points (as-needed only, not scheduled)

| Support agent | Trigger point | Why not on the Core roster instead |
|---|---|---|
| **Rapid Prototyper** | Week 1, immediately — early firmware/LVGL/GC9A01 proof-of-concept on the bench, in parallel with the prototype unit build | One-time bring-up spike, not sustained sprint work — Frontend/Backend take over once the driver's proven |
| **Infrastructure Maintainer** | If Shopify custom domain, DNS, or SPA/doc-site cross-domain routing gets non-trivial (most likely week 2 or week 4 hosting cutover) | DevOps Automator covers standard hosting/CI; this is only for actual infra complications, which may not materialize |
| **Performance Benchmarker** | Informal check week 4, formal required pass week 5 (pre-gate) | Single-purpose check, not a sustained sprint role |
| **Brand Guardian** | Only if Growth Team or Frontend Dev produces customer-facing copy/visuals that need a brand-consistency pass before launch — not triggered by default in this roadmap | No branding system currently defined in the spec/UX docs to guard against drift from |
| **Analytics Reporter** | Not triggered in this MVP roadmap — no analytics/tracking task exists in Sections 1-4. Flag to founder post-launch if conversion/funnel tracking becomes a priority | Out of the three core features; would be scope creep to add now |
| **AI Engineer** | Not triggered — no AI-driven feature anywhere in spec or task list | Explicitly not applicable to this MVP's scope |

---

## Risk / Realism

**Plain assessment: 5 weeks is tight but plausible for the scope as written; 4 weeks is not, without cutting something. Below is what's most likely to slip and what to cut first if it does.**

### Most likely to slip
1. **Physical prototype lead time (weeks 1-2).** Everything hardware-dependent (2.2-2.5, 2.7, 3.2, 3.3) is downstream of one physical unit existing and working. If component sourcing or the first enclosure print iteration takes longer than a week, the whole hardware-dependent chain shifts right by the same amount. **Mitigation already built into this plan**: ordering starts day 1 of week 1, not after 4.1 is fully formalized, and Rapid Prototyper de-risks the firmware side on the bench in parallel.
2. **Image upload/config (Task 2.4).** Of the three WebSerial config types, this is the only one requiring a real conversion pipeline (resize/reformat to the display's resolution and shape) rather than a straightforward text or parameter payload. It's the single most technically novel piece of the entire MVP and the most likely individual task to run over its week-3 estimate.
3. **Section 4 outsourced-vendor lead time**, if 4.1 lands on "outsourced" with a vendor whose actual turnaround is longer than assumed. This risk is process, not code, which makes it easy to under-watch — Reality Checker and Senior PM should treat 4.1-4.3 status as a first-class weekly risk item, not a footnote.
4. **Documentation accuracy (3.2, 3.3).** Both have an explicit acceptance criterion that they must match real hardware, not assumptions. This is a direct consequence of risk #1 — if the prototype is late, these tasks either slip with it or get written from assumption and need a rewrite, which the task list explicitly forbids.
5. **Reality Checker's default posture is "NEEDS WORK."** Treat week 5 as needing genuine buffer for fixes, not as a formality that rubber-stamps whatever's in main. Teams that plan week 5 as "just the demo" are the ones who end up needing week 6.

### Fast-follow (post-MVP) candidates if the timeline compresses
If week 3-4 slips and a hard launch date forces a cut, this is the order to cut in, cheapest/lowest-spec-impact first:
1. **QR code on the Unsupported Browser screen** — already flagged optional/nice-to-have in the UX doc. Cut first, no debate needed.
2. **Onboarding "mark complete" persistence (localStorage)** — UX doc already flags this as low-priority; a stateless checklist satisfies MVP.
3. **Calculated/multi-carrier shipping rates** — flat-rate or single calculated rate already satisfies Task 1.4; don't build anything smarter under time pressure.
4. **A second 4.6 dry-run iteration** — one clean pass with logged fixes is the acceptance bar; further iteration is diminishing-returns polish once the punch list is closed.
5. **Image upload/config (Task 2.4)** — this is the one real judgment call, flagged explicitly to the founder rather than cut silently: it's named in the spec's three config types ("text, images, simple widgets/gauges"), so cutting it outright is out-of-spec. But shipping text + widget/gauge configs first and adding image support within days post-launch is a defensible scope trade if hardware delays eat into week 3's build time. This should be a founder decision point in week 3, not a unilateral cut, if it comes to that.

**What should not be cut under any timeline pressure**: the browser-support fallback gate (2.1) and the inventory oversell guard (1.5) — both are explicit hard requirements in the task list's Quality Requirements section, not judgment calls.

---

## Phase 4 Reality Check Gate — sign-off criteria

The gate passes only when Evidence Collector has produced verifiable evidence — not self-reported "done" status — for all of the following:

- [ ] Every task ID (1.1-4.6) has documented evidence against its specific acceptance criteria
- [ ] WebSerial tool tested end-to-end against the actual physical prototype unit — text, widget, and image (if in MVP scope) all confirmed sent and device-acknowledged, not just "the browser call didn't throw"
- [ ] Section 3 onboarding docs (assembly, pinout, soldering) verified against the real built hardware, not written from assumption
- [ ] Non-Chromium fallback UX (Task 2.1) verified in an actual Safari and/or Firefox session, including the iOS special case noted in the UX doc
- [ ] Mid-session disconnect/reconnect (Task 2.7) verified by physically disconnecting the device, not simulated
- [ ] One full end-to-end fulfillment dry run (Task 4.6) completed with zero unresolved breakage
- [ ] Inventory oversell guard (Task 1.5) tested under a concurrent/last-unit scenario
- [ ] Payment failure path (Task 1.3) tested — confirmed no false order is created
- [ ] Store and product page confirmed mobile responsive
- [ ] Every Section 4 operational task has a named process owner, not just a written process
- [ ] No task references an unconfirmed stack (already closed at Phase 1, re-confirm nothing drifted)
- [ ] No feature exists beyond the three spec-defined core features (scope-discipline check against explicit non-goals)
- [ ] Performance Benchmarker's pre-gate pass shows no blocking issues (checkout speed, WebSerial round-trip latency, doc site load time)

**Default outcome without all of the above satisfied with evidence: NEEDS WORK.** A verbal "should be fine" from any Core Team agent does not substitute for Evidence Collector's dossier — this is by design, per the spec's own Phase 4 definition.
