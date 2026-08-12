# DIY Electronics Display Kit Shop — Development Tasks

## Specification Summary

**Original Requirements** (quoted from `project-specs/diy-display-kit-setup.md`):

- Problem: *"Give hobbyists/makers a complete, easy-to-build display kit (round SPI screen) without needing to source components themselves or write their own firmware from scratch."*
- Product: *"Round SPI Display Kit: ESP32 + round SPI display (e.g. GC9A01) + cables + USB-C + 3D-printed enclosure + screws. Fast, colorful output (clocks, gauges, animated widgets, live-data dashboards)."*
- Core Features (exactly three, per spec section "Core Features for MVP"):
  1. *"E-commerce store — product page, checkout flow with inventory and shipping handling."*
  2. *"WebSerial-based web tool — customers 'program' what shows on the display (text, images, simple widgets/gauges) directly from the browser."*
  3. *"Onboarding/documentation — assembly + first boot (pinout, soldering/wiring, firmware flashing)."*
- Constraints:
  - *"Physical product: inventory, shipping, 3D printing (in-house or outsourced) must be accounted for operationally, not just in code."*
  - *"4-6 weeks to MVP."*
  - *"WebSerial only works in Chromium-based browsers. Must be flagged/handled in UX, with fallback instructions for Safari/Firefox users."*
  - *"Future product lines (e-ink, etc.) are out of scope now, but the architecture — especially the WebSerial config layer — must not be built so narrowly that a second display type becomes impossible to add later."*
- Explicit Non-Goals (per spec): *"Additional display product lines (e-ink, square displays, etc.)"* and *"Anything beyond the three core features listed above."*

**Technical Stack**: **LOCKED (2026-08-10)** — see `project-docs/architecture-stack-proposal.md`.
- Storefront/cart/checkout/payment/inventory/shipping: **Shopify** (theme-based, single SKU, Shopify Payments, Shopify Shipping)
- WebSerial config tool: standalone **React + TypeScript + Vite** SPA, separately hosted (static host, HTTPS)
- Firmware: **ESP32**, PlatformIO/Arduino + **LVGL**, GC9A01 driver via Arduino_GFX/LovyanGFX
- No dedicated backend/database for MVP (Shopify owns commerce data; WebSerial tool talks directly to the device)

Section 1-3 build tasks below are now unblocked.

**Target Timeline**: 4-6 weeks to MVP (per spec header).

**Scope discipline note**: This list intentionally excludes anything not named in the three core features above (e.g. no loyalty programs, no multi-currency, no mobile app, no e-ink/second product line, no premium packaging). If a task below looks like it's adding something extra, it isn't in scope and should be flagged to the PM before building.

---

## Phase 0: Stack & Foundation (Blocking — must complete before Sections 1-3 build tasks)

