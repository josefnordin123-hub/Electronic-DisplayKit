import React, { useEffect, useMemo, useState } from 'react';
import { checkWebSerialSupport, type BrowserSupportResult } from '../lib/browserSupport';

export interface BrowserSupportGateProps {
  /** Rendered only once the browser is confirmed to support WebSerial. */
  children: React.ReactNode;
  /**
   * Link into the onboarding docs hub (Section 3 / Task 3.6). That surface
   * isn't built yet as of this Week 1 scaffold, so this defaults to a
   * placeholder anchor rather than a fabricated URL. Pass a real URL once
   * the onboarding doc site exists.
   */
  onboardingDocsUrl?: string;
}

/**
 * The hard gate described in project-docs/ux-foundation.md (§2): WebSerial
 * support is checked *before* any Connect UI renders, and the unsupported
 * state is never a dead end.
 *
 * This component owns only the gate. It does not render Display-Type
 * Select, Connect Device, or any config screen — those are later Week 2-3
 * scope (Tasks 2.2-2.5) and are deliberately not stubbed here so nobody
 * mistakes a placeholder for a working connect flow.
 */
export function BrowserSupportGate({ children, onboardingDocsUrl = '#onboarding-docs' }: BrowserSupportGateProps) {
  const [result, setResult] = useState<BrowserSupportResult | null>(null);

  useEffect(() => {
    // Runs once on mount, before any Connect UI would ever have a chance
    // to render — satisfies "detection happens on page load, before any
    // other WebSerial UI renders" from the UX doc.
    setResult(checkWebSerialSupport());
  }, []);

  // Avoid a flash of either state while the (synchronous, but effect-deferred)
  // check settles. This is a single render tick in practice.
  if (result === null) {
    return null;
  }

  if (result.supported) {
    return <>{children}</>;
  }

  return <UnsupportedBrowserScreen result={result} onboardingDocsUrl={onboardingDocsUrl} />;
}

function UnsupportedBrowserScreen({
  result,
  onboardingDocsUrl,
}: {
  result: BrowserSupportResult;
  onboardingDocsUrl: string;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const currentUrl = useMemo(() => (typeof window !== 'undefined' ? window.location.href : ''), []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context, older
      // browsers) — fall back to a visible, manually-selectable URL rather
      // than silently doing nothing.
      setCopyState('error');
    }
  };

  return (
    <main className="unsupported-screen" role="main" aria-labelledby="unsupported-heading">
      <div className="unsupported-card">
        <h1 id="unsupported-heading">This browser can&apos;t run the config tool</h1>

        {result.reason === 'ios-webkit' ? (
          <p>
            This tool uses a browser feature (WebSerial) that isn&apos;t available on iPhone or
            iPad. That&apos;s not specific to Safari — <strong>every browser on iOS, including
            Chrome for iOS, is built on Apple&apos;s WebKit engine</strong> and none of them
            support WebSerial. Installing a different browser app on this device won&apos;t fix
            it. Please open this page on a desktop or laptop computer using Chrome or Edge
            instead.
          </p>
        ) : (
          <p>
            This tool uses a browser feature (WebSerial) that only works in Chrome or Edge. This
            isn&apos;t a bug in your browser or ours — Safari and Firefox haven&apos;t implemented
            this feature yet. Please open this page in Chrome or Edge to continue.
          </p>
        )}

        <div className="unsupported-copy-link" role="group" aria-label="Copy this page's link">
          <label htmlFor="tool-url">Link to this tool</label>
          <div className="unsupported-copy-link-row">
            <input id="tool-url" type="text" readOnly value={currentUrl} onFocus={(e) => e.currentTarget.select()} />
            <button type="button" onClick={handleCopyLink}>
              {copyState === 'copied' ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          {copyState === 'error' && (
            <p className="unsupported-copy-error">
              Couldn&apos;t copy automatically — select the link above and copy it manually.
            </p>
          )}
          <p className="unsupported-copy-hint">
            Paste this into Chrome or Edge{result.isIOS ? ' on a desktop or laptop' : ''} to pick
            up where you left off.
          </p>
        </div>

        {/*
          QR code: flagged in ux-foundation.md as optional/nice-to-have
          (Open Question #7), not a blocking requirement for the gate.
          Deliberately left unbuilt in this Week 1 scaffold rather than
          shipping a fake/non-functional placeholder — see README for
          status. Revisit if the founder confirms it's worth the build
          cost.
        */}

        <p className="unsupported-secondary-path">
          Not ready to switch devices/browsers yet? You can{' '}
          <a href={onboardingDocsUrl}>read the setup docs</a> while you find a Chrome or Edge
          browser.
        </p>
      </div>
    </main>
  );
}

export default BrowserSupportGate;
