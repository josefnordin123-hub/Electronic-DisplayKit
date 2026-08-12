# WebSerial Config Tool — DIY Display Kit

Standalone React + TypeScript + Vite SPA for configuring the Round SPI
Display Kit over the Web Serial API. Stack confirmed in
`project-docs/architecture-stack-proposal.md`; UX/IA source of truth is
`project-docs/ux-foundation.md` (§2, WebSerial Config Tool).

## Status: Week 2 build — browser gate + Display-Type Select + Connect Device

This directory now covers Week 1 (Task 2.1, browser-support gate) and part
of Week 2 (Task 2.2, device connect flow) per `project-docs/sprint-roadmap.md`.
CI (`.github/workflows/ci.yml`) and hosting config (`public/_headers`,
`public/_redirects` — Cloudflare Pages) were added by DevOps Automator in a
concurrent Week 1-2 task — see `DEVOPS-SETUP.md` at the project root for
what's configured vs. what still needs a human with real GitHub/Cloudflare
credentials. Everything below is honest about what's real
and, just as important, honest about what has **not** been checked against
an actual browser or an actual ESP32 kit — see "Not verified" below before
assuming any of this works end to end.

### What's actually working
- **Standard Vite + React + TypeScript project structure** — `package.json`,
  `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`,
  `src/App.tsx`.
- **`src/lib/browserSupport.ts`** — real, self-contained logic that checks
  `navigator.serial` and layers in iOS/iPadOS detection (Task 2.1's core
  acceptance criterion). No React or DOM rendering dependency — it's a
  plain function you can unit test directly.
- **`src/components/BrowserSupportGate.tsx`** — a real React component that
  runs the check before rendering any Connect UI, per the "hard gate" rule
  in `ux-foundation.md`. Implements detection-before-render, plain-language
  unsupported-browser copy, the iOS/WebKit-specific message, a working
  "Copy Link" button with a manual-selection fallback, and a secondary link
  out to onboarding docs (still a placeholder URL — see "Not built yet").
  No dead-end fake "Connect" button anywhere in the unsupported state.
- **`src/lib/displayTypes.ts`** — a static catalog of known display types
  (currently one entry: the round GC9A01 kit), used only for the Display-
  Type Select screen's copy. Adding a second display type later is one new
  array entry here, not a rebuild of the component that renders it.
- **`src/components/DisplayTypeSelect.tsx`** — renders that catalog as a
  real `role="radiogroup"` list of selectable cards (one card today,
  pre-selected), not a hardcoded single `<div>`, per Task 2.2's
  extensibility requirement in `ux-foundation.md`.
- **`src/lib/serialConnect.ts`** — real WebSerial connect logic: calls
  `navigator.serial.requestPort()`, opens the port
  (`port.open({ baudRate: 115200 })`), then reads the device's capability-
  descriptor handshake off `port.readable` per `protocol/schema-v1.md` §1/§3
  (NDJSON framing, one line, parsed and validated with `isCapabilityDescriptor`
  imported directly from `protocol/schema.ts` — types are never redefined
  here). Validates the descriptor's `protocolVersion` major version against
  `PROTOCOL_VERSION` (also imported from `protocol/schema.ts`) per the
  negotiation rule in `schema-v1.md` §2. Distinguishes, with a specific
  `SerialConnectErrorCode` each:
  - `no-port-selected` — user cancelled/closed the native picker.
  - `permission-denied` — `SecurityError` from either `requestPort()` or
    `port.open()`.
  - `device-busy` — `NetworkError`/`InvalidStateError` from `port.open()`
    (the port is claimed by another tab/app, based on documented Chrome
    WebSerial behavior).
  - `open-failed`, `handshake-timeout`, `handshake-invalid`,
    `protocol-version-mismatch`, `not-supported`, `unknown` — see the
    doc-comments on `SerialConnectErrorCode` in the file for each.
  These are not one generic catch-all — each is a distinct union member the
  UI branches on.
- **`src/components/ConnectDevice.tsx`** — wires the above into idle →
  connecting → connected/error UI states (ux-foundation.md's Connect Device
  state table). Each `SerialConnectErrorCode` gets its own readable, on-page
  copy (`role="alert"`) and a "Try again" retry action — nothing is
  console-only. The connected state shows the device's actual reported
  `deviceType`/`shape`/`resolutionPx`/`supports` from the live handshake
  (not the static catalog guess from `displayTypes.ts`), plus an honest
  "Config Home is Week 3 scope and isn't built yet" note rather than a dead
  end or a fake button.
