/**
 * Browser support detection for the Web Serial API.
 *
 * Covers Task 2.1's core acceptance criterion: "Tool checks for
 * `navigator.serial` (or equivalent) on load." This module is intentionally
 * synchronous and side-effect-free (no rendering, no navigation) so it can
 * be unit-tested on its own and reused by the gate component.
 *
 * See project-docs/ux-foundation.md, section "2. WebSerial Config Tool —
 * The Chromium-only gate" for the UX rules this logic exists to support:
 *   1. Detection must happen before any Connect UI renders.
 *   2. iOS/iPadOS is a special case: ALL browsers on iOS (including
 *      "Chrome for iOS") are WebKit under the hood, so no iOS browser will
 *      ever support WebSerial, no matter which browser app is installed.
 *      Telling an iOS user to "switch to Chrome" is actively misleading —
 *      they need a different device, not a different app.
 */

export type SupportReason =
  | 'supported'
  | 'ios-webkit'
  | 'no-serial-api';

export interface BrowserSupportResult {
  /** Whether `navigator.serial` is present and usable. */
  supported: boolean;
  /** Machine-readable reason, used to pick the right unsupported-state copy. */
  reason: SupportReason;
  /** True if the current platform is iOS/iPadOS (all-WebKit, no exceptions). */
  isIOS: boolean;
}

/**
 * iOS/iPadOS detection.
 *
 * Two things make this non-trivial and worth isolating in its own function:
 *  - iPadOS 13+ reports a desktop-like UA by default ("Macintosh..."), so a
 *    naive UA string check for "iPhone|iPad|iPod" misses iPads in their
 *    default configuration. We additionally check for a touch-capable Mac
 *    UA, which is the documented way to catch this case.
 *  - This is UA-sniffing, which is inherently best-effort. It is only used
 *    to pick *messaging* (do we say "use a desktop" vs. a generic
 *    unsupported message) — it never gates functionality by itself. The
 *    actual gate is always `'serial' in navigator`.
 */
export function isIOS(nav: Navigator = navigator): boolean {
  const ua = nav.userAgent || '';

  const isClassicIOSDevice = /iPad|iPhone|iPod/.test(ua);

  // iPadOS 13+ "desktop site" default: UA looks like macOS Safari, but
  // `navigator.maxTouchPoints` is > 1 on real iPads (Macs report 0).
  const isIPadDesktopMode =
    /Macintosh/.test(ua) && typeof nav.maxTouchPoints === 'number' && nav.maxTouchPoints > 1;

  return isClassicIOSDevice || isIPadDesktopMode;
}

/**
 * Checks whether the current browser can run the WebSerial-based config
 * tool at all.
 *
 * `nav` is injectable for testing; defaults to the real `navigator`.
 */
export function checkWebSerialSupport(nav: Navigator = navigator): BrowserSupportResult {
  const iOS = isIOS(nav);
  const hasSerial = typeof nav !== 'undefined' && 'serial' in nav;

  if (hasSerial) {
    return { supported: true, reason: 'supported', isIOS: iOS };
  }

  if (iOS) {
    // Distinct reason so the UI never tells an iOS user to "switch to
    // Chrome" — no browser on iOS will ever pass this check.
    return { supported: false, reason: 'ios-webkit', isIOS: true };
  }

  return { supported: false, reason: 'no-serial-api', isIOS: false };
}
