# Ops Workflow — Task 4.2: 3D-Print Production Workflow

**Process owner**: TBD — assign before launch (founder must name whoever
actually runs this each time an order comes in — could be the founder
themselves at MVP volume, but the task list's Quality Requirements call for
a *named* owner, not "whoever's around")

**Status**: **TEMPLATE — Task 4.1 is not decided yet.** This is not the
committed workflow. It's both branches, fully written out, so that the
moment Task 4.1's decision brief (`project-docs/decision-brief-4.1-3d-print-fulfillment.md`)
is closed, whoever owns this can delete the branch that wasn't chosen and
start running the other one the same day — no re-drafting needed.

---

## Why this is a template and not a workflow

The sprint roadmap assumed 4.1 would be decided in Week 1 and that 4.2 would
be written "now that 4.1 is decided" in Week 2. That assumption didn't hold:
the decision brief is still open, awaiting real vendor quotes or real
printer-capacity numbers from the founder — not something this document can
responsibly invent. Writing a single committed workflow here would mean
picking a fake answer to 4.1 and hiding that it's fake. That's the opposite
of what this process needs.

**What this means operationally**: Task 4.2 cannot be marked done. Track it
as blocked-on-4.1 until the founder closes the decision brief. Once they do,
close this template down to a single real workflow (delete the unused
branch, fill in the real vendor name / real printer model, remove this
banner) — that edit should take under an hour, not a re-write.

---

## Branch A — In-house printing

Use this branch if Task 4.1 is decided as "in-house" (or the in-house side
of "hybrid").

### Trigger
Order status in the order admin (Task 1.7) moves to a state indicating
payment succeeded and the order needs an enclosure (e.g. "new" /
"awaiting production" — exact status label depends on how Task 1.7 names
its states).

### Steps
1. **Queue the print** — Add the order to the print queue (a shared
   spreadsheet or physical whiteboard is fine at MVP volume; no need for
   print-farm software unless order volume genuinely requires it).
2. **Slice** — Load the locked enclosure STL/3MF into the slicer with the
   confirmed print profile (layer height, infill, supports) validated
   during prototype bring-up. Do not re-tune settings per order — the
   profile should be locked once the prototype fit-check passes.
3. **Print** — Run the print. Log start time and printer used (matters if
   more than one printer is in rotation, and for later capacity math).
4. **Post-process** — Remove supports, clean up the part (deburr screw
   bosses, check for stringing on visible surfaces). This step is easy to
   skip under time pressure — don't; a rough enclosure fails the QC step in
   Task 4.3.
5. **Cool-down / dimensional check** — Let the part reach room temperature
   before fit-testing (warm PLA/PETG can read as a false-positive fit).
6. **Hand off** — Move the printed, cleaned enclosure to the assembly area
   and mark it "enclosure ready" for whoever runs Task 4.3. If the order
   admin (Task 1.7) supports a sub-status or internal note field, log it
   there so assembly doesn't have to physically walk over and check.

### Capacity math the owner must fill in before this branch is real
- Print time per enclosure: **[fill in from prototype print log]**
- Number of printers available: **[fill in]**
- Usable print-hours/week (accounting for failed prints, maintenance,
  operator availability): **[fill in]**
- Resulting max enclosures/week: **[calculate once the above are filled in]**
- Compare that number against expected weekly order volume — if it doesn't
  clear expected volume with margin, this branch alone isn't viable and the
  4.1 decision should lean hybrid or outsourced instead.

### Failure modes to watch for
- Failed/warped prints (log the failure rate — it directly eats into the
  capacity math above)
- Printer downtime (maintenance, nozzle clogs) with no backup printer
- One person being the single point of failure for the whole queue

---

## Branch B — Outsourced printing

Use this branch if Task 4.1 is decided as "outsourced" (or the outsourced
side of "hybrid").

### Trigger
Same as Branch A — order status indicates payment succeeded and an
enclosure is needed.

### Steps
1. **Batch or submit** — Depending on vendor minimum order quantities
   confirmed in the 4.1 decision, either submit each order individually or
   batch orders on a fixed cadence (e.g. once daily, or once a threshold
   count is reached). Batching reduces per-unit cost but adds latency —
   the cadence should be chosen with the vendor's actual lead time in mind,
   not guessed.
2. **Submit to vendor** — Send the locked enclosure file (STL/3MF) and
   quantity to the vendor via whatever order channel they use (portal,
   email, API — confirm during 4.1). Record the vendor order/reference
   number against the internal order(s) it covers.
3. **Track lead time** — Log the date submitted and the vendor's quoted
   turnaround. If a submission is going to blow past the quoted lead time,
   flag it — this is the risk the sprint roadmap explicitly calls out
   (outsourced vendor lead time silently becoming the real launch blocker).
4. **Receive** — When parts arrive, count them against what was submitted.
   Short shipments or damaged parts get flagged back to the vendor
   immediately, not discovered at the packing step.
5. **QC on arrival** — Spot-check received enclosures against the same fit
   criteria as Branch A step 5 (dimensional accuracy, screw boss integrity,
   no warping) — an outsourced vendor's QC bar isn't your QC bar until
   you've verified it over a few batches.
6. **Hand off** — Same as Branch A step 6: mark "enclosure ready" in the
   order admin (Task 1.7) or an internal note, and move parts to the
   assembly area.

### Information the owner must fill in before this branch is real
- Vendor name: **[fill in — real quote required, not a placeholder]**
- Price per unit: **[fill in]**
- Minimum order quantity: **[fill in]**
- Quoted lead time: **[fill in]**
- Order channel (portal/email/API): **[fill in]**
- Batching cadence chosen, and why: **[fill in]**

### Failure modes to watch for
- Vendor lead time slipping past quote (no control over this — build
  buffer into the batching cadence, don't promise customers faster than the
  vendor can realistically deliver)
- Short/damaged shipments discovered too late to reorder before a customer
  ship date is at risk
- Single-vendor dependency with no fallback if the vendor has a bad week

---

## Once 4.1 is decided

1. Delete the branch that wasn't chosen.
2. Fill in every `[fill in]` placeholder in the chosen branch with real
   numbers/names from the closed decision brief.
3. Assign a real process owner (replace "TBD" above).
4. Remove this banner and the "Why this is a template" section — at that
   point this becomes the actual Task 4.2 workflow, not a template.
5. Re-check this file against Task 4.2's acceptance criteria: a written
   step-by-step process from "order placed" to "enclosure ready for kit
   assembly," with a named process owner. Both are structurally present
   above but gated on the 4.1 decision landing first.
