# WebSerial Protocol — Schema v1

**Author**: Backend Architect
**Task**: 2.6 — Device-type-agnostic config protocol/schema
**Status**: v1 — locked for MVP build (round GC9A01 display). Extend, don't
break, for any future display type per §7.
**Source of truth**: this directory (`/protocol/`). `schema.ts` and
`schema.json` in this same directory MUST stay in sync with this document —
if they disagree, that's a bug, not a design choice; fix them together in the
same change.

**Week 2 revision note**: §6 (ack/error contract) has been completed with
concurrency, timeout, and host-synthesized-error semantics that were flagged
in Week 1 as "intended design, not yet validated" (see `README.md`'s "What's
still open" section). This is a **non-breaking clarification/completion, not
a `protocolVersion` bump** — every addition below is either (a) a documented
behavioral rule for the host that requires no new wire field, or (b) a new
*optional* field (`origin` on `ErrorResponse`) and new, additive error-code
values, both backwards-compatible per §2's minor-version rule. Nothing prior
was removed, renamed, or had its meaning changed. Driven by Task 2.2 (device
connect flow) starting in parallel this week and needing a concrete ack shape
to code a state machine against, not a guess. Firmware-side validation of
this contract against real hardware remains Week 3 scope, per
`sprint-roadmap.md` — this revision makes the *design* concrete; it does not
claim the design has been proven against real firmware yet.

---

## 0. Scope

This is the wire-level contract between:
- **Host**: the React/TS WebSerial config tool (browser) — Task 2.1-2.5, 2.7.
- **Device**: ESP32 firmware (Arduino/PlatformIO + LVGL + ArduinoJson) —
  firmware protocol parser.

It does not cover Shopify, the storefront, or anything in `/shopify-theme/`.
Those are unrelated systems and must never import from or reference this
directory.

---

## 1. Transport & framing

- Physical transport: Web Serial API (`navigator.serial`), USB CDC to the
  ESP32.
- Framing: **newline-delimited JSON (NDJSON)**. Each message is exactly one
  JSON object, UTF-8 encoded, terminated by a single `\n` (0x0A). No message
  spans multiple lines; no line contains more than one message.
- Rationale: NDJSON is trivial to parse incrementally on both a browser
  `ReadableStream` and an embedded `ArduinoJson` `DeserializeJson` call fed
  byte-by-byte from a ring buffer — no length-prefix framing needed for
  MVP-sized payloads, and it stays human-readable over a serial monitor
  during firmware bring-up.
- Directionality: both host→device (commands) and device→host (descriptor,
  acks, errors) use the same NDJSON framing over the same connection.
- Max single-line message size: **4096 bytes**. Payloads larger than that
  (images) MUST use the chunked transfer fields in §5.2 — this is a hard
  firmware constraint (ESP32 serial RX buffer headroom), not a style
  preference.

---

## 2. `protocolVersion` semantics

- Format: `"<major>.<minor>"` string, e.g. `"1.0"`.
- Every message in both directions — descriptor, command envelope, ack,
  error — carries `protocolVersion`.
- **Major version bump** = breaking change (field removed, field meaning
  changed, required field added). Host and device with different major
  versions MUST refuse to interoperate.
- **Minor version bump** = additive, backwards-compatible (new optional
  field, new enum value). A host on `1.x` MUST be able to talk to a device on
  `1.y` for any `x, y` — minor mismatches are not an error, just possibly
  reduced functionality (e.g. host doesn't know about a widget type the
  firmware added in `1.3`).
- **Negotiation flow**: device sends its capability descriptor (§3)
  immediately on connect, before any command is accepted. Host reads
  `protocolVersion` from the descriptor. If the major version doesn't match
  what the host was built against, host MUST show an "incompatible firmware"
  error state (not attempt to send commands) rather than guessing.
- v1 of this document defines `protocolVersion: "1.0"`.

---

## 3. Capability descriptor (handshake)

Sent **once, unsolicited, by the device**, immediately after the serial
connection opens and before any command is sent by the host. This is the
mechanism that makes the protocol device-type-agnostic (Task 2.6 acceptance
criterion #1) — the host never assumes shape/resolution/color depth; it
reads them.

```json
{
  "protocolVersion": "1.0",
  "deviceType": "gc9a01-round",
  "shape": "round",
  "resolutionPx": [240, 240],
  "colorDepth": "rgb565",
  "supports": ["text", "image", "widget:clock", "widget:gauge"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `protocolVersion` | string | yes | See §2. |
| `deviceType` | string | yes | Free-form but stable identifier, e.g. `"gc9a01-round"`. Not parsed for logic — `shape`/`colorDepth`/`supports` are. Used for display/debug and analytics only. |
| `shape` | string enum | yes | v1 known values: `"round"`, `"rect"`. Host renderer selection keys off this (see `/protocol/README.md`). Unknown values MUST cause host to fall back to a generic/rect renderer, not crash. |
| `resolutionPx` | `[number, number]` | yes | `[widthPx, heightPx]`. For round displays, this is the bounding square. |
| `colorDepth` | string enum | yes | v1 known values: `"rgb565"`, `"rgb888"`, `"1bit"`. Governs image encoding in §5.2 and text color field validity. |
| `supports` | string[] | yes | Subset of known capability tokens: `"text"`, `"image"`, `"widget:clock"`, `"widget:gauge"`. Host MUST hide/disable UI for any config type not present in this list rather than sending it and hoping. New widget tokens follow `"widget:<name>"`. |

**Non-goal**: the descriptor does not include firmware build version,
device serial number, or free-form capability metadata — those are UX/support
concerns, not protocol concerns. Add a separate `deviceInfo` field in a
future minor version if needed; don't overload `deviceType`.

---

## 4. Generic command envelope (host → device)

Every config sent from host to device is one JSON object with this shape:

```json
{ "protocolVersion": "1.0", "type": "text", "id": "a1b2c3", "...type-specific fields": "..." }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `protocolVersion` | string | yes | See §2. |
| `type` | string enum | yes | `"text"` \| `"image"` \| `"widget"`. Discriminates payload shape — see §5. |
| `id` | string | yes | Host-generated correlation ID (short random string, e.g. nanoid(8)). Echoed back in the device's ack/error (§6) so the host can match confirmation to the specific send, required for Task 2.3/2.4/2.5's "confirmation shown that data was sent successfully." |

**This envelope shape (`protocolVersion`, `type`, `id`) never changes across
display types.** Only the type-specific fields below vary, and a second
display type reuses this same envelope untouched — see `/protocol/README.md`.

---

## 5. Per-type payloads

### 5.1 `type: "text"` (Task 2.3)

```json
{
  "protocolVersion": "1.0",
  "type": "text",
  "id": "a1b2c3",
  "text": "Hello, world",
  "color": "#FFFFFF",
  "fontSizePx": 24,
  "align": "center"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `text` | string | yes | UTF-8, max 256 chars (firmware buffer limit). Host MUST truncate/validate client-side before send. |
| `color` | string | no | `#RRGGBB` hex. Default `#FFFFFF`. Firmware converts to native `colorDepth` (e.g. RGB565) on receipt — host never sends pre-converted color. |
| `fontSizePx` | number | no | Default `24`. Firmware clamps to its available LVGL font sizes. |
| `align` | string enum | no | `"left"` \| `"center"` \| `"right"`. Default `"center"`. |

### 5.2 `type: "image"` (Task 2.4)

Images are converted/resized on the **host** to the device's
`resolutionPx`/`colorDepth` (from the descriptor) before sending — the
firmware never resizes or reformats. Because raw pixel data commonly exceeds
the 4096-byte per-line limit (§1), image sends are **chunked**: one `image`
message carries metadata + total chunk count, followed by N `imageChunk`
messages.

```json
{
  "protocolVersion": "1.0",
  "type": "image",
  "id": "d4e5f6",
  "format": "rgb565",
  "widthPx": 240,
  "heightPx": 240,
  "totalChunks": 57,
  "totalBytes": 115200
}
```

Followed by `totalChunks` messages of:

```json
{
  "protocolVersion": "1.0",
  "type": "imageChunk",
  "id": "d4e5f6",
  "index": 0,
  "data": "<base64 chunk, ~2000 bytes decoded>"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `format` | string enum | yes | Must match device's `colorDepth` from the descriptor: `"rgb565"` \| `"rgb888"` \| `"1bit"`. Host MUST NOT send a format the descriptor didn't advertise. |
| `widthPx` / `heightPx` | number | yes | Must exactly match descriptor's `resolutionPx` — firmware rejects (error, §6) a mismatched size rather than attempting to scale. |
| `totalChunks` | number | yes | Count of `imageChunk` messages that will follow, same `id`. |
| `totalBytes` | number | yes | Decoded byte length, for firmware to pre-allocate/validate against. |
| `imageChunk.index` | number | yes | 0-based, strictly sequential. Firmware errors on out-of-order or duplicate index. |
| `imageChunk.data` | string | yes | Base64-encoded slice of the raw pixel buffer. |

Firmware sends a single ack (§6) only after the final chunk, referencing the
original `id` — not one ack per chunk (keeps the serial link from being
saturated with acks on a 57-chunk image).

### 5.3 `type: "widget"`, `widget: "clock"` (Task 2.5)

```json
{
  "protocolVersion": "1.0",
  "type": "widget",
  "id": "g7h8i9",
  "widget": "clock",
  "params": { "format": "24h", "showSeconds": true }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `widget` | string enum | yes | `"clock"` \| `"gauge"` in v1. |
| `params.format` | string enum | no | `"12h"` \| `"24h"`. Default `"24h"`. |
| `params.showSeconds` | boolean | no | Default `false`. |

### 5.4 `type: "widget"`, `widget: "gauge"` (Task 2.5)

```json
{
  "protocolVersion": "1.0",
  "type": "widget",
  "id": "j1k2l3",
  "widget": "gauge",
  "params": { "min": 0, "max": 100, "label": "CPU", "unit": "%", "value": 42 }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `params.min` / `params.max` | number | yes | `max` must be > `min`; host validates before send. |
| `params.label` | string | no | Max 32 chars. Default empty. |
| `params.unit` | string | no | Max 8 chars, e.g. `"%"`, `"°C"`. |
| `params.value` | number | no | Initial needle/fill value. Default `min`. Live value updates post-MVP are out of scope (spec: no live-data dashboards required for MVP beyond the static config). |

`widget` is the discriminator for `params`' shape — adding a third widget
type in a future minor version means adding a new `widget` enum value + its
own `params` shape here, not touching §4's envelope.

---

## 6. Device → host responses

Every command envelope in §4/§5 gets exactly one response, correlated by `id`.
This section defines the **complete** ack/error contract — concurrency
(§6.1), timeouts (§6.2), host-synthesized errors (§6.3), the descriptor
handshake's own wait/timeout rule (§6.4), and stale-response handling (§6.5).
A frontend building Task 2.2's connect flow, or Tasks 2.3-2.5's send/confirm
flow, should not need to guess at any of these — if something the state
machine needs isn't covered below, treat that as a gap in this document, not
something to infer.

```json
{ "protocolVersion": "1.0", "type": "ack", "ackId": "a1b2c3", "status": "ok" }
```

```json
{
  "protocolVersion": "1.0",
  "type": "error",
  "ackId": "d4e5f6",
  "status": "error",
  "code": "size_mismatch",
  "message": "expected 240x240, got 320x240"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string enum | yes | `"ack"` \| `"error"`. |
| `ackId` | string | yes | Echoes the `id` of the command being responded to. |
| `status` | string enum | yes | `"ok"` \| `"error"`. Redundant with `type` by design — cheap sanity check on both sides. |
| `code` | string | error only | Stable machine-readable code, see §6.3's table. |
| `message` | string | no | Human-readable detail, for the host's error toast/log — not for programmatic branching. |
| `origin` | string enum | no | **New in Week 2.** `"device"` \| `"host"`. Absent (the only state possible before this revision) means `"device"` — the object was literally deserialized from a wire message. `"host"` means the host transport layer constructed this `ErrorResponse` locally because nothing came back over the wire (§6.3). UI/state-machine logic MUST still branch on `code`, not `origin` — `origin` is metadata for logging/debugging only, not a second discriminant to add branching on. |

### 6.1 One in-flight command at a time (MVP concurrency rule)

The host MUST NOT send a second command (`text` / `image` / `imageChunk` /
`widget`) while a previously sent command's `id` is still awaiting its
ack/error. Wait for the response — or a timeout (§6.2) — before sending the
next one. This is a hard rule, not a suggestion: firmware's serial RX
handling and single-ack-per-transfer design (§5.2) are not built to arbitrate
multiple concurrently outstanding `id`s. It also matches the UX doc's design
directly — Text/Image/Widget Config's "sending" state disables the send
control until the result resolves (`ux-foundation.md`'s Key Screens/States
table), so the host's transport layer and its UI state should agree on this
by construction, not by coincidence.

**Exception**: within one chunked image transfer, the `imageChunk` messages
are sent back-to-back without waiting for a per-chunk response (there isn't
one — only one ack after the final chunk, per §5.2). The "one in-flight"
rule applies at the *transfer* level: the `image` message plus all its
`imageChunk`s, sharing one `id`, counts as a single in-flight unit. No other
command may be sent until that whole transfer's ack/error/timeout resolves.

### 6.2 Timeouts (host-enforced — the device has no send-timeout concept)

A device that never responds (crashed, wedged mid-write, message lost/
corrupted on the wire) must not leave the host's UI hung on "sending..."
indefinitely — the UX doc is explicit that the Disconnected State "must not
leave the UI hung on a spinner." Timeout enforcement is entirely the host's
responsibility; nothing about it is negotiated with or reported by the
device.

| What's being waited on | Host timeout | Rationale |
|---|---|---|
| `text` / `widget` ack | 5000 ms from send | Small payload, sub-100ms round trip expected; generous margin, not a tight budget. |
| `image` transfer ack — measured from the **last `imageChunk` sent**, not from the initial `image` message | 15000 ms | Firmware must finish decoding/writing up to `totalBytes` into the display buffer after the final chunk before it can ack; longer budget than a plain command. |
| Capability descriptor (post-connect handshake — not technically an "ack" to a command, but the same wait-then-give-up shape) | 3000 ms from serial port open | See §6.4; ties directly to Task 2.2's connect-error states. |

If a timeout elapses with nothing received, the host MUST synthesize a local
error (§6.3) — never wait indefinitely — and MUST re-enable whatever UI
control was disabled for the send, so the customer isn't stranded.

These three numbers are exported as named constants in `schema.ts`
(`DEFAULT_ACK_TIMEOUT_MS`, `IMAGE_ACK_TIMEOUT_MS`,
`DESCRIPTOR_HANDSHAKE_TIMEOUT_MS`) — the host transport layer should
reference the constants, not hardcode the numbers, so a future protocol
revision can retune them in one place.

### 6.3 Host-synthesized errors (never actually sent over the wire)

Two situations require the host to show the user an error even though no
`error` message ever arrived over serial:

1. **Timeout** (§6.2) — nothing came back within budget.
2. **Port disconnected while a command was in flight** — the WebSerial
   `disconnect` event fires, or a read/write throws, before the outstanding
   command's `id` was acked. This **pre-empts** the timeout: the host should
   not sit out the remaining timeout window once the transport itself
   reports the port gone. Transition immediately to Task 2.7's Disconnected
   State instead of showing a generic "send failed" — that's a materially
   different, more actionable state for the user ("reconnect your device")
   than a generic failure.

Both are represented with the same `ErrorResponse` shape from §6's table,
`origin: "host"`, and one of these new v1 host-origin codes:

**Updated v1 error codes** (device-origin unless marked): `parse_error`,
`unsupported_type`, `size_mismatch`, `unsupported_format`,
`chunk_out_of_order`, `chunk_missing`, `buffer_full`, `unknown`,
**`timeout`** (host), **`descriptor_timeout`** (host),
**`port_disconnected_in_flight`** (host). Host MUST treat any unrecognized
`code` string — device- or host-origin — as `unknown` rather than throwing;
this was already true before Week 2 and still holds, it's what makes adding
codes in a future minor version safe.

### 6.4 Descriptor handshake timeout (ties directly to Task 2.2)

If the serial port opens successfully (`navigator.serial`'s connect promise
resolves — Task 2.2's device-picker step succeeded) but no capability
descriptor (§3) arrives within `DESCRIPTOR_HANDSHAKE_TIMEOUT_MS` (3000 ms),
the host must treat this as its own distinct error state, not a generic
connect failure. This is very likely the concrete cause behind Task 2.2's
"device busy" acceptance-criterion case — e.g. the user picked a port that
isn't running the expected firmware, or the ESP32 is mid-boot / mid-flash and
not yet listening on serial.

Synthesize an `origin: "host"`, `code: "descriptor_timeout"` error. There is
no real command `id` to correlate against at this stage (the descriptor is
unsolicited, sent before any command exists) — use the fixed placeholder
`ackId: "descriptor"` so the shape stays uniform with every other error the
host's state machine handles. Suggested user-facing copy: *"Device connected
but didn't respond — check it's powered on and not mid-flash, then try
again"* — distinct from, and more actionable than, a generic "connection
failed."

### 6.5 Unexpected or stale `ackId`

If an `ack` or `error` arrives whose `ackId` doesn't match any command the
host currently considers in flight — most commonly a real device response
that arrives *just after* the host already gave up and synthesized a timeout
error for that same `id` — the host MUST ignore it silently (optionally log
for debugging), not throw and not surface a second, conflicting UI update.
Once the host has committed to a timeout/host-synthesized outcome for an
`id`, that outcome stands even if the "real" response shows up a moment
later; don't let a late-arriving device response un-do a state the UI has
already resolved and moved past.

---

## 7. Extensibility rules (ties to Task 2.6 acceptance criteria)

1. Adding a second display type (e.g. e-ink) means: a new `deviceType`
   string, a new `shape` value if it's not round/rect, a new `colorDepth`
   value if it's not one of the three above, and possibly a trimmed
   `supports` list. **Zero changes to §4's envelope shape.**
2. Adding a new widget means: a new `widget` enum value in §5.3/§5.4's
   family + its own `params` shape, appended to this document as §5.N.
   **Zero changes to §4's envelope shape.**
3. Any change that removes a field, renames a field, or changes a field's
   type is a **breaking change** → bump `protocolVersion` major version and
   write a new `schema-v{N}.md` alongside this one (don't overwrite v1 — old
   firmware in the field may still speak v1).
4. `schema.ts` and `schema.json` in this directory are generated *by hand*
   in lockstep with this document for v1 (no codegen pipeline exists yet —
   flagged as a fast-follow, not blocking for MVP). Any PR touching one MUST
   touch all three.

---

## 8. Explicitly out of scope for v1

- Live/streaming value updates to an already-configured widget (e.g. pushing
  a new gauge value every second) — spec's three core config actions are
  one-shot "program what shows," not a live-data telemetry channel.
- Multi-widget layout/composition on one screen — v1 assumes the
  most-recently-sent config replaces the display's content wholesale.
- Firmware OTA / update-over-serial — explicitly out of scope per
  `architecture-stack-proposal.md` §4.
