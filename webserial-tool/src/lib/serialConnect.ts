/**
 * WebSerial connect + capability-handshake logic (Task 2.2).
 *
 * Owns exactly: `navigator.serial.requestPort()` → `port.open()` → read the
 * device's capability-descriptor handshake (protocol/schema-v1.md §3) →
 * hand back an open `SerialPort` plus the parsed `CapabilityDescriptor`.
 *
 * Deliberately does NOT own: sending any `DeviceCommand` (Tasks 2.3-2.5),
 * or mid-session disconnect detection/reconnect UX (Task 2.7). Those are
 * later scope and would need their own modules/state machines.
 *
 * Types (`CapabilityDescriptor`, `PROTOCOL_VERSION`, `isCapabilityDescriptor`)
 * are imported from `protocol/schema.ts` — the source of truth shared with
 * firmware — never redefined here. See `protocol/README.md`: "import
 * directly from the webserial-tool frontend as the TypeScript source of
 * truth."
 */

import { PROTOCOL_VERSION, isCapabilityDescriptor, type CapabilityDescriptor } from '../../../protocol/schema';

/** Baud rate the ESP32 firmware's serial link is configured for. */
export const DEFAULT_BAUD_RATE = 115200;

/**
 * How long to wait for the device's capability descriptor after the port
 * opens before giving up. Per schema-v1.md §3 the device sends this
 * "once, unsolicited, ... immediately after the serial connection opens" —
 * this is generous headroom for ESP32 boot/USB-CDC enumeration jitter, not
 * a tuned value (no real hardware has been available to measure against;
 * see README "Not verified").
 */
export const DEFAULT_HANDSHAKE_TIMEOUT_MS = 5000;

/**
 * Distinct, UI-mappable failure reasons. Per ux-foundation.md Connect
 * Device state table: "permission denied, wrong device, device busy — each
 * needs distinct, readable copy, not a generic 'connection failed'." This
 * union is what lets `ConnectDevice.tsx` pick specific copy per failure
 * instead of one catch-all message.
 */
export type SerialConnectErrorCode =
  /** `navigator.serial` isn't present. BrowserSupportGate should normally
   *  prevent this from ever executing, but this module doesn't assume that
   *  — it's independently usable/testable. */
  | 'not-supported'
  /** User closed/cancelled the native device picker without choosing a port. */
  | 'no-port-selected'
  /** Serial access blocked by Permissions Policy, an insecure context, or
   *  the user otherwise denied access at the browser/OS level. */
  | 'permission-denied'
  /** The chosen port could not be opened because something else (another
   *  browser tab, a serial monitor, another app) already has it claimed. */
  | 'device-busy'
  /** The port opened, but the connection failed for a reason that isn't
   *  clearly "busy" or "permission" (e.g. the device was unplugged between
   *  picker selection and open). */
  | 'open-failed'
  /** Port opened, but no capability descriptor arrived within the timeout —
   *  likely wrong device / not running the expected firmware. */
  | 'handshake-timeout'
  /** Something arrived, but it wasn't parseable JSON or didn't match the
   *  CapabilityDescriptor shape — likely wrong device or corrupted link. */
  | 'handshake-invalid'
  /** Descriptor parsed fine, but its major protocolVersion doesn't match
   *  what this tool was built against (schema-v1.md §2 negotiation rule). */
  | 'protocol-version-mismatch'
  /** Anything else — still surfaced with the underlying message rather than
   *  silently swallowed. */
  | 'unknown';

export class SerialConnectError extends Error {
  readonly code: SerialConnectErrorCode;
  readonly cause?: unknown;

  constructor(code: SerialConnectErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'SerialConnectError';
    this.code = code;
    this.cause = cause;
  }
}

export function isSerialConnectError(err: unknown): err is SerialConnectError {
  return err instanceof SerialConnectError;
}

export interface SerialConnection {
  port: SerialPort;
  descriptor: CapabilityDescriptor;
}

