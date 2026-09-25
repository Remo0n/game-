# Implementation Plan: Bento Blocks

**Branch**: `001-bento-blocks` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-bento-blocks/spec.md`

## Summary

Build a phone puzzle whose puzzles are created on device from a known solution. The player cuts a block along a straight grid line, drags the pieces into a target, and continues forever. Expo Router hosts the screens. A pure TypeScript engine owns geometry, cuts, generation, scoring, and a bounded solver. Zustand holds the attempt and the saved campaign. The play screen never receives the solution object.

## Technical Context

**Language/Version**: TypeScript 5, Expo SDK current stable (create-expo-app), React Native

**Primary Dependencies**: Expo Router, React Native Reanimated, React Native Gesture Handler, Zustand, AsyncStorage, expo-haptics, expo-audio, react-native-svg, react-native-view-shot, expo-sharing

**Storage**: On-device AsyncStorage for campaign seed, counters, results, streak, wallet, and cosmetics. No server.

**Testing**: Jest with a Node environment for `src/engine`. `npm test` covers geometry, cuts, scoring, solver, and a few hundred generated puzzles. `npm run test:scale` generates 10,000 puzzles and prints the report.

**Target Platform**: iOS and Android via Expo Go or a development build

**Project Type**: Mobile app with an embedded puzzle engine

**Performance Goals**: Typical generation under 100 ms. Difficult generation under 500 ms. Generation of the next puzzle happens after the current board is shown, off the interaction that paints the frame.

**Constraints**: 8×8 playfield. Seeded RNG only. Generator version `1.0.0` on every puzzle. Solution withheld from UI components. Horizontal and vertical solution cuts only.

**Scale/Scope**: Unlimited campaign levels, six variations, one daily puzzle per date, three themed worlds plus an endless cycle, a developer inspector.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Procedural engine first: puzzles come only from `generateLevel`. No level catalog. Pass.
- Deterministic generation: mulberry32 seeded from version, seed, level, and variation. Pass.
- Guaranteed solvability: cut tree is built first and replayed before accept. Pass.
- Pure geometry: `src/engine` imports no React Native. Solution lives in a vault, not in view props. Pass.
- Difficulty through decisions: 0–100 score from area, pieces, cuts, irregularity, rotation, branching, and placement options. Pass.
- Performance budget: no full solver on the hot path. Bounded solver is for tests and the inspector. Pass.
- Test gate: unit tests plus a 10,000-puzzle scale script. Pass.

Post-design re-check: data model, play contract, and quickstart keep the same boundaries. Pass.

## Project Structure

### Documentation (this feature)

```text
specs/001-bento-blocks/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── generate-level.md
│   └── play-session.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── _layout.tsx
├── index.tsx
├── worlds.tsx
├── play.tsx
├── result.tsx
├── daily.tsx
├── skins.tsx
├── tools.tsx
├── variations.tsx
├── settings.tsx
└── debug.tsx
src/
├── engine/
│   ├── types.ts
│   ├── rng.ts
│   ├── geometry/
│   ├── generator/
│   ├── solver/
│   └── scoring/
├── game/
│   ├── vault.ts
│   ├── progressStore.ts
│   ├── sessionStore.ts
│   ├── sound.ts
│   └── haptics.ts
├── components/
└── theme/
```

**Structure Decision**: One Expo app at the repository root. The engine is a folder of pure TypeScript, tested by Jest in Node, so generation tests do not boot the phone UI.

## Complexity Tracking

No constitution violations.
