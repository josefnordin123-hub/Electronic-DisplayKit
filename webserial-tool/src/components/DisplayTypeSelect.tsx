import { useState } from 'react';
import { DISPLAY_TYPES, type DisplayTypeOption } from '../lib/displayTypes';

export interface DisplayTypeSelectProps {
  /** Called with the chosen option once the customer confirms. */
  onContinue: (displayType: DisplayTypeOption) => void;
}

/**
 * ux-foundation.md §2, "Display-Type Select": a step between the
 * browser-support gate and Connect Device. Today it has exactly one
 * selectable option (the round GC9A01 kit), pre-selected — but it renders
 * as a real `role="radiogroup"` list, not a hardcoded single `<div>`, so a
 * second display type (`src/lib/displayTypes.ts`) is a new array entry, not
 * a rebuild of this component.
 */
export function DisplayTypeSelect({ onContinue }: DisplayTypeSelectProps) {
  const [selectedId, setSelectedId] = useState<string>(DISPLAY_TYPES[0]?.id ?? '');
  const selected = DISPLAY_TYPES.find((option) => option.id === selectedId);

  return (
    <main className="display-type-select" aria-labelledby="display-type-heading">
      <div className="display-type-card-column">
        <h1 id="display-type-heading">Choose your kit</h1>
        <p>Select the display kit you&apos;re setting up.</p>

        <div className="display-type-list" role="radiogroup" aria-labelledby="display-type-heading">
          {DISPLAY_TYPES.map((option) => {
            const isSelected = option.id === selectedId;
            const { resolutionPx, shape } = option.expectedCapabilities;
            return (
              <label
                key={option.id}
                className={`display-type-card${isSelected ? ' display-type-card--selected' : ''}`}
              >
                <input
                  type="radio"
                  name="display-type"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setSelectedId(option.id)}
                />
                <span className="display-type-card-body">
                  <span className="display-type-card-name">{option.name}</span>
                  <span className="display-type-card-description">{option.description}</span>
                  <span className="display-type-card-meta">
                    {resolutionPx[0]}&times;{resolutionPx[1]}px &middot; {shape}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <button type="button" disabled={!selected} onClick={() => selected && onContinue(selected)}>
          Continue
        </button>
      </div>
    </main>
  );
}

export default DisplayTypeSelect;
