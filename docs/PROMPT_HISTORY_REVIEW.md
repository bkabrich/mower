# Prompt-History vs Current Code – Review

This document compares **`docs/prompt-history.md`** with the current codebase and **`docs/MAP_MOWING_REQUIREMENTS.md`** so the prompt history stays consistent and repeatable.

---

## 1. Platform / project structure

| Prompt history says | Current code | Status |
|---------------------|--------------|--------|
| First prompt: React + Vite + TypeScript, Dashboard, Leaflet map | Web app in `src/`: Vite, Dashboard, Leaflet, React Router, MapControlScreen | **Aligned.** |
| Second & third prompts: "Mower App" as **React Native + TypeScript**, react-native-maps, React Navigation | **Two codebases:** (1) Web: `src/` with Leaflet, React Router. (2) Mobile: `mobile/` with Expo, react-native-maps, React Navigation | **Addressed.** "Subsequent refinements" in prompt-history now states Map & Mowing exists on both web and mobile. |

---

## 2. Path inset / clamping

| Prompt history said | Current code | Status |
|---------------------|--------------|--------|
| "e.g. **2%** inset" | `pathGeneration.ts` (web and mobile): **8%** inset (`INSET_FRACTION = 0.08`), min `0.00015`°, max 45% | **Fixed.** prompt-history now says "e.g. 8% inset; see MAP_MOWING_REQUIREMENTS.md". |

---

## 3. "Draw a quick mowing path"

| Prompt history said | Current code | Status |
|---------------------|--------------|--------|
| "Allow the user to **draw a quick mowing path** or select predefined patterns" | Only **predefined patterns** (stripes, spiral, perimeter, random). No freehand drawing. | **Fixed.** prompt-history now says "select predefined mowing patterns … Optional/future: freehand draw a quick mowing path." |

---

## 4. Single property box and mower position

| Prompt history | Current code | Status |
|----------------|--------------|--------|
| No explicit "one box only" or "mower at center" in original prompts | Store: one green property boundary, NO_GO_ZONES = [], mower at center of property | **Fixed.** "Subsequent refinements" section added: one box only, mower at center; reference to MAP_MOWING_REQUIREMENTS.md. |

---

## 4b. Property boundary, cutting width, path orientation

| Requirement | Current code | Status |
|-------------|--------------|--------|
| Default property boundary: four GPS corners (39.318903,-75.926190; …; 39.319719,-75.927451) | `PROPERTY_BOUNDARY` in both stores uses these four corners; centroid for default position | **Documented** in MAP_MOWING_REQUIREMENTS.md and prompt-history "Subsequent refinements." |
| 50-inch effective cutting width for path spacing | `pathGeneration.ts`: CUTTING_WIDTH_INCHES = 50, step derived for stripe/spiral | **Documented** in MAP_MOWING_REQUIREMENTS.md §2. |
| Paths parallel to boundary edges (not north–south) | `getBoundaryFrame`, `stripesParallelToBoundary`, `spiralParallelToBoundary`, `perimeterThenStripesParallel` in both web and mobile | **Documented** in MAP_MOWING_REQUIREMENTS.md §3 and prompt-history. |

---

## 5. Record Path mode and web focus

| Change | Current code | Status |
|--------|--------------|--------|
| Record Path While Driving (no automatic patterns for demo) | Web and mobile: `isRecording`, `recordedPath`, `addPositionToPath`, Start/Stop/Clear path, Simulate drive; mowing along `recordedPath` with distance-based progress | **Documented** in MAP_MOWING_REQUIREMENTS.md §2–§4. |
| Primary development target: **web app** | Web app in `src/` has full Record Path UI and logic; run with `npm run dev` | **Documented** in MAP_MOWING_REQUIREMENTS.md intro and prompt-history "Current spec." |

---

## 6. Polish (battery, overlay, toast) – web vs mobile

| Requirement | Web (`src/`) | Mobile (`mobile/`) | Status |
|-------------|-------------|---------------------|--------|
| Battery + connection on map | ✅ Badge (dot + %) | ✅ BatteryIndicator | Both have it. |
| Overlay "Mower not connected – connect first" | ✅ Present | ✅ Present | Both. |
| At 100%: Idle + "Mowing complete!" toast + reset progress | ✅ Full | ✅ Full | Both. |
| Green pulsing dot when mowing | ❌ Default marker only | ✅ Pulsing dot | Optional on web; MAP_MOWING_REQUIREMENTS focuses on Record Path. |

---

## 7. Testing (first prompt)

| Prompt history says | Current code | Status |
|---------------------|--------------|--------|
| "Jest + @testing-library" then "Use **vitest** (preferred with Vite)" | Vitest, @testing-library/react, jsdom | **Aligned.** |
| "tests/ folder or __tests__" | Tests next to components (`*.test.tsx`) and in `tests/` | **Aligned.** |

---

## 8. Requirements doc (MAP_MOWING_REQUIREMENTS.md)

- **§8 Testing** added: Vitest setup, test commands, list of test files (MapControlScreen, Dashboard, mowerStore, geoUtils, pathGeneration, components, App, websocket), coverage aims and the single uncovered block (Simulate Drive interval).
- **§7 Helpers and code locations:** Dashboard and its optional `initialState` prop for tests added.
- **§9** = Prompt, **§10** = Reconciliation, **§11** = Future (section numbers shifted after inserting Testing).

---

## 9. Changes applied to docs/prompt-history.md

1. **Reference:** Added at top of polish section: "For Map & Mowing behavior, follow MAP_MOWING_REQUIREMENTS.md in this folder."
2. **Inset:** "2% inset" → "8% inset; see MAP_MOWING_REQUIREMENTS.md".
3. **Draw path:** Wording changed to "select predefined patterns" with "Optional/future: freehand draw."
4. **Duplicates:** Removed duplicate §7–§14 block; kept §1–§6 as summary and single reference to MAP_MOWING_REQUIREMENTS.
5. **Subsequent refinements:** New section at end: one box only, mower at center; platforms (web + mobile); repeatable spec = MAP_MOWING_REQUIREMENTS.md.
6. **Later updates:** Property boundary (four GPS corners), 50-inch cutting width, paths parallel to boundary edges added to "Subsequent refinements" and to MAP_MOWING_REQUIREMENTS.md (§1–§3, §7, prompt).
7. **Record Path + web focus:** MAP_MOWING_REQUIREMENTS.md rewritten for Record Path While Driving; web app as primary target. prompt-history "Current spec" updated to point to Record Path and web app.

---

## 10. File locations

| Document | Path |
|----------|------|
| **Prompt history** | `docs/prompt-history.md` |
| **Repeatable spec** | `docs/MAP_MOWING_REQUIREMENTS.md` |
| **This review** | `docs/PROMPT_HISTORY_REVIEW.md` |
| **Web (primary)** | `src/store/mowerStore.ts`, `src/pages/MapControlScreen.tsx`, `src/lib/geoUtils.ts`, `src/lib/pathGeneration.ts` (pathGeneration kept for future patterns) |
| **Mobile** | `mobile/src/store/mowerStore.ts`, `mobile/src/screens/MapControlScreen.tsx`, `mobile/src/lib/geoUtils.ts`, `mobile/src/components/BatteryIndicator.tsx` |

---

*Review updated for Record Path While Driving and web app as primary development target.*
