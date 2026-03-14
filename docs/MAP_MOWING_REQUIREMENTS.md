# Map & Mowing Screen – Repeatable Requirements

Use this document as the single source of truth when implementing or re-implementing the Map & Mowing (MapControlScreen) behavior for the Vineyard Mower MVP.

**Current focus:** **Web app** (Vite + Leaflet in `src/`). Run with `npm run dev` from the project root. A separate mobile app exists in `mobile/` (Expo) but is not the primary target for this phase.

**Demo/development phase:** Path planning uses **Record Path While Driving** (user drives or simulates; app records GPS into a reusable path). Automatic pattern generation (stripes, spiral, perimeter, random) is **paused** for this phase; code in `src/lib/pathGeneration.ts` remains for future use. Keep path logic modular so it can be swapped back or extended later.

---

## 1. Map and zones (one property box)

- **Single property boundary only by default**
  - Show exactly **one** green polygon: the property boundary (lawn area).
  - Paths and the mower position must be drawn only inside this polygon.
  - Do **not** show a second polygon (e.g. a red no-go zone) unless explicitly required; default to an empty no-go list so the user sees one clear "box."
- **Default property boundary (GPS corners, in order)**
  - Use the following four corners for the property polygon (e.g. in store constants):
    - `39.318903, -75.926190`
    - `39.320263, -75.924727`
    - `39.321090, -75.925980`
    - `39.319719, -75.927451`
- **Mower default position**
  - Place the mower at the **center** (centroid) of the property boundary so it is clearly inside the green area.
  - Compute center as the centroid of the polygon: average of all corner latitudes and longitudes (e.g. for a quad: `(lat0+lat1+lat2+lat3)/4`, `(lng0+lng1+lng2+lng3)/4`).
- **No-go zones (optional)**
  - If no-go zones are configured (e.g. obstacles), draw them as a separate polygon type (e.g. red). Keep the property boundary as the single main "mowing area."

---

## 2. Record Path While Driving (current behavior)

- **Recording**
  - **Start recording path** button: when pressed, set `isRecording = true`; start collecting positions from `lastKnownPosition` (from store; simulated or real GPS).
  - Every time `lastKnownPosition` updates, if `isRecording`: append `{ lat, lng }` to `recordedPath` **only if** distance from the last point is greater than a threshold (e.g. **1.5 m**, haversine) to avoid noise/duplicates.
  - **Stop recording** button: set `isRecording = false`; keep `recordedPath` in store for preview and mowing.
  - **Clear path** button: reset `recordedPath` to empty (shown when there is a path and not recording).
- **Display**
  - Show the recorded path as a **blue polyline** on the map: **dashed** while recording, **solid** when stopped.
  - When recording is active, show a live indicator: e.g. pulsing red dot + "Recording path – drive the mower."
- **Simulate drive (demo)**
  - Add a **Simulate drive** button (enabled only while recording). When on, periodically update `lastKnownPosition` along a small test path inside the boundary so recording can be tested without a real device (e.g. every ~1.2 s).

---

## 3. Mowing with recorded path

- **Start mowing**
  - Uses **recordedPath** as the mowing route. **Start mowing** is disabled if: not connected, battery &lt; 20%, or `recordedPath` has fewer than 2 points (or already mowing).
  - On start: copy `recordedPath` to `currentPath`, set `mowingPosition` to the first point, and run a progress simulation that advances along the path by distance (e.g. 2 m per tick, ~800 ms).
- **Progress and marker**
  - Progress % = (distance covered along path / total path length) × 100. Update `mowingPosition` to the point along the path at that distance (e.g. using `positionAlongPath`).
  - Draw the **active** path: full path in blue; **covered** portion in green (trail behind mower).
  - At 100%: set status to **Idle**, reset progress to 0, clear `mowingPosition`, and show **"Mowing complete!"** toast (auto-dismiss after ~3 s).

---

## 4. Store (Zustand)

- **State:** `isRecording`, `recordedPath` (PathPoint[]), `currentPath`, `mowingPosition` (GpsFix | null), `lastKnownPosition`, `toastMessage`, plus existing connection/battery/status.
- **Actions:** `startRecording`, `stopRecording`, `addPositionToPath(position)` (only appends when `isRecording` and distance ≥ threshold), `clearRecordedPath`; `startMowing` (uses `recordedPath`), `stopMowing`, `pauseMowing`; `setLastKnownPosition`, `setToastMessage`, etc.

---

## 5. UI / layout

