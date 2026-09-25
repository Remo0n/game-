# Quickstart: Bento Blocks

## Prerequisites

- Node.js 22 or newer
- npm
- Expo Go on a phone, or an Android/iOS simulator

## Setup

```powershell
npm install
```

## Automated checks

```powershell
npm test
npm run test:scale
```

`npm test` must pass geometry, cut, score, solver, determinism, and a mixed batch of generated puzzles.

`npm run test:scale` prints a report in this shape:

```text
Generated: 10000
Valid: 10000
Rejected: <number>
Average generation time: <ms> ms
Average solver time: <ms> ms
Easy: <percent>%
Medium: <percent>%
Hard: <percent>%
Very Hard: <percent>%
```

Every generated puzzle in that run is valid and solvable. Median generation time should stay under 100 ms. The run fails if median generation time exceeds 500 ms.

## Play

```powershell
npx expo start
```

1. Open the app and press Play. Level 1 is a short bar. Cut it once and fill the rectangle.
2. Finish it and continue. Level 2 is a different generated puzzle. Stars remain after a reload.
3. Open Daily. Note the puzzle, force-close, and open Daily again. It matches.
4. Open Variations and start One Cut. Confirm only one cut is available.
5. From Settings in a development build, open the generator inspector. Enter a seed twice and confirm the board matches, then show the solution overlay.

## What good looks like

- Illegal cuts do not split the block.
- Overlapping drops spring back.
- The play screen has no solution overlay.
- The campaign continues past the third world.
