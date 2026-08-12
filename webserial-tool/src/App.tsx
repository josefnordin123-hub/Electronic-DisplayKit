import { useState } from 'react';
import { BrowserSupportGate } from './components/BrowserSupportGate';
import { DisplayTypeSelect } from './components/DisplayTypeSelect';
import { ConnectDevice } from './components/ConnectDevice';
import type { DisplayTypeOption } from './lib/displayTypes';

/**
 * Week 2 scope: past the browser-support gate (Task 2.1), the flow is
 * Display-Type Select (Task 2.2 / ux-foundation.md §2) → Connect Device
 * (Task 2.2). Config Home and the Text/Image/Widget config screens
 * (Tasks 2.3-2.5) and mid-session disconnect handling (Task 2.7) are Week 3
 * scope and are NOT implemented here — ConnectDevice stops at showing the
 * connected state and the device's capability descriptor.
 */
function App() {
  const [displayType, setDisplayType] = useState<DisplayTypeOption | null>(null);

  return (
    <BrowserSupportGate>
      {displayType === null ? (
        <DisplayTypeSelect onContinue={setDisplayType} />
      ) : (
        <ConnectDevice displayType={displayType} onBack={() => setDisplayType(null)} />
      )}
    </BrowserSupportGate>
  );
}

export default App;
