/**
 * Known display-type catalog for the Display-Type Select step (Task 2.2 /
 * ux-foundation.md §2 "Display-Type Select").
 *
 * This is a *static, host-side* catalog used only to render the selectable
 * list and its descriptive copy before a device is connected. It is
 * intentionally separate from `protocol/schema.ts`'s `CapabilityDescriptor`:
 * the real, authoritative descriptor for whatever is actually plugged in
 * always comes from the device's own capability handshake
 * (protocol/schema-v1.md §3) once `serialConnect.ts` completes it. Nothing
 * here is ever substituted for that live data — `expectedCapabilities`
 * exists purely so this screen can show "240x240, round" style copy before
 * any device is connected, and so Image Config (Week 3, Task 2.4) has
 * something to size a crop preview against before connect if needed.
 *
 * Per ux-foundation.md: "must render as a real selectable list even with
 * N=1, not a hardcoded skip, so the UI doesn't need rework when N=2." Adding
 * a second display type is exactly one new entry in this array — no changes
 * needed to DisplayTypeSelect.tsx itself.
 */

import type { CapabilityToken, ColorDepth, DisplayShape } from '../../../protocol/schema';

export interface DisplayTypeOption {
  /** Stable identifier for this option, used as the radio-group value/key. */
  id: string;
  /** Shown as the card's title. */
  name: string;
  /** Short description shown under the name. */
  description: string;
  /**
   * What this display type is *expected* to report once connected, for
   * display copy only (e.g. "240x240px, round"). Not used to bypass or
   * pre-fill the real capability handshake — see module doc comment above.
   */
  expectedCapabilities: {
    deviceType: string;
    shape: DisplayShape;
    resolutionPx: [number, number];
    colorDepth: ColorDepth;
    supports: CapabilityToken[];
  };
}

export const DISPLAY_TYPES: DisplayTypeOption[] = [
  {
    id: 'gc9a01-round',
    name: 'Round SPI Display Kit — GC9A01',
    description: 'ESP32 + 240x240 round SPI display + cables + USB-C + 3D-printed enclosure.',
    expectedCapabilities: {
      deviceType: 'gc9a01-round',
      shape: 'round',
      resolutionPx: [240, 240],
      colorDepth: 'rgb565',
      supports: ['text', 'image', 'widget:clock', 'widget:gauge'],
    },
  },
  // A second display type (e.g. a future square/e-ink kit) is added here as
  // a new array entry — see module doc comment. Nothing else in this file,
  // or in DisplayTypeSelect.tsx, needs to change.
];
