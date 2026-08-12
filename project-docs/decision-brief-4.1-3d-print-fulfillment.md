# Decision Brief — Task 4.1: 3D-Print Fulfillment Model

**Status**: AWAITING FOUNDER DECISION — not decided in this session
**Why this isn't auto-decided**: This requires real vendor quotes, real printer
capacity, and real expected order volume — none of which exist yet. Fabricating
a vendor name or lead-time number here would be worse than leaving it open;
per the sprint roadmap, this is Day 1-2 critical-path work for whoever runs
Week 1, not something a planning session can responsibly invent.

## The decision
Choose one for the enclosure (the only 3D-printed component):

| Option | You need to gather | Typical tradeoff |
|---|---|---|
| **In-house** | Printer(s) you already own/can access, per-unit print time, your team's available hours/week | No per-unit vendor cost, full quality control, but your team's time is the bottleneck — printer capacity must be checked against expected weekly order volume before committing |
| **Outsourced** | 2-3 quotes from print-on-demand vendors (e.g. Fictiv, Xometry, JLCPCB's 3D print service, or a local print shop) covering price/unit, minimum order quantity, and lead time | Scales without your team's time, but adds per-unit cost and a lead-time dependency you don't control — matters directly for Task 4.6's fulfillment dry run |
| **Hybrid** | Both of the above, plus a rule for when each is used (e.g. in-house for first N units to validate fit, outsourced once volume passes a threshold) | Lowest risk to start, but two processes to maintain instead of one |

## What "done" looks like (per the task list's acceptance criteria)
- Written decision: in-house, outsourced, or hybrid, with reasoning tied to
  expected order volume for MVP
- If outsourced: vendor identified and lead time confirmed (real quote, not
  an estimate)
- If in-house: printer capacity and per-unit print time estimated against
  expected weekly order volume

## Blocks
- Task 4.2 (production workflow) — can't be written until this is decided
- Ordering/producing the first physical prototype enclosure — the same
  critical-path item the sprint roadmap flags as needing to start Week 1,
  Day 1-2, in parallel with this decision, not after it

## Recommendation from this session
Given a 4-6 week MVP timeline and unknown launch volume, hybrid — print the
first small batch in-house (or via a fast local shop) to validate fit against
the real ESP32 + GC9A01 dimensions before committing to an outsourced vendor's
tooling/mold-adjacent lead time — is usually the lower-risk starting choice
for a first physical-product MVP. This is a recommendation, not a decision:
the founder (or whoever owns ops) still needs to fill in the real
printer-capacity or vendor-quote numbers above before Task 4.1 can be marked
done.
