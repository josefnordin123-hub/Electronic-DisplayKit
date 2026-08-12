/**
 * WebSerial Protocol — Schema v1
 * Task 2.6 — Device-type-agnostic config protocol/schema
 *
 * Source of truth for the wire protocol between the WebSerial config tool
 * (webserial-tool frontend) and ESP32 firmware. Mirrors /protocol/schema-v1.md
 * and /protocol/schema.json — all three MUST stay in sync; if they disagree,
 * that's a bug. See schema-v1.md for full field-by-field rationale.
 *
 * DO NOT import display-specific assumptions (round-only, RGB565-only, etc.)
 * into these types. Every shape here must remain valid for a hypothetical
 * second display type (e.g. e-ink) without modification — extend by adding
 * new literal union members and new payload interfaces, not by editing the
 * envelope shapes (CommandEnvelope / DeviceResponse / CapabilityDescriptor).
 *
 * Week 2: the ack/error contract (DeviceResponse and friends, below) was
 * completed with concurrency, timeout, and host-synthesized-error semantics
 * — see schema-v1.md §6. Non-breaking: additive optional field (`origin`)
 * and new host-only error codes only, no protocolVersion bump.
 */

export const PROTOCOL_VERSION = "1.0" as const;

// ---------------------------------------------------------------------------
// 0. Host-enforced timing constants (Week 2 addition — see schema-v1.md §6.2)
//
// These are never sent on the wire; the device has no send-timeout concept.
// The host transport layer MUST reference these constants rather than
// hardcoding the numbers, so a future protocol revision can retune them in
// one place. Non-breaking: purely host-side behavior, no wire format change.
// ---------------------------------------------------------------------------

/** Wait budget for a `text` / `widget` command's ack, from send. schema-v1.md §6.2. */
export const DEFAULT_ACK_TIMEOUT_MS = 5000;

/** Wait budget for a chunked `image` transfer's ack, measured from the LAST `imageChunk` sent (not the initial `image` message). schema-v1.md §6.2. */
export const IMAGE_ACK_TIMEOUT_MS = 15000;

/** Wait budget for the capability descriptor to arrive after the serial port opens. schema-v1.md §6.2/§6.4. */
export const DESCRIPTOR_HANDSHAKE_TIMEOUT_MS = 3000;

/** Placeholder `ackId` for a host-synthesized descriptor-timeout error — there is no real command `id` to correlate against at the handshake stage. schema-v1.md §6.4. */
export const DESCRIPTOR_TIMEOUT_ACK_ID = "descriptor";

// ---------------------------------------------------------------------------
// 1. Capability descriptor (device -> host handshake, sent once on connect)
// ---------------------------------------------------------------------------

/** Known display shapes. Extend with new literals for future display types. */
export type DisplayShape = "round" | "rect";

/** Known pixel color depths / encodings. Extend for future panel tech (e.g. grayscale). */
export type ColorDepth = "rgb565" | "rgb888" | "1bit";

/** Capability tokens a device can advertise. "widget:<name>" is the pattern for widgets. */
export type CapabilityToken =
  | "text"
  | "image"
  | "widget:clock"
  | "widget:gauge"
  | (string & {}); // forward-compatible: unknown tokens must not break parsing

export interface CapabilityDescriptor {
  protocolVersion: string;
  /** Free-form stable identifier, e.g. "gc9a01-round". Debug/analytics only — not parsed for logic. */
  deviceType: string;
  shape: DisplayShape;
  /** [widthPx, heightPx]. For round displays, the bounding square. */
  resolutionPx: [number, number];
  colorDepth: ColorDepth;
  /** Host MUST hide/disable UI for any config type not present here. */
  supports: CapabilityToken[];
}

// ---------------------------------------------------------------------------
// 2. Generic command envelope (host -> device)
// ---------------------------------------------------------------------------

export type CommandType = "text" | "image" | "imageChunk" | "widget";

/** Fields present on every host -> device command, regardless of type. */
export interface EnvelopeBase {
  protocolVersion: string;
  type: CommandType;
  /** Host-generated correlation ID, echoed back in the device's ack/error as `ackId`. */
  id: string;
}

// ---------------------------------------------------------------------------
// 3. Per-type payloads
// ---------------------------------------------------------------------------

export type TextAlign = "left" | "center" | "right";

/** Task 2.3 — text display config. */
export interface TextCommand extends EnvelopeBase {
  type: "text";
  /** UTF-8, max 256 chars (firmware buffer limit) — host must validate before send. */
  text: string;
  /** "#RRGGBB". Default "#FFFFFF" if omitted. */
  color?: string;
  /** Default 24 if omitted; firmware clamps to available LVGL font sizes. */
  fontSizePx?: number;
  /** Default "center" if omitted. */
  align?: TextAlign;
}

