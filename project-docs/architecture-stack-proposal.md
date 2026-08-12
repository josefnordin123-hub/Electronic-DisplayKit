# Tech Stack Proposal — DIY Display Kit MVP

**Author**: Backend Architect
**Status**: **LOCKED — founder sign-off received 2026-08-10**
**Date**: 2026-08-10
**Timeline constraint**: 4-6 weeks to MVP, small team

## ✅ Founder Decision (locked)
- **Stack**: Primary recommendation confirmed — **Shopify** (storefront/cart/
  checkout/payment/inventory/shipping) + standalone **React + TypeScript +
  Vite SPA** for the WebSerial config tool + **ESP32 via PlatformIO/Arduino +
  LVGL** firmware.
- **Payment provider**: **Shopify Payments**.
- **Team skillset**: Confirmed comfortable with JS/TypeScript + React — no
  friction against the recommended stack.
- Alternatives A (full custom) and B (headless Shopify) — not selected, kept
  below for record/reference only.

This is now the confirmed stack. All Section 1-3 build tasks in the task list
are unblocked.

---

## 0. Framing

Two genuinely different problems are bundled into this MVP:

1. **Commerce plumbing** — cart, checkout, payment, order records, inventory
   deduction, shipping cost/labels. This is a *solved problem* with mature,
   PCI-compliant, battle-tested tooling. Custom-building it in week 1-2 of a
   4-6 week timeline is the highest-risk, lowest-differentiation use of a
   small team's time.
2. **The actual product-specific software** — the WebSerial config tool and
   its device-agnostic schema, plus firmware. This is where the team's
   engineering time should go, because nobody else has built it for you.

The recommendation below is built around that split: buy/rent the commerce
layer, build the WebSerial layer.

---

## 1. Recommended Primary Stack

