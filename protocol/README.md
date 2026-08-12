# `/protocol` — WebSerial Wire Protocol (Single Source of Truth)

**Owner**: Backend Architect (schema authority — see `sprint-roadmap.md` Week 1
roster: *"Backend Architect ... owns 2.6 schema authority, firmware protocol
envelope design"*).
**Status**: v1 locked for MVP build.

## Why this directory exists, and why it's not inside one side's repo

Both the **webserial-tool** frontend (React/TS SPA, Task 2.1-2.7) and the
**ESP32 firmware** (Arduino/PlatformIO + LVGL + ArduinoJson) have to agree on
exactly the same message shapes to talk to each other over WebSerial. If this
schema lived inside the frontend repo, firmware would be reading TypeScript
files (or a stale copy) to know what to parse; if it lived in the firmware
repo, the frontend would face the same problem in reverse. Neither side owns
the contract — it's shared. This directory is that shared contract, meant to
be imported/read by both:

- `schema.ts` — import directly from the webserial-tool frontend as the
  TypeScript source of truth for request/response types.
- `schema.json` — validate against from either side's tooling (frontend
  runtime validation, firmware build-time fixture tests, or any non-JS
  firmware tooling that can't consume `schema.ts` directly).
- `schema-v1.md` — the human-readable spec both teams read before writing
  code against this protocol. Read this first.

**Nothing in this directory may depend on Shopify, the storefront, or
`/shopify-theme/`.** Those are a separate system (commerce) with no wire-level
relationship to the WebSerial protocol.

## Versioning

Every message on the wire — capability descriptor, command envelope, ack,
error — carries `protocolVersion` (e.g. `"1.0"`). Major-version bumps are
breaking changes and get their own `schema-v{N}.md`; old docs are never
overwritten, since firmware already flashed to devices in the field may still
speak an older major version. See `schema-v1.md` §2 and §7 for the full
negotiation and versioning rules.

## How a second display type gets added (the extensibility contract)

Per `architecture-stack-proposal.md` §3 and the spec's non-negotiable
constraint (*"the architecture ... must not be built so narrowly that a
second display type becomes impossible to add later"*), adding e.g. an e-ink
panel is:

1. **Extend the capability descriptor's possible values** — a new
   `deviceType` string, possibly a new `shape` value (if not `round`/`rect`)
   or `colorDepth` value (if not `rgb565`/`rgb888`/`1bit`), and a trimmed
   `supports` array reflecting what that panel actually renders.
2. **Add new widget payload types** if the new display needs config shapes
   the round display doesn't (e.g. a dithering-specific image param) — a new
   entry in `schema-v1.md` §5, a new discriminated union member in
   `schema.ts`, a new `oneOf` branch in `schema.json`.
3. **Add a new frontend renderer module**, selected at runtime by the
   `shape`/`colorDepth` the descriptor reports — registered, not
   hardcoded into the connect flow.
4. **Add a new LVGL display driver + init sequence** on the firmware side —
   the widget definitions and the serial command parser (this schema) are
   reused unchanged.

**What must NOT change**: the generic command envelope
(`protocolVersion`, `type`, `id`), the ack/error response shape, and the
WebSerial connect/request-port/open-connection logic itself. If adding a
display type requires touching any of those, that's a sign the schema was
designed wrong, not a normal extension step.

## Task 2.6 acceptance criteria — explicit cross-reference

Task 2.6 (`project-tasks/diy-display-kit-tasklist.md`): *"Define the data/
message schema sent over WebSerial so it isn't hardcoded to only the round
GC9A01 display — must allow a future second display type to be added without
redesigning the transport/schema layer."*

| # | Acceptance criterion (verbatim) | Met? | How |
|---|---|---|---|
| 1 | *"Config payload includes a device/display-type identifier or capability descriptor (not hardcoded to one resolution/shape)"* | **Met** | `schema-v1.md` §3 / `CapabilityDescriptor` in `schema.ts` / `capabilityDescriptor` in `schema.json`. `deviceType`, `shape`, `resolutionPx`, `colorDepth` are all device-reported fields, not literals baked into the envelope or any command payload. No command payload (§5) hardcodes a resolution or shape — text/widget commands are resolution-agnostic, and image commands *require* the sender to state `widthPx`/`heightPx`/`format` explicitly per-message rather than assuming one screen. |
| 2 | *"Adding a hypothetical second display type would require adding a new config, not rewriting the WebSerial connection/send logic"* | **Met by design, not yet proven against real firmware** | See "How a second display type gets added" above — the change surface is descriptor values + new payload types, and the generic envelope (§4) plus the connect/send transport are untouched by definition. Caveat, stated plainly: this is a design-time guarantee reviewed on paper against the schema. It has not been exercised end-to-end (no second display type has actually been built/tested against this schema), because per spec, a second display type is explicitly out of MVP scope. Treat this row as "structurally satisfied," and re-verify empirically if/when e-ink support is actually attempted. |
| 3 | *"Documented in code comments or a short architecture note for the next developer"* | **Met** | This README plus `schema-v1.md` (full spec with rationale) plus inline doc-comments in `schema.ts` on every type. Exceeds "code comments or a short note" — full spec + typed source + JSON Schema, per the roadmap's "protocol schema v1 (2.6) is documented" week-1 done-criteria. |

## Relationship to other MVP config types (Task 2.3-2.5)

`schema-v1.md` §5 defines the concrete payload for all three MVP config
actions named in the spec's Core Feature 2 ("text, images, simple widgets/
gauges"): `type: "text"`, `type: "image"` (chunked), and `type: "widget"`
with `widget: "clock"` / `widget: "gauge"`. Task 2.3/2.4/2.5's UI work sends
these shapes; it should import `schema.ts` rather than redefining these
types locally.

## What's still open (flagged, not blocking Task 2.6)

- No codegen exists to keep `schema.ts` and `schema.json` mechanically in
  sync — they're hand-maintained in lockstep for v1. Low risk at this size;
  revisit if the schema grows past what's practical to eyeball-diff on every
  change.
- **Week 2 update**: §6 of `schema-v1.md` is now the complete ack/error
  contract — correlation/concurrency rules, host-enforced timeouts,
  host-synthesized error codes (`timeout`, `descriptor_timeout`,
  `port_disconnected_in_flight`), the descriptor-handshake timeout (ties to
  Task 2.2), and stale-response handling are all specified, not just the
  ack/error message shape. This was completed for Task 2.2 (device connect
  flow) to have a concrete contract to build against this week. **What
  remains open**: this is still a design-time contract — it has not been
  validated against real firmware behavior. That validation is Week 3 scope
  (Task 2.3-2.5 build-out against the real prototype, per
  `sprint-roadmap.md`), not this task.