export interface ConnectOptions {
  baudRate?: number;
  handshakeTimeoutMs?: number;
  /**
   * Optional USB vendor/product ID filters for `requestPort()`. Left unset
   * by default: the confirmed kit's real USB VID/PID isn't known yet (no
   * physical prototype has been available in this environment — see
   * README). Without filters the native picker lists all serial devices,
   * which still satisfies Task 2.2 ("user can trigger a browser
   * device-picker and select their connected ESP32") — it's just less
   * targeted than it could be once the real VID/PID is confirmed.
   */
  filters?: SerialPortFilter[];
}

export function isWebSerialSupported(nav: Navigator = navigator): boolean {
  return typeof nav !== 'undefined' && 'serial' in nav;
}

/**
 * Runs the full connect flow: request port → open → read capability
 * handshake → validate protocol version. Resolves with an open port and
 * its parsed descriptor, or rejects with a `SerialConnectError` carrying a
 * specific `code` for the UI to branch on.
 *
 * On any failure *after* the port successfully opens, this makes a
 * best-effort attempt to close the port again rather than leaving it open
 * and unusable — see `safeClosePort`.
 */
export async function connectToDevice(options: ConnectOptions = {}): Promise<SerialConnection> {
  if (!isWebSerialSupported()) {
    throw new SerialConnectError(
      'not-supported',
      'This browser does not support the Web Serial API.',
    );
  }

  const port = await requestPort(options.filters);
  await openPort(port, options.baudRate ?? DEFAULT_BAUD_RATE);

  try {
    const descriptor = await readCapabilityDescriptor(
      port,
      options.handshakeTimeoutMs ?? DEFAULT_HANDSHAKE_TIMEOUT_MS,
    );

    if (!isProtocolMajorVersionCompatible(descriptor.protocolVersion)) {
      throw new SerialConnectError(
        'protocol-version-mismatch',
        `This kit's firmware speaks protocol v${descriptor.protocolVersion}, but this tool ` +
          `was built for v${PROTOCOL_VERSION}. Update the tool or reflash the kit's firmware ` +
          'so both sides agree on a compatible major version.',
        descriptor,
      );
    }

    return { port, descriptor };
  } catch (err) {
    await safeClosePort(port);
    throw err;
  }
}

/** Best-effort description of the connected device for UI display (e.g.
 *  "Connected — USB device 303A:1001"). Not guaranteed to be populated —
 *  `getInfo()` can return an empty object depending on OS/browser. */
export function describePort(port: SerialPort): string {
  const info = port.getInfo();
  if (info.usbVendorId != null && info.usbProductId != null) {
    return `USB device ${toHex4(info.usbVendorId)}:${toHex4(info.usbProductId)}`;
  }
  return 'Serial device';
}

function toHex4(n: number): string {
  return n.toString(16).padStart(4, '0').toUpperCase();
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

async function requestPort(filters?: SerialPortFilter[]): Promise<SerialPort> {
  try {
    return await navigator.serial.requestPort(filters ? { filters } : undefined);
  } catch (err) {
    throw mapRequestPortError(err);
  }
}

function mapRequestPortError(err: unknown): SerialConnectError {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotFoundError':
        // Thrown when the user closes/cancels the native picker without
        // selecting a device — this is the "cancelled," not "unsupported,"
        // case ux-foundation.md §2.4 explicitly calls out as needing
        // different (lighter) messaging.
        return new SerialConnectError(
          'no-port-selected',
          'No device was selected — the picker was closed or cancelled before a port was chosen.',
          err,
        );
      case 'SecurityError':
        return new SerialConnectError(
          'permission-denied',
          'Serial access was blocked. This can happen if the page is embedded in a way that ' +
            "disallows it, or if the browser's serial permission was denied.",
          err,
        );
      default:
        return new SerialConnectError('unknown', err.message || 'Could not open the device picker.', err);
    }
  }
  return new SerialConnectError(
    'unknown',
    err instanceof Error ? err.message : 'Could not open the device picker.',
    err,
  );
}

async function openPort(port: SerialPort, baudRate: number): Promise<void> {
  try {
    await port.open({ baudRate });
  } catch (err) {
    throw mapOpenError(err);
  }
}