/** Task 2.4 — image config metadata. Must be followed by `totalChunks` ImageChunkCommand messages sharing the same `id`. */
export interface ImageCommand extends EnvelopeBase {
  type: "image";
  /** Must match the device's advertised colorDepth exactly. */
  format: ColorDepth;
  /** Must match the device's advertised resolutionPx exactly — firmware rejects mismatches rather than scaling. */
  widthPx: number;
  heightPx: number;
  totalChunks: number;
  /** Decoded byte length, for firmware pre-allocation/validation. */
  totalBytes: number;
}

/** One slice of a chunked image transfer. `id` matches the preceding ImageCommand. */
export interface ImageChunkCommand extends EnvelopeBase {
  type: "imageChunk";
  /** 0-based, strictly sequential. */
  index: number;
  /** Base64-encoded slice of the raw pixel buffer (~2000 bytes decoded per chunk, keep line under the 4096-byte transport limit). */
  data: string;
}

export type WidgetKind = "clock" | "gauge";

export interface ClockWidgetParams {
  /** Default "24h" if omitted. */
  format?: "12h" | "24h";
  /** Default false if omitted. */
  showSeconds?: boolean;
}

export interface GaugeWidgetParams {
  min: number;
  /** Must be > min — host validates before send. */
  max: number;
  /** Max 32 chars. */
  label?: string;
  /** Max 8 chars, e.g. "%", "°C". */
  unit?: string;
  /** Initial needle/fill value. Default = min if omitted. Live streaming updates are out of v1 scope. */
  value?: number;
}

/** Task 2.5 — widget config. `widget` discriminates `params`' shape. */
export type WidgetCommand =
  | (EnvelopeBase & { type: "widget"; widget: "clock"; params: ClockWidgetParams })
  | (EnvelopeBase & { type: "widget"; widget: "gauge"; params: GaugeWidgetParams });

/** Union of every valid host -> device command. Adding a widget/config type extends this union, not EnvelopeBase. */
export type DeviceCommand = TextCommand | ImageCommand | ImageChunkCommand | WidgetCommand;

// ---------------------------------------------------------------------------
// 4. Device -> host responses
// ---------------------------------------------------------------------------

export type ResponseStatus = "ok" | "error";

/** v1 stable error codes actually generated by firmware, on the wire. */
export type DeviceErrorCode =
  | "parse_error"
  | "unsupported_type"
  | "size_mismatch"
  | "unsupported_format"
  | "chunk_out_of_order"
  | "chunk_missing"
  | "buffer_full"
  | "unknown";

/**
 * Week 2 addition — error codes the HOST synthesizes locally when nothing
 * came back over the wire (ack/error never arrived, or arrived too late).
 * Never sent by firmware. See schema-v1.md §6.2-§6.4.
 */
export type HostErrorCode =
  /** No ack/error within DEFAULT_ACK_TIMEOUT_MS / IMAGE_ACK_TIMEOUT_MS. §6.2 */
  | "timeout"
  /** No capability descriptor within DESCRIPTOR_HANDSHAKE_TIMEOUT_MS after the serial port opened. §6.4 */
  | "descriptor_timeout"
  /** WebSerial disconnect event / read-write throw while a command's id was still outstanding — pre-empts the timeout. §6.3 */
  | "port_disconnected_in_flight";

/** v1 stable error codes. Host must treat any unrecognized string as "unknown" (forward-compatible). */
export type ErrorCode = DeviceErrorCode | HostErrorCode | (string & {});

export interface AckResponse {
  protocolVersion: string;
  type: "ack";
  /** Echoes the `id` of the command being responded to. */
  ackId: string;
  status: "ok";
}

export interface ErrorResponse {
  protocolVersion: string;
  type: "error";
  ackId: string;
  status: "error";
  code: ErrorCode;
  /** Human-readable detail for UI display/logging — not for programmatic branching, use `code`. */
  message?: string;
  /**
   * Week 2 addition, optional/non-breaking. Absent or "device" means this
   * object was deserialized from an actual wire message. "host" means the
   * transport layer constructed it locally (timeout, descriptor handshake
   * timeout, or mid-send disconnect) — see schema-v1.md §6.3.
   * UI/state-machine logic must still branch on `code`, not `origin` —
   * this field is metadata for logging/debugging only.
   */
  origin?: "device" | "host";
}

export type DeviceResponse = AckResponse | ErrorResponse;

// ---------------------------------------------------------------------------
// 5. Type guards (convenience helpers for the frontend transport layer)
// ---------------------------------------------------------------------------

export function isCapabilityDescriptor(msg: unknown): msg is CapabilityDescriptor {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "deviceType" in msg &&
    "shape" in msg &&
    "resolutionPx" in msg &&
    "colorDepth" in msg &&
    "supports" in msg
  );
}

export function isDeviceResponse(msg: unknown): msg is DeviceResponse {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "type" in msg &&
    ((msg as { type?: unknown }).type === "ack" || (msg as { type?: unknown }).type === "error")
  );
}
