# Tasks: Bento Blocks

**Input**: Design documents from `/specs/001-bento-blocks/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The specification requires geometry tests and a 10,000-puzzle scale report.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the Expo app and the engine folder boundary

- [ ] T001 Create the Expo TypeScript app with Expo Router in `package.json`, `app.json`, `babel.config.js`, `tsconfig.json`, and `app/_layout.tsx`
- [ ] T002 Add engine, game, component, and theme folders under `src/` and `app/`
- [ ] T003 [P] Configure Jest for Node engine tests in `jest.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Geometry, types, and seeded randomness that every story uses

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Define shared puzzle types in `src/engine/types.ts`
- [ ] T005 [P] Implement mulberry32 and seed mixing in `src/engine/rng.ts`
- [ ] T006 Implement shape utilities in `src/engine/geometry/shape.ts` (normalize, rotate, mirror, translate, equals, contains, bounds, area, place, merge, subtract, components, holes)
- [ ] T007 Implement horizontal, vertical, and laser cut validation in `src/engine/geometry/cuts.ts`
- [ ] T008 [P] Add geometry and cut unit tests in `src/engine/geometry/shape.test.ts` and `src/engine/geometry/cuts.test.ts`

**Checkpoint**: Shapes can be rotated, compared, and split without the UI

---

## Phase 3: User Story 1 - Cut and fit a puzzle (Priority: P1) 🎯 MVP

**Goal**: A player can cut the teaching block, drag pieces, snap them into the target, undo, reset, and finish

**Independent Test**: Complete the level-1 teaching puzzle on the play screen

- [ ] T009 [US1] Implement pure attempt rules (cut, place, rotate, undo, reset, complete) in `src/engine/play/attempt.ts`
- [ ] T010 [US1] Build the gesture board in `src/components/PuzzleBoard.tsx` using Gesture Handler and Reanimated
- [ ] T011 [US1] Wire the play screen in `app/play.tsx` and the session store in `src/game/sessionStore.ts`
- [ ] T012 [US1] Show completion and the next action in `app/result.tsx`

---

## Phase 4: User Story 2 - Play endless solvable puzzles (Priority: P1)

**Goal**: Seeded, solution-first generation with four difficulty tiers

**Independent Test**: The same seed rebuilds the same puzzle, and replay validation passes

- [ ] T013 [US2] Implement difficulty curve, metrics, and classification in `src/engine/generator/difficulty.ts`
- [ ] T014 [US2] Implement primitives, mutations, and signatures in `src/engine/generator/primitives.ts` and `src/engine/generator/signature.ts`
- [ ] T015 [US2] Implement `generateLevel` in `src/engine/generator/generateLevel.ts` per `specs/001-bento-blocks/contracts/generate-level.md`
- [ ] T016 [US2] Add determinism and validation tests in `src/engine/generator/generateLevel.test.ts`

---

## Phase 5: User Story 3 - Earn stars and continue forever (Priority: P2)

**Goal**: Score, stars, hints, and saved progression

**Independent Test**: An optimal clear earns three stars and the level number survives a reload

- [ ] T017 [US3] Implement scoring and stars in `src/engine/scoring/score.ts`
- [ ] T018 [US3] Persist campaign progress in `src/game/progressStore.ts`
- [ ] T019 [US3] Store solutions in `src/game/vault.ts` and apply hints without showing the solution on the board
- [ ] T020 [P] [US3] Add score tests in `src/engine/scoring/score.test.ts`

---

## Phase 6: User Story 4 - Choose a variation (Priority: P2)

**Goal**: Normal, One Cut, No Rotation, Exact Fit, Timed, and Multi Block

**Independent Test**: Each variation's generated puzzle satisfies its constraint

- [ ] T021 [US4] Enforce variation constraints inside `src/engine/generator/generateLevel.ts`
- [ ] T022 [US4] Add the variation picker in `app/variations.tsx` and a countdown on timed attempts in `app/play.tsx`
- [ ] T023 [P] [US4] Add variation constraint tests in `src/engine/generator/generateLevel.test.ts`

---

## Phase 7: User Story 5 - Use light power-ups (Priority: P3)

**Goal**: Laser Cut, Line Split, Rotate Piece, and Extra Cut as optional charges

**Independent Test**: Each tool changes the attempt as specified and can be ignored

- [ ] T024 [US5] Apply power-up rules in `src/engine/play/attempt.ts` and line-split selection in `src/engine/play/hint.ts`
- [ ] T025 [US5] Add the tool tray UI in `app/tools.tsx` and the in-play tool actions on `app/play.tsx`
- [ ] T026 [US5] Grant wallet charges on three-star clears in `src/game/progressStore.ts`

---

## Phase 8: User Story 6 - Daily challenge, worlds, and cosmetics (Priority: P3)

**Goal**: Shared daily puzzle, three worlds, skins, mascot, haptics, sound hooks, and sharing

**Independent Test**: The same date rebuilds the daily puzzle, and a locked world stays locked under the star threshold

- [ ] T027 [US6] Implement the daily seed in `src/engine/generator/daily.ts`
- [ ] T028 [US6] Build home, worlds, daily, skins, and settings screens in `app/index.tsx`, `app/worlds.tsx`, `app/daily.tsx`, `app/skins.tsx`, and `app/settings.tsx`
- [ ] T029 [P] [US6] Add the Tabi mascot, themes, haptics, and sound hooks in `src/components/Tabi.tsx`, `src/theme/theme.ts`, `src/game/haptics.ts`, and `src/game/sound.ts`
- [ ] T030 [US6] Share a local result card from `app/result.tsx`

---

## Phase 9: User Story 7 - Inspect generation (Priority: P3)

**Goal**: Developer inspector and bounded solver

**Independent Test**: The same seed in the inspector shows the same target and solution

- [ ] T031 [US7] Implement the bounded solver in `src/engine/solver/solver.ts`
- [ ] T032 [US7] Add solver tests in `src/engine/solver/solver.test.ts`
- [ ] T033 [US7] Build the inspector screen in `app/debug.tsx`
- [ ] T034 [US7] Add the 10,000-puzzle report script in `scripts/scale-report.ts`

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Export surface and a playable pass

- [ ] T035 Export the public engine API from `src/engine/index.ts`
- [ ] T036 Run `npm test` and fix engine failures

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup → Foundational → US1 and US2 → US3 → US4, US5, US6, US7
- US1 (play) and US2 (generator) are both P1. US1 can use the pinned tutorial before the full generator is finished. US3 depends on both.

### User Story Dependencies

- **US1**: Foundational geometry and cuts
- **US2**: Foundational geometry and cuts. Independent of the play screen
- **US3**: US1 attempt plus US2 optimal-cut counts
- **US4**: US2 generator
- **US5**: US1 attempt
- **US6**: US2 daily seed and US3 progress
- **US7**: US2 generator

### Parallel Opportunities

- T005 and T008 can proceed beside neighboring files once types exist
- T020, T023, T029, and T032 touch separate test or view files

### Implementation Strategy

Ship the teaching puzzle first (US1), then replace the next level with the generator (US2), then save stars (US3). Variations, tools, meta screens, and the inspector follow. The scale script is the last proof that generation stays solvable and deterministic.

## Notes

- Suggested MVP slice: Phase 1 through Phase 4 (US1 and US2)
- Every accepted puzzle must replay its hidden solution before the player sees it
- Do not pass `solution` into `src/components` or `app/play.tsx`
