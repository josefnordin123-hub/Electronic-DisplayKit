# DIY Display Kit — UX/IA Foundation

**Author**: ArchitectUX (UX Architect)
**Phase**: 1 — Architecture & UX Foundation
**Status**: Draft for Frontend Developer handoff — stack-agnostic
**Date**: 2026-08-10
**Depends on**: `project-specs/diy-display-kit-setup.md`, `project-tasks/diy-display-kit-tasklist.md`

## How to read this doc

This is IA and flow, not a mood board. Every screen listed under "Key Screens/States" is something a Frontend Developer should be able to build against without asking "but what happens if—". Where a decision genuinely can't be made without the founder or Backend Architect, it's called out explicitly in the Open Questions section at the end rather than guessed at.

No framework, component library, or CSS approach is assumed anywhere in this document — that's Backend Architect / stack-lock territory (Task 0.1/0.2). This document defines structure and state, not implementation.

---

## 1. E-commerce Store (single SKU)

### Design principle
One product, one path. No nav bar full of categories, no search, no filters — anything that implies "browse" is off-spec (spec: "single-SKU store," non-goal: catalog). The entire store is a straight line: **Product → Cart → Checkout → Confirmation**, with onboarding docs as the exit ramp at the end.

### Flow

```
[Product Page] --Add to Cart--> [Cart / Order Summary] --Checkout--> [Checkout: Shipping] --> [Checkout: Payment] --Pay--> [Confirmation]
      ^                                |  Continue Shopping (n/a - link back to Product only)
      |                                v
      +-------------------------- [Cart] (edit qty / remove)

Sold out at any point pre-payment --> [Sold Out state, no checkout possible]
Payment failure --> back to [Checkout: Payment] with inline error, cart/shipping data retained
```

### Step-by-step

1. **Product Page** — customer lands here (from ad, direct link, or order-confirmation "buy another" — unlikely but not blocked).
2. **Add to Cart** — quantity selector (default 1), stock-aware (disables/limits if stock is low).
3. **Cart / Order Summary** — single line item, quantity editable inline, running total, explicit "Proceed to Checkout" CTA.
4. **Checkout: Shipping** — address form, shipping method/cost shown (flat-rate or single calculated rate per Task 1.4 — no carrier picker needed for MVP).
5. **Checkout: Payment** — payment details, order total (items + shipping) shown one more time before charge.
6. **Confirmation** — order number, itemized summary, and a prominent link into the Onboarding hub (this is the handoff point to Surface 3 — see Task 3.6/1.6).

### Key screens/states