| Layer | Choice | Why |
|---|---|---|
| **Storefront / cart / checkout / payment / inventory / orders** | **Shopify** (Basic plan), theme-based storefront, single product/SKU | Cart, checkout, payment (Shopify Payments or Stripe-via-Shopify), tax, order records, inventory deduction with oversell protection, abandoned-cart, order-confirmation email, and a built-in order admin view are **all included out of the box** — this alone covers Tasks 1.1-1.3, 1.5-1.7 with zero custom backend code. |
| **Shipping** | Shopify Shipping (label purchase, carrier rates) | Covers Task 1.4 (rate display at checkout) and Task 4.5 (label generation, tracking, status sync) without a separate integration. Flat-rate is also a one-click config if calculated rates aren't needed for MVP. |
| **WebSerial config tool** | Standalone **React + TypeScript + Vite** single-page app, hosted separately from the Shopify store, linked from the product page / order-confirmation / onboarding docs | WebSerial needs a real browser JS context that a storefront theme (Liquid) doesn't cleanly give you. Decoupling it into its own SPA means it's not fighting Shopify's templating, deploys independently, and iterates fast. React's component model maps well onto "swap renderer based on connected device's capability descriptor" (see §3). No server round-trip is required for the tool itself — it talks directly to the browser's Serial API and the device. |
| **Backend/API for the WebSerial tool** | **None required for MVP.** If the founder later wants saved/shareable configs, add a thin serverless API (Cloudflare Workers / Vercel Functions) + a small managed Postgres (Neon/Supabase). Not needed to ship the three core features as spec'd. | Keeps scope honest to spec's "no features beyond the three core features" note — don't stand up a backend nobody asked for. |
| **Database** | None dedicated for MVP (Shopify owns commerce data). If/when a config-save feature or a second display type needs backend state, Postgres (managed: Neon or Supabase — see open question in §4). | Avoids operating a database with zero MVP-critical use, which burns build-timeline for no spec-required feature. |
| **Hosting/infra for the WebSerial SPA** | Static hosting — Vercel, Netlify, or Cloudflare Pages (any works; pick one, see open question) | WebSerial tool is a static SPA (HTTPS required — WebSerial won't run on plain HTTP). All three options give free-tier HTTPS static hosting with zero ops overhead, which matches "small team." |
| **Payment provider** | Shopify Payments (Stripe under the hood) or Stripe directly via Shopify's Stripe integration | Either satisfies Task 1.3. Shopify Payments is the path of least setup friction; Stripe direct is worth it only if the founder has an existing Stripe account/relationship. |
| **Onboarding docs (Section 3)** | Hosted as a docs section within the same static host as the WebSerial tool (or a simple `/docs` route in the same SPA), linked from Shopify order-confirmation and product page | Satisfies Task 3.6 without a third hosting surface. |

### Why this fits the constraints
- **4-6 week timeline**: Section 1 (store) is largely configuration, not
  development, once Shopify is chosen — frees essentially the entire
  timeline for Section 2 (WebSerial tool) and firmware/hardware validation,
  which are the actual novel, time-risky pieces.
- **Small team**: no backend service to operate, patch, or monitor for the
  commerce layer. One fewer production system to keep up at 2am.
- **Physical inventory**: Shopify's inventory tracking is real stock-count
  tracking (not just a boolean), supports low-stock thresholds, and is what
  Task 4.4's "sync to the store's inventory number" process point back to —
  ops can literally use the Shopify admin as the inventory system of record
  rather than building one.
- **WebSerial requirement**: satisfied by an independent React/TS SPA that
  isn't constrained by a commerce platform's templating engine.
- **Future display-type extensibility**: addressed structurally in §3 below
  — it's a property of the schema/protocol design, not of which commerce
  platform sits behind the storefront.

---

## 2. Alternative Stacks

### Alternative A — Full custom build
**Stack**: Next.js (React, full-stack) + PostgreSQL + Stripe (direct) +
Shippo or EasyPost for shipping/labels + Vercel or a VPS for hosting.

**Tradeoffs**:
- ✅ Full data ownership from day one, no platform fees (Shopify takes a %
  + subscription), total control over checkout UX and future catalog growth
  beyond single-SKU.
- ✅ One codebase/framework for both storefront and WebSerial tool (both
  React), if that consistency matters to the team.
- ❌ Checkout + payment + inventory-race-condition handling + shipping-label
  integration is now *your* code to build, test, and secure (PCI scope,
  webhook reliability, refund flows) inside a 4-6 week window that also has
  to deliver the WebSerial tool and firmware validation. Realistic risk of
  slipping timeline or shipping a checkout with edge-case bugs.
- **Recommend only if**: the team already has strong Next.js/Postgres/Stripe
  experience and explicitly wants to avoid platform lock-in from day one,
  accepting the added build risk.

### Alternative B — Headless Shopify (Hydrogen/Oxygen or Storefront API + custom frontend)
**Stack**: Shopify backend (commerce/inventory/shipping engine, same as
primary) + a custom-coded storefront (Shopify Hydrogen/Remix, or a
hand-rolled Next.js frontend against Shopify's Storefront API) instead of a
Liquid theme.

**Tradeoffs**:
- ✅ Keeps all of Shopify's commerce/inventory/shipping machinery (same
  low-risk profile as the primary recommendation) while giving full design
  freedom over the storefront — no fighting theme constraints.
- ✅ Same React/TS skillset as the WebSerial tool could theoretically extend
  to the storefront too.
- ❌ Meaningfully more build time than a theme-based store (you're now
  building a frontend, not configuring one) — a real risk against 4-6 weeks
  for a single-SKU launch that doesn't obviously need bespoke storefront
  design.
- **Recommend only if**: brand/storefront customization is a hard
  requirement for launch, not a nice-to-have (see question 4 below).

---

## 3. Extensibility Note — Keeping the WebSerial Config Layer Open to a Second Display Type

This is the one piece of the stack that must be engineered deliberately now,
regardless of which commerce stack is chosen, per the spec's explicit
constraint.

**Principle**: the transport (WebSerial connection handling) and the
schema/payload must be decoupled from any specific display's shape,
resolution, or color depth.

**Mechanism**:

1. **Handshake with a capability descriptor.** On connect, firmware reports
   a small JSON descriptor before any config is sent:
   ```json
   { "protocolVersion": "1.0", "deviceType": "gc9a01-round",
     "shape": "round", "resolutionPx": [240, 240],
     "colorDepth": "rgb565", "supports": ["text", "image", "widget:clock", "widget:gauge"] }
   ```
   A future e-ink panel reports its own descriptor (e.g.
   `"deviceType": "eink-2in9"`, `"shape": "rect"`,
   `"colorDepth": "1bit"`, different `supports` list) — no change to the
   connection/handshake code itself.
2. **Frontend renderer selection is driven by the descriptor, not
   hardcoded.** The React app picks a renderer/preview component (round
   canvas vs. rectangular canvas, color vs. 1-bit dithering) based on
   `shape`/`colorDepth` from the descriptor. Adding a second display type
   means adding a new renderer module and registering it — not rewriting
   the connect/send pipeline (directly satisfies Task 2.6's acceptance
   criterion).
3. **Payload envelope is generic, per-widget payloads are typed and
   versioned.**
   ```json
   { "protocolVersion": "1.0", "type": "widget",
     "widget": "gauge", "params": { "min": 0, "max": 100, "label": "CPU" } }
   ```
   The envelope (`protocolVersion`, `type`) never changes across display
   types; only `params` shapes vary per widget, and those are already
   independent of the physical panel.
4. **Firmware-side abstraction via LVGL.** LVGL (the recommended firmware
   widget/graphics library, see below) already separates "what to draw"
   (widget objects: label, gauge, image) from "how to drive the panel"
   (display driver). Supporting a second display type on the firmware side
   means writing a new LVGL display driver + init sequence, while the widget
   definitions and the serial command parser are reused unchanged. This is
   what makes the front-end schema promise (point 1-3) actually true on the
   hardware side too — the extensibility guarantee spans both ends of the
   serial link, not just the browser.
5. **Schema is written down and versioned**, not tribal knowledge: keep the
   JSON Schema (or TypeScript types shared between firmware docs and the
   frontend repo) in the WebSerial tool's repo as the source of truth, with
   `protocolVersion` bumped on breaking changes.

Net effect: adding e-ink later is "add a descriptor + a renderer + an LVGL
driver," not "redesign the WebSerial layer" — which is exactly the bar the
spec sets.

### Firmware note (partially out of this task's software-stack scope, flagged per spec)
**Arduino framework via PlatformIO**, not raw ESP-IDF, paired with **LVGL**
for widgets/gauges and a GC9A01-specific display driver (e.g. via
`Arduino_GFX` or `LovyanGFX`, both of which have existing LVGL bindings).
Rationale: PlatformIO/Arduino gets a small team to a working GC9A01 driver +
serial command parser fast (huge existing library ecosystem for exactly this
chip), while ESP-IDF's lower-level control isn't needed for MVP scope and
would slow firmware delivery inside the 4-6 week window. LVGL is the piece
that makes the extensibility story in point 4 above real — it's the
industry-standard abstraction for exactly "same widgets, different display
driver," including existing support for e-ink-style panels. Use
`ArduinoJson` for parsing the serial protocol on the firmware side to keep
it in lockstep with the frontend's JSON envelope.

---

## 4. What This Does NOT Lock In

These are left open deliberately — they're either low-risk to decide later,
reversible, or need founder input the team doesn't have yet:

- **Exact static host for the WebSerial SPA/docs** — Vercel vs. Netlify vs.
  Cloudflare Pages are functionally interchangeable for this use case; pick
  based on team familiarity, not architecture.
- **Exact payment provider** — Shopify Payments vs. Stripe-via-Shopify is a
  Shopify admin setting, not an architecture decision; can change without
  touching code.
- **Whether a config-save backend/database ever gets built** — not required
  for the three core features as spec'd; only becomes relevant if the
  founder wants accounts/saved-configs post-MVP, at which point Neon vs.
  Supabase vs. something else is a cheap decision to make later.
- **Shopify vs. headless Shopify (Alternative B)** — both share the same
  commerce backend; switching from theme to headless later is a frontend
  rebuild, not a data migration, so this isn't a now-or-never call.
- **Firmware OTA/update mechanism** — not in scope for MVP (spec covers
  initial flashing, Task 3.4), can be layered on later without affecting the
  WebSerial config schema.

---

## Questions for the Founder (need answers before stack lock)

1. **Team language/framework experience** — is the team (or whoever's
   building this) comfortable with JavaScript/TypeScript + React, or is
   there existing strength in another stack? This determines whether the
   "buy commerce, build WebSerial in React" split is the right fit or
   whether Alternative A's full-custom-in-a-familiar-stack is actually
   faster for this specific team.
2. **Storefront customization requirement** — is a themed Shopify store
   (fast to launch, standard look) acceptable for MVP, or is a fully
   custom-designed storefront a hard launch requirement? This is the
   deciding factor between the primary recommendation and Alternative B.
3. **Payment provider preference** — any existing relationship/preference
   for Stripe directly, or is Shopify Payments fine to use as the default?
4. **Hosting/infra preference** — any existing cloud account, cost cap, or
   platform the team already operates in (Vercel, AWS, Cloudflare, etc.), or
   fully open to the Backend Architect's pick?
