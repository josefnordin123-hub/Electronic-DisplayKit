# Hardware Order List — DIY Display Kit

**Status**: Ready to order (bench-test tier). Retail-kit tier has one real
gap (no enclosure design exists yet — see §3).
**Date**: 2026-08-12
**Why this exists**: this is the single highest-leverage item Reality
Checker escalated after Weeks 1-2 — none of the firmware/WebSerial work can
move from "reasoned about" to "actually tested" without a real board and
display in hand.

## Board decision (locked 2026-08-12)

**ESP32-S3-DevKitC-1, N8R8 variant** (8MB Flash / 8MB Octal PSRAM, native
USB-C). Chosen over a base ESP32 for two spec-driven reasons, not just
"newer is better":
- **Native USB-C** — matches the spec's stated USB-C kit component exactly.
  Most classic ESP32 dev boards use Micro-USB; ordering the wrong one is an
  easy, common mistake.
- **8MB PSRAM** — real headroom for the animated widgets/gauges/live-data
  dashboards the product actually promises, versus a bare ESP32's tighter
  internal RAM.

`firmware/platformio.ini` and `firmware/README.md` are already updated to
target this board (`esp32-s3-devkitc-1`, `qio_opi` memory type for Octal
PSRAM). This is still unverified against real hardware — nobody has run
`pio run` yet.

---

## 1. Bench-test tier — order this first

This is the minimum to actually validate the thing nobody's been able to
test: does GC9A01 + LVGL + ESP32-S3 + the WebSerial connect flow really
work together. **No enclosure, no screws, no packaging needed for this
tier** — bare boards on a desk are enough to prove the electronics work.

| # | Item | Spec to match | Approx. price/unit* | Notes |
|---|---|---|---|---|
| 1 | ESP32-S3-DevKitC-1 board | N8R8 (8MB Flash/8MB PSRAM), native USB-C | $10-14 | Search exactly "ESP32-S3-DevKitC-1 N8R8" — cheaper N8R2 (2MB PSRAM) variants exist and will undercut the animation headroom this choice was picked for |
| 2 | GC9A01 round LCD module | 1.28", 240×240, SPI, 3.3V, IPS | $5-9 | [Confirmed spec via search](https://www.waveshare.com/1.28inch-lcd-module.htm): 65K/262K colors, ~7-pin 2.54mm header (BLK/CS/DC/RES/SDA/SCL/VCC/GND — pin count and exact labels vary slightly by vendor, confirm against your specific listing's datasheet before wiring) |
| 3 | Female-to-female jumper wires | 2.54mm pitch, 8+ wires, ~10-20cm | $3-5 (pack) | Connects the GC9A01 header to the ESP32-S3's GPIO header for bench testing — no soldering needed at this stage |
| 4 | USB-C to USB-A cable (data-capable, not charge-only) | USB-C to USB-A 2.0+, must support data | $5-8 | For flashing + power from a laptop. **Must be a data cable** — many cheap USB-C cables are charge-only and won't work for flashing/serial. If your laptop only has USB-C ports, get USB-C-to-USB-C instead |
| 5 | (Optional) Breadboard | Half-size or full-size | $5-8 | Not strictly required — jumper wires can connect module-to-board directly — but makes probing/debugging easier during firmware bring-up |

**Bench-tier subtotal: roughly $25-45** depending on sourcing, before shipping.

**Where to buy**: GC9A01 modules and ESP32-S3 boards are both extremely
common on AliExpress (cheapest, longest shipping — 2-4 weeks typical) and
Amazon (pricier, 1-3 day shipping if you need it fast). Adafruit and
SparkFun also carry the ESP32-S3-DevKitC-1 directly from Espressif's
reference design if you want a verified-authentic board over a clone —
[Adafruit's listing](https://www.adafruit.com/product/5336) is the N8R8
variant this BOM specifies. For a first bench-test order where speed of
*validating the electronics* matters more than unit cost, Amazon/Adafruit
for 1-3 day shipping is worth the markup over AliExpress.

**Order 1-2 units of each**, not just one — a second GC9A01 module in
particular is cheap insurance against a DOA panel or an accidental short
during first wiring, and having two ESP32-S3 boards means firmware bring-up
and WebSerial-side testing can happen in parallel instead of serialized on
one board.

---

## 2. What this unblocks

Once this arrives and someone wires it up:
- `firmware/src/main.cpp` gets its first real `pio run -t upload` — firmware
  README's whole "Verification status" checklist starts getting real
  answers instead of `[ ]` placeholders.
- Task 3.2 (pinout reference) can finally be written from actual wiring,
  not assumption.
- Task 2.2's device connect flow (already live and rendering in Chrome,
  per Week 2) gets tested against a real capability-descriptor handshake
  for the first time.
- Reality Checker's Week 2 escalation item #1 (hardware procurement) moves
  from "unconfirmed" to "in hand."

---

## 3. Retail-kit tier — NOT ready to order yet

The spec's full kit is "ESP32 + round SPI display + cables + USB-C +
**3D-printed enclosure** + screws." Everything above covers the electronics.
The enclosure is a real, separate gap:

- **No 3D-printable enclosure model (STL/STEP file) exists anywhere in this
  project yet.** Nobody has designed one. This isn't a sourcing question
  (like the bench-tier parts above) — it's a design task that hasn't
  started.
- Screws can't be spec'd (size/count/thread) until the enclosure design
  exists and defines its own mounting points.
- This also blocks Task 4.1 (in-house vs. outsourced 3D printing) from
  being fully actionable — you can decide the *fulfillment model* now
  (per `project-docs/decision-brief-4.1-3d-print-fulfillment.md`), but
  can't actually print or quote a vendor for a part that doesn't exist yet.

**Recommendation**: don't block the bench-test order on this. Get the
electronics validated first (§1) — that's the actual technical risk and
what Reality Checker flagged. Enclosure design is real work (CAD, fit
around the exact ESP32-S3 board + GC9A01 module footprint, mounting for
screws) that can start in parallel once the physical board dimensions are
confirmed in hand, but doesn't need to happen before you can order and
test the electronics.

---

## Cable/connector caveat carried over from firmware README

The GC9A01 module's exact pin header layout (count, order, labels) varies
slightly by vendor/batch — confirm against the datasheet or product photo
of whatever specific listing you actually buy before wiring, rather than
assuming it matches `firmware/src/main.cpp`'s current placeholder pin
mapping. That file already flags this; this BOM doesn't change it — wiring
verification only happens once the real part is in hand.

*Prices are typical market ranges as of this writing, not live quotes from
a specific seller — treat as planning estimates, confirm actual price at
checkout.
