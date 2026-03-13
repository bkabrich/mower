# Vineyard Mower Dashboard MVP

React + Vite + TypeScript dashboard for monitoring a vineyard mower: map (GPS), battery gauge, and status (mode, speed, connection). Includes placeholder for rosbridge WebSocket and teleop joystick. Test suite uses Vitest and React Testing Library with high coverage.

## Setup

```bash
npm install
npm run dev
```

## Testing

- **Run tests (watch):** `npm test`
- **Run tests once:** `npm test -- --run`
- **Run with coverage:** `npm run test:coverage`

Coverage report is written to `coverage/` (HTML, LCOV, JSON). Open `coverage/index.html` in a browser to view the interactive report. Thresholds are set to 95% for statements, branches, functions, and lines (see `vitest.config.ts`).

## Add teleop joystick (nipplejs)

1. **Create a joystick component** (e.g. `src/components/TeleopJoystick.tsx`):
   - Mount a `nipplejs` zone on a ref (e.g. a div). Use `manager.add()` with `{ mode: 'static', position: { left: '50%', top: '50%' } }` for a fixed on-screen joystick.
   - Listen to `start`, `move`, `end` to get `angle` and `force` (0–1). Convert to linear/angular velocity or twist.
   - Optionally send velocity commands over rosbridge (e.g. publish to `/cmd_vel` or your teleop topic) when the joystick moves.

2. **Wire into Dashboard**:
   - Add `<TeleopJoystick onCommand={(linear, angular) => { ... }} />` in the Dashboard layout (e.g. bottom-right on desktop, or a dedicated teleop panel).
   - When connected, publishing to `/cmd_vel` (geometry_msgs/Twist) will drive the mower in teleop mode.

3. **Rosbridge**:
   - Implement the WebSocket/rosbridge logic described in the comments in `src/pages/Dashboard.tsx` (subscribe to `/gps/fix`, then add subscriptions for mode, battery, speed). Use the same connection to publish `/cmd_vel` from the joystick.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm test` — run tests in watch mode
- `npm run test:coverage` — run tests once and generate coverage report