### [x] Task 0.1: Backend Architect proposes tech stack
**Owner**: Backend Architect (not this task list's default developer track)
**Description**: Propose a concrete stack covering: storefront/checkout, inventory persistence, order + shipping data, and a WebSerial-capable frontend (WebSerial requires a browser JS context — note this constrains frontend choice, not backend). Stack proposal must explicitly address how a second display type (e-ink) could be added later without a rewrite of the WebSerial config layer.
**Acceptance Criteria**:
- Written stack proposal exists (frontend framework, backend/API approach, database, hosting) with rationale tied to the spec's needs (small e-commerce + physical inventory + WebSerial frontend)
- Proposal explicitly states how the WebSerial config layer stays extensible to a second display type
- Founder has reviewed and confirmed the stack in writing before any Section 1-3 build task starts
**Reference**: "Tech Stack" section of spec; "Phase 1 — Architecture & UX Foundation" in NEXUS-Sprint Phase Plan

### [x] Task 0.2: Confirm stack lock and unblock build tasks
**Description**: Founder confirmed stack 2026-08-10 (Shopify + React/TS/Vite SPA + ESP32/PlatformIO/LVGL, Shopify Payments). See "Technical Stack" section above and `project-docs/architecture-stack-proposal.md`.
**Acceptance Criteria**:
- Task list updated with concrete file paths matching the confirmed stack ✅
- No task references a stack that wasn't confirmed ✅
**Reference**: Phase 1 gate — "founder confirms before lock" — CLOSED

---

## Section 1: E-commerce Store

*Covers spec requirement: "E-commerce store — product page, checkout flow with inventory and shipping handling."*

### [ ] Task 1.1: Product page — single SKU display
**Description**: Build the product page for the one MVP product (Round SPI Display Kit). No product catalog/browsing needed — spec defines exactly one product.
**Acceptance Criteria**:
- Page shows product name, description, price, and photo(s)
- Description reflects actual kit contents: *"ESP32 + round SPI display (e.g. GC9A01) + cables + USB-C + 3D-printed enclosure + screws"*
- "Add to cart" / "Buy" call to action present and functional
- Page is mobile responsive
**Files to Create/Edit**: Shopify theme — `templates/product.json`, `sections/main-product.liquid` (single-product store; disable navigation to any catalog/collection view)
**Reference**: Spec "Product (MVP Scope)" and Core Feature 1

### [ ] Task 1.2: Cart / order summary
**Description**: Implement a minimal cart (single SKU, quantity selector) leading into checkout.
**Acceptance Criteria**:
- Customer can set quantity before checkout
- Cart total updates correctly with quantity
- Cart persists through checkout flow (session or equivalent)
**Reference**: Core Feature 1 — "checkout flow"

### [ ] Task 1.3: Checkout — payment integration
**Description**: Implement checkout flow accepting payment (specific payment provider TBD by Backend Architect in Task 0.1).
**Acceptance Criteria**:
- Customer can enter shipping address and payment details
- Successful payment creates an order record
- Failed payment shows a clear error and does not create a false order
- Order confirmation page/email is triggered on success
**Reference**: Core Feature 1 — "checkout flow"

### [ ] Task 1.4: Shipping cost handling at checkout
**Description**: Implement shipping cost calculation/selection during checkout. Spec only requires shipping to be "handled" — does not specify carriers, rates table, or real-time API integration; simplest workable approach (flat rate or a single carrier's calculated rate) satisfies MVP scope.
**Acceptance Criteria**:
- Shipping address collected
- A shipping cost (flat-rate or calculated) is shown and added to order total before payment
- Order record stores the shipping method/cost selected
**Reference**: Core Feature 1 — "shipping handling"; Constraints — "shipping ... must be accounted for operationally, not just in code"

### [ ] Task 1.5: Inventory deduction on order
**Description**: Deduct stock quantity when an order is successfully placed, and prevent overselling.
**Acceptance Criteria**:
- Placing an order decrements available stock by the ordered quantity
- Product page reflects out-of-stock state (e.g. disables "buy" or shows "sold out") when stock hits zero
- Concurrent orders cannot oversell the last unit (basic race-condition guard — e.g. DB-level constraint or check-then-decrement in a transaction)
**Reference**: Core Feature 1 — "inventory ... handling"; Constraints — "inventory ... must be accounted for operationally, not just in code"

### [ ] Task 1.6: Order confirmation email
**Description**: Send a confirmation email/receipt after successful checkout.
**Acceptance Criteria**:
- Customer receives email with order number, items, total, and shipping address
- Email send failure is logged but does not block order completion
**Reference**: Core Feature 1 — checkout flow (standard completion step, not a "premium" add-on)

### [ ] Task 1.7: Basic order admin view
**Description**: Minimal internal view/list of orders for fulfillment (needed to hand off to Section 4 operational tasks — packing/shipping/3D printing).
**Acceptance Criteria**:
- Authenticated internal view lists orders with customer, items, quantity, shipping address, and status
- Order status can be manually updated (e.g. "new" → "shipped")
**Reference**: Constraints — inventory/shipping "accounted for operationally"; supports Section 4

---

## Section 2: WebSerial Config Tool

*Covers spec requirement: "WebSerial-based web tool — customers 'program' what shows on the display (text, images, simple widgets/gauges) directly from the browser."*

### [ ] Task 2.1: WebSerial browser support detection + fallback UX
**Description**: Detect whether the visiting browser supports the Web Serial API before allowing use of the tool.
**Acceptance Criteria**:
- Tool checks for `navigator.serial` (or equivalent) on load
- If unsupported, show a clear message identifying the issue and instructing the user to switch to a Chromium-based browser (Chrome/Edge), per spec's Safari/Firefox note
- If supported, proceed to connect flow
**Reference**: Constraints — *"WebSerial only works in Chromium-based browsers. Must be flagged/handled in UX, with fallback instructions for Safari/Firefox users."*

### [ ] Task 2.2: Device connect flow
**Description**: Implement the "connect to device" step using the Web Serial API (request port, open connection).
**Acceptance Criteria**:
- User can trigger a browser device-picker and select their connected ESP32
- Successful connection shows a clear "connected" state
- Connection errors (wrong device, permission denied, device busy) show a readable error, not a silent failure
**Reference**: Core Feature 2

### [ ] Task 2.3: Text display config
**Description**: UI to let the customer set text content to show on the display (e.g. a clock label, custom message).
**Acceptance Criteria**:
- Customer can input text and send it to the connected device over WebSerial
- Confirmation shown that data was sent successfully
**Reference**: Core Feature 2 — "text ... directly from the browser"

### [ ] Task 2.4: Image upload/config
**Description**: UI to let the customer upload/select an image to show on the display, with conversion to whatever format the firmware expects.
**Acceptance Criteria**:
- Customer can upload an image file
- Image is converted/resized to fit the round display's resolution before sending
- Image data is sent to device and confirmed
**Reference**: Core Feature 2 — "images ... directly from the browser"

### [ ] Task 2.5: Simple widget/gauge config
**Description**: UI to let the customer pick from a small set of predefined widgets (e.g. clock, simple gauge) to display.
**Acceptance Criteria**:
- Customer can select at least one widget type and configure its basic parameters (e.g. gauge min/max/label)
- Selection is sent to device and confirmed
- No requirement for a custom widget builder/scripting — spec only asks for "simple widgets/gauges"
**Reference**: Core Feature 2 — "simple widgets/gauges"

### [ ] Task 2.6: Device-type-agnostic config protocol/schema
**Description**: Define the data/message schema sent over WebSerial so it isn't hardcoded to only the round GC9A01 display — must allow a future second display type to be added without redesigning the transport/schema layer.
**Acceptance Criteria**:
- Config payload includes a device/display-type identifier or capability descriptor (not hardcoded to one resolution/shape)
- Adding a hypothetical second display type would require adding a new config, not rewriting the WebSerial connection/send logic
- Documented in code comments or a short architecture note for the next developer
**Reference**: Constraints — *"architecture — especially the WebSerial config layer — must not be built so narrowly that a second display type becomes impossible to add later"*

### [ ] Task 2.7: WebSerial tool error/disconnect handling
**Description**: Handle mid-session disconnects (device unplugged, browser tab backgrounded) gracefully.
**Acceptance Criteria**:
- Disconnect is detected and UI returns to a "reconnect" state rather than hanging
- No unhandled promise rejections/console errors on disconnect during manual test
**Reference**: Core Feature 2 (robustness needed for a browser-hardware tool)

---

## Section 3: Onboarding / Documentation

*Covers spec requirement: "Onboarding/documentation — assembly + first boot (pinout, soldering/wiring, firmware flashing)."*

### [ ] Task 3.1: Assembly guide — enclosure + hardware
**Description**: Write step-by-step assembly instructions for fitting the ESP32, display, and cables into the 3D-printed enclosure and securing with screws.
**Acceptance Criteria**:
- Numbered steps cover unboxing through fully assembled unit
- Includes at least one photo or diagram per major step
- Written for the target user (spec: "Beginners in embedded/IoT" included)
**Reference**: Core Feature 3 — "assembly"; Target Users includes "Beginners in embedded/IoT"

### [ ] Task 3.2: Pinout reference
**Description**: Document the exact pin connections between the ESP32 and the round SPI display (e.g. GC9A01).
**Acceptance Criteria**:
- Pinout table/diagram lists every wire connection (signal name, ESP32 pin, display pin)
- Matches the actual wiring used in the physical kit (must be verified against real hardware, not assumed)
**Reference**: Core Feature 3 — "pinout"

### [ ] Task 3.3: Soldering/wiring instructions
**Description**: Write instructions for the soldering/wiring steps needed to connect display to ESP32 (if kit requires soldering; if kit ships pre-wired with connectors only, document that explicitly instead).
**Acceptance Criteria**:
- Instructions match what the physical kit actually requires (solder joints vs. plug-in cables) — confirm with hardware/ops before writing
- Includes basic safety notes (iron temperature, ventilation) if soldering is required
**Reference**: Core Feature 3 — "soldering/wiring"

### [ ] Task 3.4: Firmware flashing guide
**Description**: Document how the customer flashes firmware onto the ESP32 for first boot.
**Acceptance Criteria**:
- Step-by-step instructions cover tool/driver installation, connecting the ESP32, and running the flash
- Includes troubleshooting section for common failures (device not detected, wrong COM port, permissions on macOS/Windows)
- Ends with confirming a successful first boot (display lights up / shows default content)
**Reference**: Core Feature 3 — "firmware flashing"

### [ ] Task 3.5: "First boot" success checklist
**Description**: Short checklist customer follows right after flashing to confirm the kit works and connect it to the WebSerial config tool.
**Acceptance Criteria**:
- Checklist confirms power-on, display output, and a working WebSerial connection to the config tool from Section 2
- Links directly to the WebSerial tool and to troubleshooting docs
**Reference**: Core Feature 3 — "first boot"; ties onboarding to Core Feature 2

### [ ] Task 3.6: Onboarding doc hosting/navigation
**Description**: Publish assembly/pinout/soldering/flashing docs (Tasks 3.1-3.4) in a place customers can find post-purchase (e.g. linked from order confirmation or a docs page).
**Acceptance Criteria**:
- All onboarding docs are reachable from a single entry link
- Entry link is included in the order confirmation email (Task 1.6) or product page
**Reference**: Core Feature 3; connects to Section 1 checkout flow

---

## Section 4: Operational Tasks

*Covers spec Constraints: "Physical product: inventory, shipping, 3D printing (in-house or outsourced) must be accounted for operationally, not just in code."* Note: these are operational/process tasks, not all pure software tasks — some require a decision/answer from the founder before a "build" step exists.

### [ ] Task 4.1: Decide 3D-print fulfillment model (in-house vs. outsourced)
**Description**: Founder/ops decision on whether enclosures are printed in-house or outsourced to a print service/vendor. This decision gates Tasks 4.2-4.3.
**Acceptance Criteria**:
- Written decision: in-house or outsourced (or hybrid), with reasoning tied to expected order volume for MVP
- If outsourced: vendor identified and lead time confirmed
- If in-house: printer capacity and per-unit print time estimated against expected weekly order volume
**Reference**: Constraints — "3D printing (in-house or outsourced) must be accounted for operationally"

### [ ] Task 4.2: Set up 3D-print production workflow
**Status (2026-08-10)**: **Template ready, awaiting Task 4.1.** Both the in-house branch and
the outsourced branch are fully written in `project-docs/ops-workflows.md` (Section 1), each
labeled "activate whichever branch matches the Task 4.1 decision once made." Cannot be marked
done until Task 4.1 (still OPEN) resolves which branch is real and supplies the real
printer-capacity or vendor lead-time numbers named in that document.
**Description**: Based on Task 4.1's decision, set up the actual production process (in-house print queue, or outsourced order-submission process to vendor).
**Acceptance Criteria**:
- Clear, written step-by-step process from "order placed" to "enclosure ready for kit assembly"
- Process owner identified (who executes this each time an order comes in)
**Reference**: Constraints — 3D printing operational accounting; see `project-docs/ops-workflows.md` Section 1

### [x] Task 4.3: Kit assembly/packing workflow
**Status (2026-08-10)**: **Done.** Full written checklist in `project-docs/ops-workflows.md`
(Section 2), covering picking the exact component list (ESP32, GC9A01 display, cable set,
USB-C cable, enclosure, screws), enclosure QA verification, packing, onboarding-doc insert, and
order status update. Process owner: Fulfillment Owner. Ties to the Task 1.7 status field at
both trigger and completion. Not yet exercised against a real order — that's Task 4.6, out of
scope here.
**Description**: Define the process for turning a placed order (Task 1.7 order admin view) into a packed, ship-ready kit (ESP32 + display + cables + USB-C + printed enclosure + screws).
**Acceptance Criteria**:
- Written checklist covering picking components, verifying printed enclosure is ready, packing, and marking order ready-to-ship
- Ties back to the order admin status field from Task 1.7
**Reference**: Spec "Product (MVP Scope)" component list; Constraints — inventory accounted for operationally; see `project-docs/ops-workflows.md` Section 2

### [x] Task 4.4: Inventory tracking process (physical components)
**Status (2026-08-10)**: **Done, thresholds provisional.** Process defined in
`project-docs/ops-workflows.md` (Section 3): physical component counts (ESP32, display, cable
set, USB-C, screws — enclosures excluded, print-on-demand per 4.1/4.2), manual sync of the
computed minimum to Shopify's single-SKU inventory count, and reorder thresholds for all five
components (ESP32 and display included, at 10 units each per acceptance criteria minimum). The
threshold numbers are reasonable starting points, not vendor-lead-time-validated — no real
supplier lead time exists yet for these components, same gap as Task 4.1's enclosure decision.
Revisit thresholds once real lead times are known.
**Description**: Define how physical component stock (ESP32 boards, displays, cables, USB-C cables, screws — separate from enclosures, which are print-on-demand per 4.1/4.2) is tracked and reordered, so the store's inventory count (Task 1.5) reflects reality.
**Acceptance Criteria**:
- Process defined for counting/updating physical component stock and syncing it to the store's inventory number
- Reorder threshold/trigger defined for each component (at minimum: ESP32, display)
**Reference**: Constraints — "inventory ... must be accounted for operationally, not just in code"; see `project-docs/ops-workflows.md` Section 3

### [ ] Task 4.5: Shipping/carrier setup
**Status (2026-08-10)**: **Instructions ready, account setup pending.** Decision framework and
status-update process are fully written in `project-docs/ops-workflows.md` (Section 4). Label
generation (Steps 2-3 of that checklist) is genuinely blocked — it requires real Shopify admin
login and, for the direct-carrier path, a real business carrier account, neither of which exists
in this session. Cannot be marked done until a human with that access completes those steps and
a real test label is generated.
**Description**: Set up the actual shipping process — carrier account, label generation, and how a packed order (Task 4.3) becomes a shipped, tracked package.
**Acceptance Criteria**:
- Carrier/account selected and able to generate a shipping label for a test order
- Process defined for updating order status (Task 1.7) to "shipped" with tracking number, and notifying customer
**Reference**: Constraints — "shipping ... must be accounted for operationally, not just in code"; Core Feature 1 — "shipping handling"; see `project-docs/ops-workflows.md` Section 4

### [ ] Task 4.6: End-to-end fulfillment dry run
**Description**: Run one full test order through the entire pipeline — store purchase, inventory deduction, print/assembly, packing, shipping label, and customer onboarding docs — before real launch.
**Acceptance Criteria**:
- One complete test order processed start to finish using the real workflows from Tasks 4.1-4.5
- Any breakage or unclear step logged and fixed before MVP launch
**Reference**: Constraints — physical-product operational readiness; supports Phase 4 "Reality Check Gate" in spec's NEXUS-Sprint plan

---

## Quality Requirements
- [ ] Stack chosen and confirmed by founder before implementation begins (Task 0.1/0.2) — no task assumes an unconfirmed stack
- [ ] No features beyond the three Core Features in the spec (no product catalog, no e-ink support, no loyalty/premium extras)
- [ ] WebSerial fallback UX implemented for non-Chromium browsers (Task 2.1) — not optional
- [ ] WebSerial config schema does not hardcode a single display type (Task 2.6)
- [ ] Inventory deduction prevents overselling (Task 1.5)
- [ ] Mobile responsive design on store and product pages
- [ ] All onboarding docs verified against actual physical hardware before publishing (not written from assumptions)
- [ ] No background processes in any commands — never append `&`
- [ ] No server startup commands assumed — use whatever dev/staging server the confirmed stack specifies
- [ ] Operational tasks (Section 4) have a named process owner, not just a written process

## Technical Notes
**Development Stack**: OPEN — pending Backend Architect proposal (Task 0.1) and founder confirmation (Task 0.2). Do not build against an assumed stack.
**Special Instructions**: WebSerial only works in Chromium-based browsers (Chrome, Edge) — this is a hard platform constraint from the spec, not a nice-to-have; every Section 2 task must respect it.
**Timeline Expectations**: 4-6 weeks total per spec. Section 1 (store) and Section 3 (docs) can start once stack is locked; Section 2 (WebSerial) needs at least one physical prototype unit to test against; Section 4 (ops) decisions (4.1) should happen early since they gate physical fulfillment lead time and don't block software work.
**Out of scope for this MVP** (explicit non-goals per spec): additional display product lines (e-ink, square displays, etc.); anything beyond the three core features listed in this document.
