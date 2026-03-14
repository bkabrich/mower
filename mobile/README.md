# Mower App (React Native)

Mobile app for the Vineyard Mower MVP: Home, Map & Mowing control, Settings.

## Setup

```bash
cd mobile
npm install
npx expo start
```

Then press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

## Structure

- **App.tsx** – React Navigation stack (Home → MapControl, Settings)
- **src/screens/HomeScreen.tsx** – Connection status, battery, link to Map & Mowing
- **src/screens/MapControlScreen.tsx** – Map (react-native-maps), pattern selector, Start/Pause/Stop, progress
- **src/store/mowerStore.ts** – Zustand: `isConnected`, `batteryPercent`, `lastKnownPosition`, `mowingPattern`, `progressPercent`, `currentPath`, start/stop/pause
- **src/types/** – `mower.ts` (GpsFix, PathPoint, MowingPattern), `navigation.ts` (RootStackParamList)
- **src/lib/pathGeneration.ts** – `generatePathForPattern()` for stripes, spiral, perimeter, random

## Assumptions

- **Map:** Uses `react-native-maps` (Apple/Google maps). No API key required for basic use on device/simulator; set `googleMapsApiKey` in `app.json` for Android if needed.
- **START mowing:** Confirmation dialog → `console.log` payload → fake progress simulation (every 2s +8% until 100%).
- **Command payload:** `{ command: 'start_mowing', pattern: 'stripes'|'spiral'|'perimeter'|'random', timestamp }`.