- **`src/App.tsx`** now wires `BrowserSupportGate` → `DisplayTypeSelect` →
  `ConnectDevice` in sequence, per `ux-foundation.md` §2's flow diagram.

### What's NOT built yet (Week 3 scope, per the roadmap — not built here on purpose)
- Config Home (choose Text / Image / Widget) and the Text/Image/Widget
  config screens themselves (Tasks 2.3-2.5).
- Mid-session disconnect/reconnect handling (Task 2.7) — `ConnectDevice`
  does not listen for the `serial` `disconnect` event or attempt any
  cleanup on unmount; a device unplugged after connecting will leave the UI
  showing a stale "connected" state until Task 2.7 is built.
- Sending any `DeviceCommand` (text/image/widget) or reading `ack`/`error`
  responses — `serialConnect.ts` deliberately stops after the capability
  handshake and hands back the still-open port for a later send layer to use.
- The onboarding-docs link in the unsupported screen is still a placeholder
  (`#onboarding-docs`) — swap in the real URL once Section 3 doc hosting
  (Task 3.6) exists.
- QR code on the unsupported-browser screen — still explicitly optional per
  `ux-foundation.md` (Open Question #7), still intentionally unbuilt.
- USB vendor/product-ID filters for `requestPort()` — `serialConnect.ts`
  accepts an optional `filters` param but nothing passes one, because the
  kit's real USB VID/PID isn't known in this environment (no physical
  prototype has been available here — see below). Without it, the native
  picker lists all serial devices, not just the kit; still meets Task 2.2's
  literal acceptance criterion ("user can trigger a browser device-picker
  and select their connected ESP32"), just less targeted than it could be.
- No automated tests exist yet in this repo.

### Not verified — needs a real machine and, for parts of this, real hardware
This sandbox has **no Node/npm installed** (confirmed again for this pass —
`npm install`/`npm run dev`/`tsc` have still never actually been run against
this code) **and no physical prototype kit was available to test against.**
Per `sprint-roadmap.md`'s own Week 2 plan for Task 2.2 ("build/test against
any generic serial device to de-risk the connect logic, then re-validate
against the real unit the moment it lands"), that is exactly the situation
here: this was built and reasoned about only against **the WebSerial API's
documented spec-level behavior and TypeScript's structural types** —
`navigator.serial.requestPort()`/`port.open()`/`port.readable` semantics,
DOMException names Chrome is documented to throw, and the NDJSON handshake
shape defined in `protocol/schema-v1.md`. It has not been exercised against
a real Chrome/Edge session, a real ESP32 running the firmware side of this
protocol, or any device-busy/permission-denied condition actually
triggered on a machine. Concretely, still unconfirmed:
- That `npm install` resolves cleanly and `tsc -b` type-checks this code
  without error — including the cross-directory import of `../../../protocol/schema.ts`
  (which is intentional, see `protocol/README.md`, but untested end to end) and the
  `vite.config.ts` `server.fs.allow: ['..']` addition made to let Vite's dev
  server actually serve a file outside `webserial-tool/`.
- That the real Chrome/Edge `navigator.serial.requestPort()` picker opens
  and returns a `SerialPort` the way this code assumes.
- That `port.open({ baudRate: 115200 })` actually throws `NetworkError` for
  a busy port and `SecurityError` for a denied one on a real machine, rather
  than some other `DOMException` name this code doesn't currently map (in
  which case it falls into the generic `open-failed`/`unknown` branches
  instead of a more specific one — degraded, not broken, but worth
  re-checking against real Chrome DevTools output).
- That real ESP32 firmware actually sends a `\n`-terminated capability
  descriptor line fast enough to beat the 5-second handshake timeout, and
  that the JSON it sends round-trips through `isCapabilityDescriptor()`
  cleanly.
- The full manual browser-gate check described in the original Week 1
  README (Chrome/Edge shows the flow described above; Safari/Firefox shows
  the unsupported screen; a real iPhone/iPad shows the iOS-specific copy)
  — still not run.

```bash
cd webserial-tool
npm install
npm run dev
```

None of the above should be read as "should work" standing in for "does
work" — treat every claim in this README as a code-level description, not
a test result, until someone runs it on a real machine against real
hardware.

### Type dependency note
`package.json` includes `@types/w3c-web-serial` for `navigator.serial`
typings, since the Web Serial API isn't in TypeScript's built-in DOM lib
yet. This hasn't been installed/verified either — if it turns out to be
the wrong package name or unmaintained by the time someone runs
`npm install`, swap in whatever the current recommended WebSerial type
package is.
