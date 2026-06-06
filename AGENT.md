# Agent Instructions: Space Defender Next.js

## Project Overview
This is a port of a Python Pygame space shooter game to a Next.js application. The game is a fast-paced shooter featuring enemies, a boss, power-ups, and a leaderboard system.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Rendering**: HTML5 Canvas API (60fps game loop)
- **Testing**: Vitest with jsdom

## Core Game Architecture
- **Logic Separation**: Game engine logic (classes like `Player`, `Enemy`, `Boss`, `Bullet`) is decoupled from the React UI layer in `components/game-logic.ts` to enable headless unit testing.
- **State Management**: `useRef` is used for the main `gameState` to avoid React's re-render overhead during the high-frequency game loop.
- **Coordinates**: Screen dimensions are fixed at 800x600.

## Development Rules & Workflow
### 1. Feature Implementation & Testing
- **Unit Tests are Mandatory**: Every new game mechanic or feature **must** have corresponding unit tests in `components/game-logic.test.ts` (or new test files).
- **Test-Driven Approach**: prefer writing the test for the logic before or during implementation.
- **Verification**: Running `npm run test` is a **must** after implementing any feature to ensure no regressions in game physics or combat logic.

### 2. Code Quality
- Maintain the separation between `game-logic.ts` (pure JS/TS logic) and `Game.tsx` (React rendering/lifecycle).
- Use TypeScript types strictly for game entities.

## Key Configuration
- **Development Port**: The project is configured to run on `localhost:3001`.
- **Control Scheme**: Support both Arrow Keys and WASD for movement; Space for shooting.
- **Test Command**: `npm run test` (runs Vitest).

## Future Roadmap
- [ ] Complete E2E testing suite with Playwright.
- [ ] Implement more advanced boss mechanics.
- [ ] Add additional power-up types.
- [ ] Optimize canvas rendering for higher resolutions.