| Screen | States a Frontend Developer must handle |
|---|---|
| Product Page | in stock / low stock (optional, not required) / **out of stock** (CTA disabled, replaced with "Sold Out" + optional "notify me" — notify-me is NOT in MVP scope, flag if requested) |
| Cart | empty (shouldn't be directly reachable pre-add, but handle a stale/expired session gracefully) / has 1 item, qty 1-N / qty exceeds available stock (block increment, show max available) |
| Checkout: Shipping | form untouched / validation errors (missing/invalid fields) / valid → shipping cost calculated and shown |
| Checkout: Payment | form untouched / submitting (loading/disabled state — prevent double-submit) / payment declined (inline error, do NOT clear the form, do NOT create an order) / payment succeeded → navigate to Confirmation |
| Confirmation | always shows order #, items, total, shipping address, and a link/button to the Onboarding hub. Note: this is the only page in the store surface that links to Surface 3. |
| Global (cart persistence) | cart must persist across a page refresh at minimum (session-based per Task 1.2) — define what happens if a customer closes the tab mid-checkout and returns (does cart still hold? does inventory hold reserve, or is it re-checked at payment time?) — flagged in Open Questions |
| Global (concurrency) | last-unit race: if stock hits 0 between "Cart" and "Payment," Payment step must re-check stock and fail gracefully with a clear "just sold out" message rather than an ambiguous payment error |

### Notes for Frontend Developer
- No account/login system implied anywhere in spec — do not build one. Checkout is guest-only.
- Shipping and Payment can be two steps or one screen with two sections — either satisfies the IA; pick based on the confirmed payment provider's recommended integration pattern (Backend Architect call).
- Order confirmation email (Task 1.6) is a backend-triggered side effect of the Confirmation state, not a separate screen — but the Confirmation screen copy should say "check your email" so the customer isn't left wondering.

---

## 2. WebSerial Config Tool

### Design principle
This tool has exactly one hard gate before anything else can happen: **is this browser even capable of running WebSerial?** That gate is not a footnote — it is the first thing the UI checks, before showing any "connect" UI, and it must never be a dead end. Everything after the gate follows: connect → pick what to display → configure → send → confirm.

### Flow

```
[Tool Entry] --> {Browser Support Check}
                    |
        supported --+-- unsupported --> [Unsupported Browser Screen] (dead-end-free: explains + offers path forward)
                    |
                    v
            [Display-Type Select]  <-- only 1 option today (Round SPI Kit), but the step exists
                    |
                    v
            [Connect Device] --request port--> {native browser device picker}
                    |
        success ----+---- failure/cancelled --> [Connect Error State] (retry)
                    |
                    v
            [Connected — Config Home]  (choose: Text / Image / Widget)
                 |         |         |
                 v         v         v
            [Text Config] [Image Config] [Widget/Gauge Config]
                 |         |         |
                 +----send-+---------+
                    |
                    v
            [Send Confirmation] (success toast/state) --> back to [Connected — Config Home]

Mid-session disconnect (any screen after Connect) --> [Disconnected State] --> Reconnect --> [Connect Device]
```

### The Chromium-only gate — explicit UX handling (hard requirement)

This is not optional polish; it's called out as a hard requirement in both the spec and task list (Task 2.1, Quality Requirements). Design:

1. **Detection happens on page load, before any other WebSerial UI renders.** Check `navigator.serial` (or equivalent capability check at whatever layer the confirmed stack uses). Do not let a user get as far as "Connect Device" only to fail there — that's a worse experience than gating up front.
2. **Unsupported Browser Screen must never be a dead end.** It needs, at minimum:
   - Plain-language explanation: *"This tool uses a browser feature (WebSerial) that only works in Chrome or Edge. This isn't a bug in your browser or ours — Safari and Firefox haven't implemented this feature yet."*
   - A **copyable link** to the current tool URL, with a one-click "Copy Link" button, so the customer can paste it into Chrome/Edge without retyping anything.
   - If feasible, a QR code of the same link for "open on your phone/another device" (nice-to-have, not blocking — flag to Frontend Developer as optional).
   - A secondary path: link to the Onboarding docs in case the customer wants to read ahead while they find a Chromium browser, so they're not just stuck on a wall.
   - Explicitly **do not** show a fake/dead "Connect" button that will just fail — the gate replaces that UI entirely, it doesn't sit in front of it.
3. **iOS/iPadOS special case**: on iOS, *all* browsers (including "Chrome" for iOS) use Apple's WebKit under the hood, so no iOS browser supports WebSerial. The Unsupported screen's messaging should say "open on a desktop/laptop with Chrome or Edge" rather than just "switch to Chrome," or an iOS user will install Chrome and still fail. This is worth a specific microcopy check during build (flagged below in Open Questions since exact device-detection copy needs testing against real iOS Chrome).
4. **Mid-session edge case**: if WebSerial is supported but the user denies the permission prompt or the picker is cancelled, that is a *different* state from "unsupported browser" — show a lightweight retry ("Connection cancelled — try again") rather than the full unsupported-browser explanation, which would be confusing/wrong messaging for a Chrome user who just clicked "cancel" on the picker.

### Extensibility to a second display type — how this flow avoids a redesign later

Per spec constraint, the WebSerial config layer (UI and schema, Task 2.6) must not assume there will only ever be one display type. This flow handles that at the IA level with a single addition: a **Display-Type Select** step between the browser-support gate and Connect.

- **Today**: this screen has exactly one selectable option ("Round SPI Display Kit — GC9A01"), pre-selected, effectively a single-tap-through or even auto-advanced state. It still exists as a distinct step/state in the flow, not folded permanently into Connect.
- **Later (second display type)**: this same screen gains a second option card. No other screen in the flow changes — Connect, Config Home, and the three config screens (Text/Image/Widget) all key off whichever display type was selected, which is why Task 2.6's data schema needs a device/display-type identifier baked in from day one.
- **Config Home and the three config sub-screens should treat "capabilities" as data, not as hardcoded assumptions** — e.g., the Image Config screen resizes to *the selected display's* resolution/shape (round vs. a hypothetical future square/e-ink panel), not a hardcoded circle crop. Practically: Image Config reads target resolution/shape from the display-type's capability descriptor, not from a constant.
- This means: when a second display type ships, the Frontend Developer adds a card to Display-Type Select and a capability descriptor for the new device — they are not rebuilding Connect, Config Home, or the send/confirm flow.

### Key screens/states

| Screen | States a Frontend Developer must handle |
|---|---|
| Browser Support Check | (not a visible screen — a gate that runs before render) supported → proceed / unsupported → redirect to Unsupported Browser Screen |
| Unsupported Browser Screen | single state, but must include: explanation copy, copyable link, (optional) QR code, link to onboarding docs. No "try anyway" bypass. |
| Display-Type Select | 1 option today (pre-selected/auto-advance acceptable) → N options later. Must render as a real selectable list even with N=1, not a hardcoded skip, so the UI doesn't need rework when N=2. |
| Connect Device | idle (button: "Connect your kit") / browser device-picker open (native, no custom UI needed) / connecting (brief loading state) / **connected** / **error**: permission denied, wrong device, device busy — each needs distinct, readable copy, not a generic "connection failed" |
| Connected — Config Home | shows connected device name/status, three entry points (Text / Image / Widget), a visible "Disconnect" affordance |
| Text Config | empty input / valid input / sending (loading, disable send button to prevent double-send) / sent-confirmed / send failed (device disconnected mid-send — distinct from validation error) |
| Image Config | no file selected / file selected + preview (showing crop/resize preview against target display shape) / unsupported file type or oversized file (inline error) / converting / sending / sent-confirmed / send failed |
| Widget/Gauge Config | widget type selector (clock / gauge, per Task 2.5) / parameter form (e.g. gauge min/max/label) / validation (e.g. min < max) / sending / sent-confirmed / send failed |
| Disconnected State (mid-session) | triggered from any post-connect screen — shows "Device disconnected" + single "Reconnect" CTA back into Connect Device. Must not leave the UI hung on a spinner or an unresponsive send button. |
| Send Confirmation | success (toast or inline banner, auto-dismiss or manual dismiss — Frontend Developer's call) — always returns user to Config Home or lets them immediately send another config, never strands them on a "success, now what?" dead end |

### Notes for Frontend Developer
- Connect Device's browser device-picker is a native browser UI (chrome://, not custom-styleable) — don't attempt to design that dialog, only the states before/after it.
- "Sent confirmed" should reflect actual device acknowledgment if the firmware protocol supports an ack, not just "the browser didn't throw" — confirm with Backend Architect / firmware side what confirmation signal is actually available (see Open Questions).

---

## 3. Onboarding / Documentation

### Design principle
This has to work for a genuine embedded/IoT beginner (explicit target user in spec), so it's a **linear, checklist-driven path** with clear "you are here" progress, not a wiki of disconnected reference pages. Reference material (pinout table) still needs to exist as a standalone, linkable page for people who just need to look something up — but the *primary* path is sequential.

### Flow

```
[Onboarding Hub]  <-- entry point, linked from order confirmation email + product page
      |
      v
[1. What's in the Box]  (unboxing / parts checklist)
      |
      v
[2. Assembly Guide]  (enclosure + hardware, Task 3.1)
      |
      v
[3. Pinout Reference]  (Task 3.2 — also independently linkable/bookmarkable)
      |
      v
[4. Soldering / Wiring]  (Task 3.3 — conditionally shown/skipped if kit ships pre-wired, see Open Questions)
      |
      v
[5. Firmware Flashing]  (Task 3.4, incl. troubleshooting sub-section)
      |
      v
[6. First Boot Checklist]  (Task 3.5 — power on, confirm display output)
      |
      v
[7. Connect to WebSerial Tool]  --> hands off directly into Surface 2's flow
      |
      v
[Success state: "Your kit is live"] (optional light celebratory end-state, not required)

Any step --> [Troubleshooting] (accessible as a persistent side link, not just buried at the end of flashing)
```

### Step-by-step

1. **Onboarding Hub** — single entry page, reachable from the order confirmation email (Task 1.6/3.6) and product page. Shows the 7 steps as a checklist/stepper with progress state (not-started / in-progress / done — done state can be as simple as client-side "mark as complete" checkboxes, no account system implied).
2. **What's in the Box** — photo + parts list matching the actual kit contents (ESP32, round display, cables, USB-C, enclosure, screws) so the customer can verify nothing's missing before starting.
3. **Assembly Guide** — numbered steps, photo/diagram per major step (Task 3.1 acceptance criteria).
4. **Pinout Reference** — table (signal name / ESP32 pin / display pin). This page needs to also work as a standalone deep link, since it's the page people will bookmark or reopen mid-build.
5. **Soldering/Wiring** — either full soldering instructions with safety notes, or (if the kit ships pre-wired) an explicit "your kit ships pre-wired, no soldering needed — skip to Firmware Flashing" screen. Which one applies is a hardware fact this doc cannot assume (flagged in Open Questions).
6. **Firmware Flashing** — driver/tool install, connect, flash, with an inline troubleshooting accordion/section for the known failure modes (device not detected, wrong COM port, macOS/Windows permissions).
7. **First Boot Checklist** — short, explicit: power on → confirm display shows default content → proceed to WebSerial connection. This is the bridge screen into Surface 2.
8. **Connect to WebSerial Tool** — direct link/button into Surface 2's entry point (which itself starts with the browser-support gate — so if this beginner is on Safari, they hit that gate immediately and are routed correctly rather than confused).

### Key screens/states

| Screen | States a Frontend Developer must handle |
|---|---|
| Onboarding Hub | fresh visit (all steps unstarted) / returning visit (steps previously marked done, if "mark complete" is implemented — otherwise stateless is fine for MVP) |
| What's in the Box | static content, no states beyond normal page load |
| Assembly Guide | static, but should support anchor-linkable sub-steps (so troubleshooting or support can link to "step 4" directly) |
| Pinout Reference | static; must be independently reachable via direct URL (not only via the sequential flow) since it's a lookup reference |
| Soldering/Wiring | **two content variants depending on hardware fact** (solder-required vs. pre-wired) — see Open Questions; whichever it is, the copy is a single static branch, not a runtime toggle |
| Firmware Flashing | static instructions + an expandable/inline Troubleshooting section covering: device not detected, wrong COM port, OS permission issues (macOS/Windows named explicitly per Task 3.4) |
| First Boot Checklist | simple checklist UI, each item independently checkable, final item is the CTA into the WebSerial tool |
| Troubleshooting (persistent) | accessible from any step, not just at the end of flashing — should cover connection issues that could occur at assembly, flashing, or first-WebSerial-connect stages |

### Notes for Frontend Developer
- This entire surface can likely be static/markdown-driven content (no dynamic state beyond optional "mark complete" checkboxes) — flag to Backend Architect that this may not need a database-backed CMS for MVP, just versioned content files, unless founder wants non-technical editing.
- The link from order confirmation (Surface 1) and the link from First Boot Checklist into the WebSerial tool (Surface 2) are the two seams connecting all three surfaces — keep both as simple, stable URLs since other tasks (1.6, 3.5, 3.6) depend on linking to them.

---

## Cross-Surface Handoff Map

```
[E-commerce: Confirmation] ---> [Onboarding: Hub] ---> ... ---> [Onboarding: First Boot] ---> [WebSerial Tool: Entry/Gate]
```

Three surfaces, two seams, both are just links — no shared session/auth needed between them per current spec scope. Keep it that way unless a Backend Architect requirement forces otherwise.

---

## Open UX Questions (need founder or Backend Architect input)

1. **Cart/inventory reservation window** — if a customer adds the last unit to cart but abandons before payment, is stock held (reserved) for some window, or is it re-checked live at payment time only? Affects both Cart and Payment error-state copy. (Backend Architect / founder)
2. **Kit wiring fact** — does the physical kit ship pre-wired with connectors, or does it require customer soldering? This determines whether the Soldering/Wiring onboarding step is instructions or a "skip this step" notice (Task 3.3 explicitly flags this needs hardware/ops confirmation). (Founder/ops — ties to Task 3.3)
3. **WebSerial "sent confirmed" signal** — does the ESP32 firmware send an acknowledgment back over serial that the config tool can wait for, or is "sent" only "the browser call didn't throw"? Affects the accuracy of the Send Confirmation state across Text/Image/Widget config. (Backend Architect / firmware side)
4. **"Notify me when back in stock"** — out-of-stock Product Page state currently just disables purchase. Is a waitlist/notify-me capture wanted, or is that explicitly out of MVP scope? (Founder — likely out of scope per non-goals, but worth a one-line confirmation)
5. **Account/order-lookup** — checkout is designed guest-only with no login. Confirm that a customer with no account is acceptable for post-purchase order status lookups (e.g., "where's my order") for MVP, or whether Task 1.7's admin view is the only source of truth and customers rely solely on email. (Founder)
6. **Mark-complete persistence on Onboarding Hub** — is "steps completed" tracking worth persisting (e.g., via localStorage, no account needed) for MVP, or is a stateless checklist acceptable? Low cost either way, calling it out so it's a decision, not a default. (Founder — low priority)
7. **QR code on Unsupported Browser screen** — flagged as optional/nice-to-have. Confirm whether it's worth the small build cost, since a meaningful fraction of Safari/Firefox users may be on desktop already and just need the copy-link, not a phone handoff. (Founder / Frontend Developer scoping call)