- **Battery and connection on the map**
  - Show battery level and connection status on the map (e.g. floating panel top-right): connection indicator (e.g. dot) plus percentage.
- **When not connected**
  - Show a clear overlay on the map: **"Mower not connected – connect first."**
- **Progress at 100%**
  - Automatically: status **Idle**, progress reset to **0**, **"Mowing complete!"** toast that auto-dismisses after a few seconds (e.g. 3 s).

---

## 6. Acceptance criteria (repeatable check)

Use these to verify the web app; see **§9** for mapping to code.

- [ ] Only **one** green polygon (property boundary) is visible by default; no extra red/second box unless no-go zones are explicitly added.
- [ ] Property boundary uses the four specified GPS corners; mower icon is at the **centroid** when the screen loads.
- [ ] **Record path:** "Start recording path" / "Stop recording" and "Clear path" are present; when recording, a "Recording path – drive the mower" indicator and a live blue (dashed) polyline are shown.
- [ ] **Simulate drive:** When recording, "Simulate drive" can be turned on to fake position updates for testing.
- [ ] **Mowing:** Start mowing uses the recorded path; progress and mower marker advance along the path; covered portion is shown in green; at 100%, Idle + "Mowing complete!" toast.
- [ ] Battery and connection are visible on or above the map.
- [ ] When not connected, the overlay **"Mower not connected – connect first"** is shown.
- [ ] Start mowing is disabled when not connected, battery &lt; 20%, or no recorded path (or fewer than 2 points).

---

## 7. Helpers and code locations (web)

- **`src/lib/geoUtils.ts`:** `haversineMeters`, `shouldAddPoint` (min distance 1.5 m), `pathLengthMeters`, `positionAlongPath`.
- **`src/store/mowerStore.ts`:** State and actions above; `PROPERTY_BOUNDARY`, `NO_GO_ZONES`, `DEFAULT_POSITION`.
- **`src/pages/MapControlScreen.tsx`:** Map, recording UI, polylines (recorded + mowing), simulate drive, Start/Stop mowing, confirmation modal, toast.

---

## 8. Prompt (copy-paste for AI or developer)

```
Implement the Map & Mowing screen for the Vineyard Mower **web app** (Vite + Leaflet, npm run dev) according to docs/MAP_MOWING_REQUIREMENTS.md. In short:

1. One box only: single green property boundary (corners: 39.318903,-75.926190; 39.320263,-75.924727; 39.321090,-75.925980; 39.319719,-75.927451). Mower at centroid. No second polygon by default.

2. Record Path While Driving: "Start recording path" / "Stop recording"; when recording, append lastKnownPosition to recordedPath only if distance from last point ≥ 1.5 m (haversine). Show recorded path as blue polyline (dashed while recording, solid when stopped). "Clear path" to reset. "Simulate drive" (when recording) to fake position updates for demo.

3. Mowing: Start mowing uses recordedPath (disabled if !connected or battery < 20% or recordedPath.length < 2). Simulate progress along path (distance-based); move mower marker along path; draw covered portion in green. At 100%: Idle, reset progress, "Mowing complete!" toast (3 s).

4. UI: battery + connection on map; overlay "Mower not connected – connect first" when disconnected. Confirmation dialog before start mowing.

5. Verify against the Acceptance criteria in MAP_MOWING_REQUIREMENTS.md.
```

---

## 9. Reconciliation with actual code (web app)

The following table maps requirements to the current implementation so the doc and code stay aligned. Verified against `src/` as of last update.

