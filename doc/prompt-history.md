# Cursor Prompt Ledger – Vineyard Mower Dashboard MVP

## Rules / Always-Apply Instructions
- Use React 18 + Vite + TypeScript
- Tailwind for styling unless specified otherwise
- Leaflet + react-leaflet with OSM tiles (no Google Maps)
- rosbridge WebSocket at ws://localhost:9090 (local) or wss://[mower-ip]:9090 (real)
- Safety: never publish cmd_vel unless teleop explicitly enabled
- Prefer hooks (useEffect, useRef) for WebSocket / gamepad logic

## Prompt Sequence (in order applied – newest at bottom)

1. Initial Scaffold (2026-03-11)
   Prompt: "Scaffold a basic React + Vite + TypeScript project structure for a vineyard mower monitoring dashboard MVP. Include: App.tsx responsive layout, Dashboard page with Leaflet map + marker, battery gauge, status indicators, placeholder for rosbridge WebSocket..."

2. GPS + rosbridge Subscription (2026-03-11)
   Prompt: "In vineyard-mower-dashboard: Implement WebSocket connection to rosbridge_suite at ws://localhost:9090. Subscribe to /gps/fix (sensor_msgs/NavSatFix). Update Leaflet marker with lat/lng. Add connection status badge, auto-reconnect..."

3. Gamepad + Teleop Publishing (planned – to be filled when joystick arrives)
   Prompt: "..."

## Open Changes / Ideas
- Add vineyard boundary GeoJSON placeholder
- Implement WebRTC video stream for forward camera
- Add velocity scaling slider UI