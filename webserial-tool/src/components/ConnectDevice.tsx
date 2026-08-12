import { useCallback, useState } from 'react';
import type { DisplayTypeOption } from '../lib/displayTypes';
import {
  connectToDevice,
  describePort,
  isSerialConnectError,
  SerialConnectError,
  type SerialConnection,
} from '../lib/serialConnect';

export interface ConnectDeviceProps {
  /** The display type chosen on the previous (Display-Type Select) step —
   *  used only for copy ("Connect your Round SPI Display Kit"), never to
   *  pre-fill or bypass the real capability handshake. */
  displayType: DisplayTypeOption;
  /** Optional: lets the caller navigate to whatever comes after a
   *  successful connect once that exists (Config Home, Week 3). Not
   *  required — this component is fully usable stood alone. */
  onConnected?: (connection: SerialConnection) => void;
  /** Optional: return to Display-Type Select. */
  onBack?: () => void;
}

type ConnectState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'connected'; connection: SerialConnection }
  | { status: 'error'; error: SerialConnectError };

/**
 * ux-foundation.md §2, "Connect Device" states: idle → (native picker) →
 * connecting → connected, with distinct, readable copy per failure mode
 * (permission denied / device busy / cancelled / handshake failure) rather
 * than one generic "connection failed" message — per Task 2.2's acceptance
 * criteria and the UX doc's explicit state table.
 *
 * Deliberately stops at "connected": Config Home and the Text/Image/Widget
 * config screens are Week 3 scope (Tasks 2.3-2.5) and are not built here.
 */
export function ConnectDevice({ displayType, onConnected, onBack }: ConnectDeviceProps) {
  const [state, setState] = useState<ConnectState>({ status: 'idle' });

  const handleConnect = useCallback(async () => {
    setState({ status: 'connecting' });
    try {
      const connection = await connectToDevice();
      setState({ status: 'connected', connection });
      onConnected?.(connection);
    } catch (err) {
      // connectToDevice() always rejects with a SerialConnectError, but this
      // branch is kept defensive rather than assumed — an uncaught error
      // shape here would otherwise silently fall through with no UI at all.
      const error = isSerialConnectError(err)
        ? err
        : new SerialConnectError(
            'unknown',
            err instanceof Error ? err.message : 'Something went wrong while connecting.',
            err,
          );
      setState({ status: 'error', error });
    }
  }, [onConnected]);

  return (
    <main className="connect-device" aria-labelledby="connect-heading">
      <div className="connect-card">
        {onBack && (
          <button type="button" className="connect-back-link" onClick={onBack}>
            &larr; Choose a different kit
          </button>
        )}

        <h1 id="connect-heading">Connect your kit</h1>
        <p>
          Connect your <strong>{displayType.name}</strong> over USB, then click Connect and pick
          it from the browser&apos;s device list.
        </p>

        {state.status === 'idle' && (
          <button type="button" onClick={handleConnect}>
            Connect your kit
          </button>
        )}

        {state.status === 'connecting' && (
          <button type="button" disabled aria-busy="true">
            Connecting&hellip;
          </button>
        )}

        {state.status === 'error' && (
          <div className="connect-error" role="alert">
            <p className="connect-error-message">{errorCopy(state.error)}</p>
            <button type="button" onClick={handleConnect}>
              Try again
            </button>
          </div>
        )}

        {state.status === 'connected' && (
          <div className="connect-success" role="status">
            <p className="connect-success-heading">
              Connected &mdash; {describePort(state.connection.port)}
            </p>
            <dl className="connect-success-details">
              <div>
                <dt>Device type</dt>
                <dd>{state.connection.descriptor.deviceType}</dd>
              </div>
              <div>
                <dt>Shape</dt>
                <dd>{state.connection.descriptor.shape}</dd>
              </div>
              <div>
                <dt>Resolution</dt>
                <dd>
                  {state.connection.descriptor.resolutionPx[0]}&times;
                  {state.connection.descriptor.resolutionPx[1]}px
                </dd>
              </div>
              <div>
                <dt>Supports</dt>
                <dd>{state.connection.descriptor.supports.join(', ')}</dd>
              </div>
            </dl>
            <p className="connect-success-next">
              Config Home (Text / Image / Widget) is Week 3 scope and isn&apos;t built yet — see
              the project README.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * Distinct, readable copy per failure mode — see module doc comment. Every
 * branch is a specific sentence a customer could act on; none of them is a
 * generic "connection failed."
 */
function errorCopy(error: SerialConnectError): string {
  switch (error.code) {
    case 'no-port-selected':
      return 'Connection cancelled — no device was selected. Click "Try again" and choose your kit from the list.';
    case 'permission-denied':
      return `Permission to access the device was denied. ${error.message}`;
    case 'device-busy':
      return error.message;
    case 'handshake-timeout':
      return error.message;
    case 'handshake-invalid':
      return error.message;
    case 'protocol-version-mismatch':
      return error.message;
    case 'open-failed':
      return error.message;
    case 'not-supported':
      return "This browser doesn't support the Web Serial API.";
    case 'unknown':
    default:
      return error.message || 'Something went wrong while connecting. Please try again.';
  }
}

export default ConnectDevice;
