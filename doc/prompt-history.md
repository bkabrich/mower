Scaffold a basic React + Vite + TypeScript project structure for a vineyard mower monitoring dashboard MVP, including comprehensive unit/integration testing aiming for near-100% coverage.

Project requirements:
- Use React 18+, Vite, TypeScript
- Responsive layout (use Tailwind CSS or basic CSS modules)
- Main Dashboard page/component showing:
  - Leaflet map with a marker for mower GPS position (use react-leaflet)
  - Simple battery gauge (SVG circle or progress bar)
  - Status indicators (e.g., mode: idle/teleop, speed, connection status)
- Placeholder for WebSocket connection to rosbridge (commented code to subscribe to /gps/fix and update map marker)

Testing setup:
- Configure Jest + @testing-library/react + @testing-library/jest-dom + @testing-library/user-event
- Add test scripts in package.json: "test": "vitest", "test:coverage": "vitest --coverage"
- Create a tests/ folder (or __tests__ subfolders) with:
  - Unit tests for Dashboard component (rendering, props, battery gauge display, status text)
  - Tests for map component (renders Leaflet map, marker appears with correct position prop)
  - Mock WebSocket connection and test subscription logic / message handling
  - Snapshot tests where appropriate
  - Aim for 95%+ coverage on components, hooks, and utilities
- Use vitest (preferred with Vite) instead of plain Jest if easier setup

Install instructions / dependencies:
- Start with: npm create vite@latest . -- --template react-ts
- Then: npm install react-leaflet leaflet nipplejs
- Testing: npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
- Configure vitest.config.ts with jsdom environment and coverage reporter

Generate all key files including:
- package.json (with scripts)
- vite.config.ts
- vitest.config.ts
- tsconfig.json
- src/App.tsx
- src/main.tsx
- src/components/Dashboard.tsx (or similar)
- Example test files (e.g., Dashboard.test.tsx)
- README with "npm test" and "npm run test:coverage" instructions

After generation, explain how to run tests and view coverage report.





We are continuing development of the "Mower App" — a modern mobile application (React Native + TypeScript) for controlling and monitoring a smart robotic lawn mower.

So far we have:
- Basic app structure with navigation (React Navigation)
- Home screen showing mower connection status and battery level
- Simple connect/disconnect button using Bluetooth (or simulated MQTT/WebSocket)
- A settings screen with mower name, safe zones toggle, and notification preferences
- Zustand store for global state (mowerStatus, isConnected, lastKnownPosition, etc.)

Next phase: implement the core mowing control and visualization features.

Please help me create the following pieces in order:

1. Create a new screen called "MapControlScreen" (or "MowingMapScreen")
   - It should show an interactive map (using react-native-maps)
   - Display the mower's current position as a marker/icon (use a little mower emoji or custom icon)
   - Show the property boundary / no-go zones as polygons (initially hard-coded or from state)
   - Allow the user to draw a quick mowing path or select predefined patterns (stripes, spiral, random)

2. Add controls on this screen:
   - Big START MOWING button (green when ready, disabled when not connected/low battery)
   - STOP / PAUSE button
   - Pattern selector (dropdown or chips): Parallel stripes, Spiral inward, Perimeter first + stripes, Random
   - Mowing progress circle / percentage when active

3. Update the Zustand store to include:
   - mowingPattern: 'stripes' | 'spiral' | 'perimeter' | 'random' | null
   - progressPercent: number (0–100)
   - currentPath: array of {lat: number, lng: number} coordinates

4. When user presses START:
   - Show confirmation dialog ("Start mowing in [pattern] mode?")
   - Simulate sending command to mower (console.log the command payload for now)
   - Start a fake progress simulation (increment progressPercent every few seconds until 100%)

Please provide:
- The new screen component code (MapControlScreen.tsx)
- Any necessary updates to the global store
- Navigation integration (how to get to this screen from Home)
- Basic styling suggestions using StyleSheet or tailwind/styled-components if you're using that

Keep everything clean, type-safe (TypeScript), and mobile-friendly.
If you need to make assumptions (map provider, icons, command format), state them clearly.

