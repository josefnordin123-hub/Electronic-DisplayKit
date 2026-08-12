# Firmware — Bench Proof-of-Concept Skeleton

**Status**: Week 1 bench proof-of-concept skeleton, per
`project-docs/sprint-roadmap.md` Week 1 support-team trigger for Rapid
Prototyper: *"pull in now for early firmware proof-of-concept (getting the
GC9A01 driver + LVGL rendering something on the bench)"*.

## What this is

A PlatformIO/Arduino firmware skeleton that, on real hardware, should:

1. Bring up a GC9A01 round display over SPI via LovyanGFX.
2. Initialize LVGL and render a static bench-test UI (a text label + an
   arc) — enough to visually confirm the display driver and LVGL are both
   actually working, not just that the code compiles.
3. Send a one-time capability-descriptor handshake over Serial on boot,
   shaped like the one in `project-docs/architecture-stack-proposal.md`
   §3, using ArduinoJson.
4. Stub out (with explicit `TODO` comments, not working code) reading
   widget commands back over Serial — proving ArduinoJson can parse an
   incoming line, but **not** dispatching anything to the display yet.

This is exactly the Week 1 scope: prove the GC9A01+LVGL bring-up path is
viable and surface firmware risk early, in parallel with the physical
prototype unit arriving.

## What this is NOT

**This is not the WebSerial command parser.** That's a distinct, larger
piece of work — `sprint-roadmap.md` Week 3, Tasks 2.3-2.5 (text config,
image config, widget/gauge config) — which needs:

- The actual physical prototype unit in hand and bench-tested (this
  session had neither a physical board nor a PlatformIO toolchain
  available — see "Verification status" below).
- The finalized protocol schema from `/protocol/` (`schema.json` or
  `schema.ts`). That directory did not exist yet when this skeleton was
  written, so the envelope shapes used here (in `src/main.cpp`'s comments
  and `sendHandshake()`) were taken directly from
  `project-docs/architecture-stack-proposal.md` §3 per this task's
  instructions. **If `/protocol/schema.json` or `/protocol/schema.ts`
  exists by the time you're reading this, treat it as the source of
  truth and re-check `src/main.cpp` against it — the schema may have
  moved on from what's hardcoded here.**
- The real WebSerial SPA to integration-test the wire framing against
  (this skeleton assumes newline-delimited JSON with no ack/checksum —
  that assumption is unverified).

`pollSerialForWidgetCommands()` in `src/main.cpp` is deliberately left as
a stub with a long `TODO` block rather than fake working dispatch logic —
see that function's comments for exactly what's missing.

## Verification status — READ BEFORE TRUSTING ANY OF THIS

**Nothing in this directory has been compiled or run against real
hardware in this session.** There was no physical ESP32/GC9A01 unit and
no PlatformIO toolchain available in this environment. Concretely, this
means:

- [ ] **Never run through `pio run` / `pio run -t upload`.** Syntax errors,
      wrong LVGL v8 API calls, or missing lib_deps could all be lurking.
- [ ] **Pin mapping in `src/main.cpp`'s `LGFX` class is a placeholder**,
      based on common ESP32-devkit + GC9A01-module reference wiring, NOT
      this project's actual prototype unit. `project-docs/` has no pinout
      reference doc yet (that's Task 3.2, Week 3, and its own acceptance
      criterion is that it must match real hardware — not be written from
      assumption, same as this file).
- [ ] **`board = esp32dev` in `platformio.ini` is a generic placeholder.**
      Swap it once the team's actual ordered board is known.
- [ ] **`include/lv_conf.h` is a hand-trimmed subset**, not the literal
      template PlatformIO's resolved LVGL version ships with — see the
      header comment in that file for the reconciliation steps if the
      build complains about undefined macros.
- [ ] **Color inversion (`cfg.invert = true`), rotation, and backlight pin
      behavior are all unverified guesses** common to GC9A01 modules but
      not confirmed against the actual panel in hand.
- [ ] **Serial wire framing (newline-delimited JSON, no ack) is an
      assumption**, not confirmed against the WebSerial SPA's connect
      flow (Task 2.2).

## For whoever has the physical prototype unit

1. Wire up the GC9A01 panel to the ESP32 dev board and record the actual
   pin assignments (this becomes the seed for Task 3.2's pinout doc).
2. Update every `// TODO: verify against real wiring` pin in
   `src/main.cpp`'s `LGFX` class to match.
3. `pio run -t upload` and see if it builds at all — fix whatever LVGL v8
   API mismatches or missing lib_deps surface first.
4. Confirm the label + arc actually render correctly on the round panel —
   check for color inversion, rotation, and offset issues (round panels
   make offset/rotation bugs obvious: text will be off-center or clipped
   by the circular bezel if wrong).
5. Confirm the handshake JSON prints correctly over the serial monitor at
   115200 baud on boot.
6. Report back whether the driver bring-up itself was smooth or found
   real issues (LVGL widget bugs, driver instability, timing problems) —
   per the roadmap, that's exactly what determines whether Rapid
   Prototyper needs to be pulled back in during Week 3, or whether
   Frontend/Backend can build Tasks 2.3-2.5 directly on top of this.

## Files

- `platformio.ini` — env targeting a generic ESP32 dev board; LVGL,
  LovyanGFX, and ArduinoJson as `lib_deps`.
- `include/lv_conf.h` — trimmed LVGL v8.4 config (see its own header
  comment for caveats).
- `src/main.cpp` — display + LVGL bring-up, bench-test UI, handshake send,
  and the serial-read stub.