| Requirement | Implementation (file → detail) | Status |
|-------------|--------------------------------|--------|
| **§1** Property boundary, four corners | `mowerStore.ts`: `PROPERTY_BOUNDARY` = `[{ lat: 39.318903, lng: -75.92619 }, { lat: 39.320263, lng: -75.924727 }, { lat: 39.32109, lng: -75.92598 }, { lat: 39.319719, lng: -75.927451 }]` | ✅ |
| **§1** Mower at centroid | `mowerStore.ts`: `DEFAULT_POSITION` (internal) = average of above; `lastKnownPosition` initial state | ✅ |
| **§1** No-go zones empty by default | `mowerStore.ts`: `NO_GO_ZONES = []` | ✅ |
| **§2** Start/Stop recording | `MapControlScreen.tsx`: Button "Start recording path" / "Stop recording"; when recording, extra "Stop" button; both call `startRecording` / `stopRecording` | ✅ |
| **§2** Append only if distance ≥ threshold | `geoUtils.ts`: `RECORD_MIN_DISTANCE_M = 1.5`; `shouldAddPoint()` uses haversine; `mowerStore.ts` `addPositionToPath()` calls it | ✅ |
| **§2** Recording when `lastKnownPosition` updates | `MapControlScreen.tsx`: `useEffect` on `lastKnownPosition` + `isRecording` calls `addPositionToPath(lastKnownPosition)` | ✅ |
| **§2** Blue polyline, dashed when recording | `MapControlScreen.tsx`: `<Polyline pathOptions={{ dashArray: isRecording ? '8, 6' : undefined }}>` for `recordedPathLatLng` | ✅ |
| **§2** Recording indicator text | `MapControlScreen.tsx`: "Recording path – drive the mower" + red pulsing dot (CSS `animate-pulse`) when `isRecording` | ✅ |
| **§2** Clear path | `MapControlScreen.tsx`: "Clear path" button when `recordedPath.length > 0 && !isRecording`; calls `clearRecordedPath()` | ✅ |
| **§2** Simulate drive | `MapControlScreen.tsx`: "Simulate drive" button (disabled when `!isRecording`); `useEffect` with `setInterval(1200)` updates `setLastKnownPosition` along `SIMULATE_PATH` (small square around centroid) | ✅ |
| **§3** Start mowing disabled conditions | `MapControlScreen.tsx`: `canStartMowing = isConnected && batteryPercent >= 20 && recordedPath.length >= 2 && mowingStatus !== 'mowing'` | ✅ |
| **§3** Copy recordedPath → currentPath, mowingPosition at start | `mowerStore.ts`: `startMowing()` copies to `currentPath`, sets `mowingPosition` to first point | ✅ |
| **§3** Progress by distance, interval | `mowerStore.ts`: `MOWING_STEP_M = 2`, `MOWING_INTERVAL_MS = 800`; `mowingDistance += MOWING_STEP_M`; `progressPercent = (mowingDistance / totalLen) * 100`; `positionAlongPath(currentPath, mowingDistance)` → `mowingPosition` | ✅ |
| **§3** Full path blue, covered portion green | `MapControlScreen.tsx`: When mowing, `<Polyline>` for `currentPathLatLng` (blue), `<Polyline>` for `coveredPathLatLng` (green, weight 4) when `progressPercent > 0` | ✅ |
| **§3** At 100%: Idle, progress 0, mowingPosition null, toast 3 s | `mowerStore.ts`: On `nextPercent >= 100`, sets `mowingStatus: 'idle'`, `progressPercent: 0`, `mowingPosition: null`, `toastMessage: 'Mowing complete!'`; `setTimeout(..., 3000)` clears toast | ✅ |
| **§4** Store state and actions | `mowerStore.ts`: All listed state and actions present; no `mowingPattern` (removed for Record Path phase) | ✅ |
| **§5** Battery + connection on map | `MapControlScreen.tsx`: Floating div top-right with dot (green/slate) + `batteryPercent`% | ✅ |
| **§5** Not connected overlay | `MapControlScreen.tsx`: When `!isConnected`, overlay "Mower not connected – connect first" | ✅ |
| **§7** Helpers | `geoUtils.ts`: `haversineMeters`, `shouldAddPoint`, `pathLengthMeters`, `positionAlongPath`; `RECORD_MIN_DISTANCE_M` exported | ✅ |
| Confirmation before start mowing | `MapControlScreen.tsx`: Modal "Start mowing?" / "Mow along the recorded path (N points)?" with Cancel / Start | ✅ |
| Toast display | `MapControlScreen.tsx`: When `toastMessage`, fixed bottom center div with message | ✅ |

**Intentional differences (no code change):**

- **Mower marker when mowing:** Requirements §5 (older) mentioned a "green pulsing dot" when mowing. Web app currently keeps the same tractor icon for the mower marker; only the position moves along the path. This is acceptable for the demo; pulsing dot is optional and implemented on mobile only.

---

## 10. Future / optional (not current)

- **Automatic path patterns** (stripes, spiral, perimeter, random) and **cutting width / paths parallel to boundary** are documented in earlier sections of the repo history; code exists in `src/lib/pathGeneration.ts` for future use. Current demo uses **Record Path** only.
- **Mobile app** (`mobile/`): Same Record Path behavior is implemented there; primary development focus for this phase is the web app.

---

*Last updated: Record Path While Driving as current behavior; web app as primary target; acceptance criteria and prompt aligned; §9 added to reconcile requirements with actual code.*