Go ahead and write the code + explanations.




We are continuing the "Vineyard Mower MVP" React Native + TypeScript app.

The MapControlScreen with react-native-maps, mower marker, start/stop buttons, pattern selector and fake progress simulation is now implemented and running.

Before we move to real device communication or scheduling, please help polish and fix several small/medium issues I noticed:

1. MAP_MOWING_REQUIREMENTS
§1 Map and zones – One green property box only by default; mower at center of that box; no-go zones 
optional, empty by default.
§2 Paths strictly inside – Inset (8%, min 0.00015°, cap 45%); generate inside inset; clamp after generation; 
clamp again at display time; same for preview and active path.
§3 UI/layout – Battery + connection on map; “Mower not connected – connect first” overlay; at 100% → Idle, reset progress, “Mowing complete!” toast (e.g. 3s).
§4 Mower marker – Green pulsing dot when mowing (progress > 0), default icon otherwise.
§5 Patterns and controls – Short reminder of patterns, Start/Stop/Pause, confirmation.
§6 Acceptance criteria – Checkbox list to verify behavior.
§7 One box only: show a single green property boundary; no second (e.g. red) polygon by default. Place the mower at the center of this boundary.
§8 Paths strictly inside: generate all mowing paths (stripes, spiral, perimeter, random) inside an inset of the property bounding box (8% inset, min 0.00015°, max 45% of axis). Clamp every path point to this inset and clamp again before drawing. Apply to both preview (pattern selected) and active (mowing) path so no line is drawn outside the green polygon.
§9 UI: battery + connection on the map; when not connected show overlay "Mower not connected – connect first"; at 100% progress set Idle, reset progress, show "Mowing complete!" toast (auto-dismiss 3s); when mowing (progress > 0) show mower as green pulsing dot, else default icon.
§10 Keep existing pattern selector, Start/Stop/Pause, and confirmation dialog. Verify against the Acceptance criteria in MAP_MOWING_REQUIREMENTS.md.
§11 One box only: show a single green property boundary; no second (e.g. red) polygon by default. Place the mower at the center of this boundary.
§12 Paths strictly inside: generate all mowing paths (stripes, spiral, perimeter, random) inside an inset of the property bounding box (8% inset, min 0.00015°, max 45% of axis). Clamp every path point to this inset and clamp again before drawing. Apply to both preview (pattern selected) and active (mowing) path so no line is drawn outside the green polygon.
§13 UI: battery + connection on the map; when not connected show overlay "Mower not connected – connect first"; at 100% progress set Idle, reset progress, show "Mowing complete!" toast (auto-dismiss 3s); when mowing (progress > 0) show mower as green pulsing dot, else default icon.
§14 Keep existing pattern selector, Start/Stop/Pause, and confirmation dialog. Verify against the Acceptance criteria in MAP_MOWING_REQUIREMENTS.md.


2. UI / Layout fixes:
   - Add a battery icon + percentage next to the connection status in the header or floating on the map
   - When not connected, show a clearer overlay message on the map: "Mower not connected – connect first"
   
3. Functionality tweaks:
   - When mowing is active (progress > 0), change the mower marker icon/color to indicate it's moving (e.g. green pulsing dot)
   - After progress reaches 100%, automatically set status back to "Idle", show a "Mowing complete!" toast/snackbar, and reset progress
   - After the Mowing Pattern is selected, draw the mower paths only within the bounding box
   - Ensure every mowing path point is strictly inside the property boundary: after generating the path from the pattern, clamp each point to the boundary’s bounding box with a small inward margin (e.g. 2% inset) so the drawn polyline never touches or crosses the boundary edge. Apply this to both the preview path (when a pattern is selected) and the active path (when mowing).
   - The mowing path (preview and active) must be drawn only inside the property polygon. No segment of the path may extend outside the green boundary. Implement by clamping or clipping all path coordinates to the boundary so that the rendered line stays clearly inside the polygon.


If any of these require new dependencies (e.g. expo-haptics), mention how to install them.

Go ahead and implement these refinements.

