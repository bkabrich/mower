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