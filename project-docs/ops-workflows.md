# Operational Fulfillment Workflows — DIY Display Kit MVP

**Author**: Senior Project Manager
**Covers**: Section 4 of `project-tasks/diy-display-kit-tasklist.md` (Tasks 4.2, 4.3, 4.4, 4.5)
**Date**: 2026-08-10
**Status**: Task 4.1 (in-house vs. outsourced 3D-print decision) is **still OPEN** — see
`project-docs/decision-brief-4.1-3d-print-fulfillment.md`. Nothing in this document assumes
an answer to that decision. Where Task 4.2 depends on it, both possible branches are written
out in full below.

**Process owner role used throughout**: **Fulfillment Owner** — a role, not a named person.
Whoever is assigned this role at any given time executes Tasks 4.2/4.3/4.5 day to day. The
founder/ops lead assigns this role before Week 2 work starts; this document does not assume
who holds it.

---

## 1. Task 4.2 — 3D-Print Production Workflow (TEMPLATE — branch pending Task 4.1)

**This section is a template, not a finished workflow.** Task 4.1 is unresolved, so it would
be dishonest to present either branch below as "the" process. **Activate whichever branch
matches the Task 4.1 decision once it is made** (or blend both if the decision is "hybrid" —
in that case, use the in-house branch for the volume threshold below which in-house applies,
and the outsourced branch above it, per whatever split Task 4.1 defines).

Until Task 4.1 is decided, Task 4.2 acceptance criteria ("clear, written step-by-step process
from order placed to enclosure ready for kit assembly" + "process owner identified") cannot be
fully satisfied — the process owner (Fulfillment Owner) is named here, but the step-by-step
process itself has two candidate versions pending which one is real.

### Branch A — Activate if Task 4.1 decides "in-house"

1. Order lands in Shopify with status **New** (per the order admin status field from Task 1.7).
2. Fulfillment Owner checks the in-house print queue and adds the order's enclosure to the
   queue, tagging it with the Shopify order number.
3. Fulfillment Owner starts the print job (slicer settings should already be locked from
   prototype validation in Week 1 — do not re-slice per order).
4. Once printed, Fulfillment Owner removes supports, deburrs, and does a quick test-fit check
   against a reference ESP32 + GC9A01 pair (or a fit jig, if one exists) before calling it
   ready. A print that fails fit-check goes back into the queue as a reprint, not to packing.
5. Fulfillment Owner updates the order's internal status field to **Enclosure Ready** and hands
   off to Task 4.3 (kit assembly).
6. *Open item Task 4.1 must resolve before this branch is real*: per-unit print time and printer
   capacity vs. expected weekly order volume. Until that number exists, this workflow has no
   verified throughput and cannot promise a turnaround time to the assembly step.

### Branch B — Activate if Task 4.1 decides "outsourced"

1. Order lands in Shopify with status **New**.
2. Fulfillment Owner batches orders on a fixed cutoff (e.g., once daily or once every N orders
   — the actual cadence depends on the vendor's minimum order quantity/lead time from Task 4.1
   and is not invented here) and submits the batch to the vendor via whatever order channel the
   vendor uses (portal, email, API — vendor-specific, set once Task 4.1 names the vendor).
3. Fulfillment Owner records the vendor's confirmation and expected delivery date against each
   order (e.g., as an internal note tied to the order number).
4. When the vendor shipment arrives, Fulfillment Owner does a quick QA pass (correct quantity,
   no visibly warped/failed prints, test-fit check as in Branch A step 4) before accepting the
   batch into ready stock.
5. Fulfillment Owner updates each order's status field to **Enclosure Ready** and hands off to
   Task 4.3.
6. *Open item Task 4.1 must resolve before this branch is real*: which vendor, confirmed
   lead time, minimum order quantity, and price/unit. Until a real vendor is named, this branch
   is a shape, not a workflow — do not schedule Task 4.6 (dry run) against it until real
   lead-time data exists.

### What Task 4.2 actually needs from Task 4.1 to close out

- Which branch (A, B, or a hybrid split) is real
- Branch A: printer capacity + per-unit print time vs. expected weekly volume
- Branch B: vendor name + confirmed lead time + MOQ + price/unit

None of the above numbers are fabricated here. Once Task 4.1 is decided, this section should
be edited in place: delete the branch that doesn't apply, fill in the real numbers in the
branch that does, and flip Task 4.2's tasklist checkbox to done.

---

## 2. Task 4.3 — Kit Assembly / Packing Workflow (COMPLETE)

**Process owner**: Fulfillment Owner
**Trigger**: order's internal status field (Task 1.7) reads **Enclosure Ready** (set at the
end of whichever Task 4.2 branch applies) AND payment has cleared.

