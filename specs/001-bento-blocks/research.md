# Research: Bento Blocks

## Decision: Expo app with a pure engine folder

- **Decision**: Use the current stable Expo SDK with Expo Router, and keep puzzle rules in `src/engine` with zero UI imports.
- **Rationale**: Reanimated, Gesture Handler, haptics, and file-based screens are the supported phone stack. A pure engine makes the 10,000-puzzle run a Node test.
- **Alternatives considered**: Bare React Native CLI was rejected as slower to wire up for the same libraries. A separate published package was rejected as extra structure for one app.

## Decision: Solution-first guillotine-style dissection

- **Decision**: Build a stock polyomino, recursively split it with axis-aligned cuts into a known cut tree, then pack the leaves into a target. If packing fails, the target is the stock itself and placements are the original cells.
- **Rationale**: Replaying the cut tree proves solvability without a search. Identity packing is a guaranteed fallback so a retry budget cannot end in an unsolvable board.
- **Alternatives considered**: Independent random targets and stocks can fail to have a straight-cut stock. A full exact-cover search on every candidate is too slow for the time budget.

## Decision: Mulberry32 plus a versioned mix

- **Decision**: Mix `generatorVersion`, campaign or daily seed, level number, and variation into a 32-bit seed, then use mulberry32 for every choice.
- **Rationale**: Same inputs, same sequence, including on different phones.
- **Alternatives considered**: `Math.random` is not reproducible. A cryptographic RNG is unnecessary for puzzles.

## Decision: Difficulty is measured, then classified

- **Decision**: Aim at a curve anchored at the requested level scores. Classify the measured 0–100 score into Easy, Medium, Hard, and Very Hard. Debug requests for a specific tier reject out-of-band results. Campaign play accepts a result near the target and reports the measured tier.
- **Rationale**: The tier the player sees matches the puzzle they received. The curve stops the board from growing without limit.
- **Alternatives considered**: Four fixed presets ignore the continuous score. Using only cell count makes large easy puzzles.

## Decision: Bounded solver off the hot path

- **Decision**: Generation validates by replaying the cut tree and checking placements. A backtracker with a node cap, largest-piece-first ordering, and a bitmask occupancy grid serves the inspector and tests.
- **Rationale**: An 8×8 grid fits in two 32-bit words per row mask stored as numbers. Searching every very-hard puzzle during generation would blow the 500 ms budget.
- **Alternatives considered**: Always solving from scratch duplicates work the generator already did and is slower.

## Decision: Laser cuts use cell centers

- **Decision**: A laser line splits cells by which side of the infinite line their centers fall on. Centers on the line are rejected unless a tiny nudge assigns them without emptying a side. The cut must increase the component count.
- **Rationale**: The rule is deterministic and testable. Generated solutions never depend on it.
- **Alternatives considered**: Rasterizing an arbitrary polyline through cells is ambiguous on shared edges.

## Decision: Local persistence only

- **Decision**: Zustand persist with AsyncStorage. Result keys include generator version, mode, and level number.
- **Rationale**: The spec forbids a server. Versioned keys keep old stars if the generator later changes.
- **Alternatives considered**: Embedding every puzzle in the save would grow without bound and fight determinism.