function mapOpenError(err: unknown): SerialConnectError {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NetworkError':
        // Chrome's WebSerial implementation throws NetworkError when the
        // underlying OS-level serial device is already claimed by another
        // process/tab — this is the "device busy" case.
        return new SerialConnectError(
          'device-busy',
          'This device appears to be in use elsewhere — another browser tab, a serial ' +
            'monitor, or another app may already have it open. Close that connection and try again.',
          err,
        );
      case 'InvalidStateError':
        // Port object already open (e.g. a stale reference reused). From a
        // user's perspective this reads the same as "busy" — the port is
        // unavailable to open again right now.
        return new SerialConnectError(
          'device-busy',
          'This device connection is already open. Reconnect from a fresh state and try again.',
          err,
        );
      case 'SecurityError':
        return new SerialConnectError(
          'permission-denied',
          'The browser blocked opening this device (permission denied).',
          err,
        );
      case 'NotFoundError':
        return new SerialConnectError(
          'open-failed',
          'The selected device is no longer available — it may have been unplugged.',
          err,
        );
      default:
        return new SerialConnectError('open-failed', err.message || 'Could not open the device.', err);
    }
  }
  return new SerialConnectError(
    'open-failed',
    err instanceof Error ? err.message : 'Could not open the device.',
    err,
  );
}

/**
 * Reads bytes from `port.readable` until a single `\n`-terminated NDJSON
 * line has arrived (protocol/schema-v1.md §1 framing), parses it, and
 * validates it against `isCapabilityDescriptor`. Releases the reader lock
 * in `finally` so `port.readable` is free for the send/ack flow to use
 * later (Week 3, Tasks 2.3-2.5) — this function never closes the port
 * itself on the success path.
 */
async function readCapabilityDescriptor(port: SerialPort, timeoutMs: number): Promise<CapabilityDescriptor> {
  if (!port.readable) {
    throw new SerialConnectError('open-failed', 'The device connection has no readable stream.');
  }

  const reader = port.readable.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    // Best-effort: unblock the pending reader.read() below.
    reader.cancel().catch(() => {});
  }, timeoutMs);

  const timeoutError = () =>
    new SerialConnectError(
      'handshake-timeout',
      `No data was received from the device within ${timeoutMs}ms of connecting. It may not be ` +
        'running the expected firmware, or may not be sending its capability handshake.',
    );

  try {
    while (true) {
      let readResult: ReadableStreamReadResult<Uint8Array>;
      try {
        readResult = await reader.read();
      } catch (err) {
        // Per the Streams spec, cancelling a reader while a read is pending
        // is implementation-defined in whether it rejects or resolves with
        // `done: true` — handle the reject case here.
        throw timedOut
          ? timeoutError()
          : new SerialConnectError(
              'open-failed',
              err instanceof Error ? err.message : 'Lost the connection while waiting for the device to respond.',
              err,
            );
      }

      // Handle the resolve-with-done-true case of the same cancel() race
      // described above.
      if (timedOut) {
        throw timeoutError();
      }

      const { value, done } = readResult;
      if (done) {
        throw new SerialConnectError(
          'handshake-timeout',
          'The device closed the connection before sending its capability handshake.',
        );
      }

      buffer += decoder.decode(value, { stream: true });
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex === -1) {
        continue;
      }

      const line = buffer.slice(0, newlineIndex).trim();
      return parseCapabilityDescriptorLine(line);
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

function parseCapabilityDescriptorLine(line: string): CapabilityDescriptor {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch (err) {
    throw new SerialConnectError(
      'handshake-invalid',
      "The device's first message wasn't valid JSON. It may not be running the expected firmware.",
      err,
    );
  }

  if (!isCapabilityDescriptor(parsed)) {
    throw new SerialConnectError(
      'handshake-invalid',
      "The device's handshake message didn't match the expected capability-descriptor shape.",
      parsed,
    );
  }

  return parsed;
}

function isProtocolMajorVersionCompatible(deviceProtocolVersion: string): boolean {
  const deviceMajor = deviceProtocolVersion.split('.')[0];
  const hostMajor = PROTOCOL_VERSION.split('.')[0];
  return deviceMajor === hostMajor;
}

async function safeClosePort(port: SerialPort): Promise<void> {
  try {
    await port.close();
  } catch {
    // Best-effort cleanup only — nothing more useful to do if close() itself
    // fails (e.g. device already gone).
  }
}