**Kit contents** (exact component list, per spec "Product (MVP Scope)"): ESP32 board, round
SPI display (GC9A01), cable set, USB-C cable, 3D-printed enclosure, screws.

### Checklist — order placed → packed, ship-ready kit

1. **Pull the order.** Fulfillment Owner opens the order in the admin view (Task 1.7),
   confirms status is **Enclosure Ready**, and notes quantity ordered.
2. **Pick components from physical stock**, one full set per unit ordered:
   - [ ] 1x ESP32 board
   - [ ] 1x GC9A01 round SPI display
   - [ ] 1x cable set (display-to-ESP32 wiring, per the kit's actual pinout — see Task 3.2)
   - [ ] 1x USB-C cable
   - [ ] 1x 3D-printed enclosure (pulled from the Enclosure Ready batch produced by Task 4.2)
   - [ ] Screws (full set per enclosure — count per unit is whatever the enclosure's screw BOM
     specifies; confirm against the physical enclosure design, not assumed)
3. **Verify enclosure QA.** Confirm the specific enclosure unit being packed already passed the
   test-fit/QA check from Task 4.2 (step 4/4 in either branch above). Do not pack an enclosure
   that hasn't cleared that check.
4. **Visual component check.** Confirm the ESP32 and display are undamaged (bent pins, cracked
   glass) before packing — a five-second visual check, not a functional bench test (functional
   testing of every unit is not in MVP scope; the onboarding "first boot" checklist in Task 3.5
   is where the customer confirms function).
5. **Pack the kit**: components + protective packaging (anti-static bag for the ESP32/display
   recommended, not currently specified further — flag to founder if a specific packaging
   material becomes a requirement) into the shipping box.
6. **Include onboarding entry point.** Insert a printed card or slip with the link to the
   onboarding docs (Task 3.6 entry point), so the doc link isn't solely dependent on the
   confirmation email being seen.
7. **Update order status.** Fulfillment Owner changes the order's status field (Task 1.7) from
   **Enclosure Ready** to **Packed** (or **Ready to Ship** — exact label should match whatever
   status vocabulary Task 1.7 implements; this document assumes that field exists and is
   editable per Task 1.7's acceptance criteria).
8. **Hand off to shipping.** Packed order moves to the Task 4.5 shipping process.

**Acceptance criteria check**: this checklist covers picking, enclosure QA verification,
packing, and marking ready-to-ship, and it references the order admin status field concept
from Task 1.7 at both its trigger (step 1) and its completion (step 7). Task 4.3 is complete
as a written process. It has not yet been executed against a real order — that happens at
Task 4.6 (end-to-end dry run), which is out of scope for this document.

---

## 3. Task 4.4 — Inventory Tracking Process (Physical Components) (COMPLETE, thresholds provisional)

**Scope**: ESP32 boards, GC9A01 displays, cable sets, USB-C cables, screws. Enclosures are
explicitly **excluded** — they're print-on-demand per Task 4.2, not held as counted stock, so
they don't need a reorder threshold the way a purchased component does.

**Process owner**: Fulfillment Owner (same role as 4.2/4.3 — this is a deliberate consolidation
so one person/role has full visibility from stock level to packed kit, not a scope decision to
revisit lightly).

### Why this can't just be "Shopify's inventory count"

Per the confirmed stack (`project-docs/architecture-stack-proposal.md`), the MVP has **one
Shopify SKU** ("Round SPI Display Kit") and **no dedicated backend/database**. Shopify's
inventory count for that one SKU is what Task 1.5 decrements automatically on each order. But
Shopify only knows about the *kit* as a unit — it has no idea that the kit is actually five
separate physical components with five separate stock levels. If ESP32 boards run out but
Shopify still shows "12 in stock" (because displays/cables/etc. still have stock), the store
will oversell ESP32-limited kits. This is the operational gap Task 4.4 exists to close.

### The process

1. **Physical count.** Fulfillment Owner counts each component's on-hand quantity. Cadence:
   at minimum, once at the start of each week, and immediately after receiving any restock
   shipment. (A daily count is not necessary at MVP order volume; revisit if weekly proves too
   coarse once real order volume is known.)
2. **Compute the limiting component.** The kit's true sellable quantity is the **minimum** of
   the five component counts (e.g., 8 ESP32 / 20 displays / 15 cable sets / 30 USB-C / 40 screw
   sets → sellable quantity is 8, because ESP32 is the bottleneck).
3. **Sync to Shopify.** Fulfillment Owner manually sets the Shopify product's available
   inventory count to that computed minimum. (This is a manual step for MVP — there's no
   backend to automate the min() calculation. If order volume grows enough that manual sync
   becomes error-prone or a bottleneck, that's a legitimate post-MVP automation candidate, not
   something to build now per the spec's "no dedicated backend for MVP" stack decision.)
4. **Deduction still happens automatically per order** via Task 1.5 (Shopify decrements the kit
   count on each sale) — the manual sync in step 3 is what keeps that automatically-decrementing
   number *accurate*, not a replacement for it. After each Task 4.3 packing run, the Fulfillment
   Owner also manually decrements each of the five physical component counts by however many
   kits were just packed, independent of Shopify's own countdown.
5. **Reorder trigger.** When a component's on-hand count crosses its threshold (below), the
   Fulfillment Owner places a reorder that same day and flags it to the founder/ops lead if the
   reorder would take longer than the current sellable-quantity runway to arrive.

### Reorder thresholds

| Component | Reorder threshold | Note |
|---|---|---|
| ESP32 board | Reorder at **10 units** on hand | Longest typical lead time of the five components; required minimum per Task 4.4 acceptance criteria |
| GC9A01 display | Reorder at **10 units** on hand | Required minimum per Task 4.4 acceptance criteria |
| Cable set | Reorder at 15 units on hand | Lower cost/faster restock than ESP32/display |
| USB-C cable | Reorder at 15 units on hand | Commodity item, short lead time |
| Screws | Reorder at 20 sets on hand | Cheapest, bulk-orderable, least likely to be the bottleneck |

**Honest caveat**: the numbers above are reasonable starting thresholds, not vendor-lead-time-
validated numbers — no real supplier lead time exists yet for any of these five components (the
same gap flagged in the Task 4.1 decision brief for the enclosure). Treat these as the process's
initial settings and revise once actual restock lead times are known, most likely during or
right after the Task 4.6 dry run. The acceptance criteria for Task 4.4 ask for a defined
threshold, not a validated one — this satisfies that bar; it does not claim more than that.

---

## 4. Task 4.5 — Shipping / Carrier Setup (START — instructions only, not performed)

**This section is a checklist for a human with Shopify admin and carrier-account access to
execute — it is not a record of an action already taken.** This session has no Shopify admin
credentials and no carrier account access, so nothing below has actually been clicked,
signed up for, or generated. Task 4.5's acceptance criteria ("carrier/account selected and able
to generate a shipping label for a test order") requires real account access and is **not
satisfied yet** — it's genuinely blocked on a human doing the steps below.

### Setup checklist (to be executed by whoever holds Shopify admin access)

**Step 1 — Decide the shipping path.**
- [ ] Choose: Shopify Shipping (simplest — labels generated inside Shopify admin, works with
  Shopify Payments already required for Task 1.3) vs. a direct carrier account (e.g., USPS,
  UPS, FedEx business account — more setup, potentially better negotiated rates at volume).
  For MVP order volume, Shopify Shipping is the lower-setup-cost default unless the founder has
  a specific reason to prefer a direct carrier account (e.g., an existing negotiated rate).
  This is a real decision point, not a foregone conclusion — flag to founder if unsure.

**Step 2 — If Shopify Shipping:**
- [ ] In Shopify admin: Settings → Shipping and delivery.
- [ ] Confirm Shopify Payments is active (shared dependency with Task 1.3).
- [ ] Create a shipping profile for the single SKU: enter accurate package weight/dimensions for
  the packed kit (from Task 4.3's actual packed box, not an estimate — weigh a real packed kit
  once one exists).
- [ ] Select which carriers Shopify Shipping should quote (USPS/UPS/etc. as offered by Shopify
  in the account's region).

**Step 2 (alt) — If direct carrier account instead:**
- [ ] Create a business shipping account with the chosen carrier (e.g., USPS Click-N-Ship
  business, UPS account, FedEx account) — requires real business details, not something this
  document can fill in.
- [ ] Connect the carrier account to Shopify via Shopify's carrier-calculated shipping settings,
  or plan to generate labels outside Shopify and enter tracking numbers manually (more manual
  work per order — note this tradeoff to the founder before committing to this path).

**Step 3 — Generate one test label.**
- [ ] Create a draft/test order in Shopify (or use Shopify's test mode) with the packed kit's
  real weight/dimensions from Step 2.
- [ ] Generate a shipping label for that test order.
- [ ] Confirm the label renders correctly (address fields populated, correct package weight,
  cost matches what was quoted) and can actually be printed.
- [ ] This satisfies Task 4.5's "able to generate a shipping label for a test order" acceptance
  criterion **once actually done** — it is not done as of this document.

**Step 4 — Define the status-update process (can be written now, doesn't need account access).**
- [ ] When Fulfillment Owner has a packed order (status **Packed**/**Ready to Ship** from Task
  4.3) and has generated its label (Step 3 process, repeated per real order), Fulfillment Owner:
  1. Updates the order's status field (Task 1.7) to **Shipped**.
  2. Enters the tracking number into the order record (Task 1.7's admin view needs a field for
     this — if it doesn't have one yet, that's a small addition to flag back to Task 1.7's
     acceptance criteria, since "status can be manually updated" doesn't explicitly mention a
     tracking-number field).
  3. Triggers the customer notification — either Shopify's built-in shipping-confirmation email
     (if using Shopify Shipping/fulfillment natively) or a manual email if labels are generated
     outside Shopify.

### What's genuinely blocked vs. what's ready

- **Ready now**: the decision framework (Step 1), the process definition (Step 4) — no account
  access needed for either.
- **Blocked on human action**: Steps 2 and 3 require real Shopify admin login and (for the
  direct-carrier path) a real business carrier account — neither of which this session has.
  Task 4.5 stays at "start" status until someone with that access completes Steps 2-3.

---

## Summary — Section 4 status after this document

| Task | Status | What's real vs. pending |
|---|---|---|
| 4.1 | Open (unchanged) | Founder decision still required — not addressed here, per instruction |
| 4.2 | Template ready | Both branches fully written; neither can be marked "the" process until 4.1 resolves |
| 4.3 | Complete | Full written checklist, ties to Task 1.7 status field, Fulfillment Owner assigned |
| 4.4 | Complete (thresholds provisional) | Process + sync mechanism + thresholds defined; threshold numbers are reasonable starting points, not vendor-validated |
| 4.5 | Started, not finished | Decision framework + status-update process written; label generation blocked on real Shopify/carrier account access |
