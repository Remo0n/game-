<!--
Sync Impact Report
- Version change: template → 1.0.0
- Modified principles: placeholders replaced with Bento Blocks principles
  - [PRINCIPLE_1_NAME] → I. Procedural Engine First
  - [PRINCIPLE_2_NAME] → II. Deterministic Generation
  - [PRINCIPLE_3_NAME] → III. Guaranteed Solvability
  - [PRINCIPLE_4_NAME] → IV. Pure Geometry
  - [PRINCIPLE_5_NAME] → V. Difficulty Through Decisions
- Added sections: Performance and Product Boundaries, Quality Gates
- Removed sections: none (template placeholders only)
- Templates reviewed:
  - .specify/templates/plan-template.md ✅ no change (gates filled per feature plan)
  - .specify/templates/spec-template.md ✅ no change
  - .specify/templates/tasks-template.md ✅ no change (tests included when the spec requires them)
  - .specify/templates/constitution-template.md ✅ left as the blank template
- Follow-up TODOs: none
-->

# Bento Blocks Constitution

## Core Principles

### I. Procedural Engine First

The puzzle generator is the product. The game MUST NOT ship a finite,
hand-authored catalog of levels. Every playable puzzle MUST be produced by
the generator from a seed, a level number, a variation, and a generator
version. Screens, progression, daily play, and cosmetics MUST consume that
output. A fixed tutorial is allowed only when the same generator function
emits it from a pinned seed.

### II. Deterministic Generation

The same generator version, seed, level number, and variation MUST rebuild
the same puzzle. Procedural choices MUST flow through a seeded random source.
Level creation MUST NOT call an unseeded random source. Saved progress stores
the inputs needed to rebuild a level, not a copy of every future puzzle.

### III. Guaranteed Solvability

Every puzzle shown to a player MUST have a known solution that can be replayed
through legal cuts and legal placements. The generator MUST construct that
solution before the puzzle is accepted. Candidate puzzles that fail geometry,
area, connectivity, cut replay, or coverage checks MUST be rejected and
replaced. Solvability MUST NOT be relaxed to meet a time or difficulty target.

### IV. Pure Geometry

Shape math, cuts, packing, scoring, and generation MUST be independent of
rendering and of the user interface. Those modules MUST be testable without
starting the app. The play screen MUST NOT receive the hidden solution. Hints,
scoring, and the developer inspector may read it through a separate vault.

### V. Difficulty Through Decisions

Difficulty MUST come from shape irregularity, cut planning, orientation,
constrained placement, misleading fits, and the number of decisions. It MUST
NOT be implemented as "a larger easy puzzle" alone. An internal score from 0
to 100 MUST map onto Easy, Medium, Hard, and Very Hard. As the level number
grows, the score rises along a curve and then levels off inside the hardest
band instead of growing the board without limit.

## Performance and Product Boundaries

Typical generation MUST stay under 100 milliseconds, and difficult generation
MUST stay under 500 milliseconds, so the interface never freezes on a new
puzzle. The playfield MUST stay within an 8 by 8 grid so pieces remain
comfortable to touch. There is no account server and no hand-written level
database. Solution cuts are horizontal or vertical. A free-angle cut exists
only as an optional player tool and is never required to solve a puzzle.

## Quality Gates

Geometry, cutting, placement, validation, seeded regeneration, difficulty
classification, and each variation's constraints MUST have automated tests.
A scale run MUST generate at least 10,000 puzzles and report validity,
rejections, timing, and the share of each difficulty tier. A puzzle that fails
solvability or determinism fails the run.

## Governance

This constitution overrides conflicting local habits. Amendments require a
short rationale, a version bump, and an update to this file's sync note.
MAJOR bumps remove or redefine a principle. MINOR bumps add a principle or
materially expand a rule. PATCH bumps clarify wording only. Plans MUST include
a constitution check against these principles before implementation. Reviews
MUST reject a finite level list, an unseeded generator, or a puzzle path that
shows the solution during play.

**Version**: 1.0.0 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
