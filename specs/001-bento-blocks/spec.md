# Feature Specification: Bento Blocks

**Feature Branch**: `001-bento-blocks`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Mobile puzzle where the player cuts solid shapes along straight lines and fits the pieces into a target. Levels are infinite, procedural, seeded, and guaranteed solvable across Easy, Medium, Hard, and Very Hard, with daily play, variations, power-ups, worlds, and cosmetics."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cut and fit a puzzle (Priority: P1)

A player opens a puzzle, sees the target shape and one solid starting block, draws a straight cut, and drags the resulting pieces into the target until it is perfectly filled.

**Why this priority**: Without cutting and fitting, there is no game.

**Independent Test**: Start the teaching puzzle, make the intended cut, drag both pieces into the target, and confirm the puzzle completes.

**Acceptance Scenarios**:

1. **Given** a fresh puzzle, **When** the player looks at the board, **Then** the target and the starting block are both visible and distinct.
2. **Given** a solid block, **When** the player drags a legal horizontal or vertical cut across it and releases, **Then** the block splits into two or more separate pieces that can be moved independently.
3. **Given** a drag that does not divide the block, **When** the player releases, **Then** the block stays whole and the cut is shown as invalid before release.
4. **Given** a loose piece near a legal empty region of the target, **When** the player releases it, **Then** it snaps into that region and occupies those cells.
5. **Given** a piece that would overlap another piece or sit outside the target, **When** the player releases it, **Then** it returns to the tray and the target is unchanged.
6. **Given** a puzzle that allows turning, **When** the player rotates a selected piece, **Then** it turns in quarter-turns and can be fitted in the new orientation.
7. **Given** every target cell is filled exactly once, **When** the last piece snaps in, **Then** the player sees a completion moment and can continue to another puzzle.

---

### User Story 2 - Play endless solvable puzzles (Priority: P1)

A player keeps playing level after level. Each puzzle is new, solvable, and appropriate to a rising difficulty, and the same inputs always rebuild the same puzzle.

**Why this priority**: Endless, fair puzzles are the product. A short hand-written list does not meet the goal.

**Independent Test**: Generate many puzzles from known seeds, confirm each has a replayable solution, and confirm a repeated seed matches the first result.

**Acceptance Scenarios**:

1. **Given** a seed, difficulty intent, and level number, **When** a puzzle is created twice, **Then** both results match.
2. **Given** any puzzle offered to the player, **When** its hidden solution is replayed, **Then** the cuts are legal and the placements fill the target exactly.
3. **Given** level 1, **When** the player starts the campaign, **Then** the puzzle is a short, obvious teaching shape.
4. **Given** later levels, **When** puzzles are created, **Then** Easy, Medium, Hard, and Very Hard differ by how much planning, turning, and misleading fits they demand, not only by size.
5. **Given** a long session, **When** puzzles are created one after another, **Then** back-to-back puzzles are not near-copies of each other.
6. **Given** a future change to how puzzles are built, **When** an older puzzle is requested with its original generator version, **Then** that version identity is stored with the puzzle so old and new puzzles are not silently mixed.

---

### User Story 3 - Earn stars and continue forever (Priority: P2)

A player finishes a puzzle, receives a score and one to three stars, and comes back later at the same level with the best result remembered.

**Why this priority**: Progression makes the endless ladder feel like a game rather than a generator demo.

**Independent Test**: Finish one puzzle with an optimal clear and one with extra cuts, confirm the star difference, leave, and return to the saved level and best stars.

**Acceptance Scenarios**:

1. **Given** a finished puzzle, **When** scoring runs, **Then** the result considers cuts against the optimal number, hints, extra moves, difficulty, and a modest speed term that cannot dominate the score.
2. **Given** an optimal clear with no hints and no power-ups, **When** stars are awarded, **Then** the player receives three stars.
3. **Given** a clear with extra cuts or a hint, **When** stars are awarded, **Then** the player receives fewer than three stars, and any completed puzzle still receives at least one star.
4. **Given** a saved campaign, **When** the player returns, **Then** the current level number, stars, and best score are restored, and the puzzle can be rebuilt from the saved seed and level number.
5. **Given** the player uses undo, reset, or a hint, **When** they continue, **Then** undo restores the previous pieces, reset restores the start of the attempt, and a hint reveals only one next cut or one ghost placement.

---

### User Story 4 - Choose a variation (Priority: P2)

A player can play alternate rules: one cut only, no rotation, exact fit, timed, or starting with several blocks. Each variation continues indefinitely.

**Why this priority**: The variations are part of the requested game and must still come from the same puzzle source.

**Independent Test**: Start each variation and confirm its rule is enforced on a solvable puzzle, with a separate level counter from the main campaign.

**Acceptance Scenarios**:

1. **Given** One Cut, **When** a puzzle is created, **Then** it is solvable in one cut and the player cannot make a second cut.
2. **Given** No Rotation, **When** the player tries to turn a piece without spending a special rotate charge, **Then** the piece does not turn, and a solution still exists without turning.
3. **Given** Exact Fit, **When** the puzzle appears, **Then** the target is a solid rectangle with no empty cells inside its outline, and the allowed cuts equal the optimal cuts.
4. **Given** Timed, **When** the countdown ends before the target is full, **Then** the attempt restarts and the puzzle itself is unchanged.
5. **Given** Multi Block, **When** the puzzle starts, **Then** more than one piece is already on the tray and the remaining cuts still lead to a solution.

---

### User Story 5 - Use light power-ups (Priority: P3)

A player can spend a small kit of tools to cut at any angle, auto-split along a line, turn a piece when turning is otherwise locked, or gain one extra cut. The puzzle remains solvable if the tools are ignored.

**Why this priority**: The tools add comfort and expression without becoming a required system.

**Independent Test**: Solve a puzzle without tools, then use each tool once and confirm the board changes only in the way that tool describes.

**Acceptance Scenarios**:

1. **Given** a Laser Cut charge, **When** the player draws a straight cut at an angle through a piece, **Then** the piece splits according to which side of the line each cell falls on, or the cut is rejected if it does not divide the piece.
2. **Given** a Line Split charge and a selected piece, **When** the player uses it, **Then** one legal straight cut is applied and the charge is consumed.
3. **Given** a locked rotation and a Rotate charge, **When** the player uses it, **Then** the selected piece turns one quarter-turn and the charge is consumed.
4. **Given** an Extra Cut charge, **When** the player uses it, **Then** the puzzle allows one more cut than it did before.
5. **Given** a three-star clear, **When** the reward is granted, **Then** the player's stored tools increase by one, and no tool type can be stored above three.

---

### User Story 6 - Daily challenge, worlds, and cosmetics (Priority: P3)

A player takes today's shared puzzle, follows a cat mascot through themed worlds, and equips block, tray, and background looks. Some looks start locked.

**Why this priority**: These layers give the puzzle a reason to return tomorrow without changing the core loop.

**Independent Test**: Open today's puzzle twice and confirm it matches, then unlock a later world only after the star threshold and equip a skin that recolors pieces.

**Acceptance Scenarios**:

1. **Given** the same calendar day and the same generator version, **When** two players open the daily puzzle, **Then** they receive the same puzzle.
2. **Given** a daily clear on consecutive days, **When** the next day is cleared, **Then** the streak increases by one. Missing a day resets the streak.
3. **Given** three daily clears in the same week, **When** the third is completed, **Then** a special look is unlocked.
4. **Given** the campaign map, **When** the player views a world, **Then** they see that world's generated level nodes, not a hand-written puzzle list.
5. **Given** fewer stars than the next world's threshold, **When** the player tries to enter it, **Then** it stays locked. The first world is available immediately.
6. **Given** a selected block, tray, or background look, **When** the player returns to a puzzle, **Then** the board uses that look.
7. **Given** a finished puzzle, **When** the player shares, **Then** the device offers a result card with stars, cuts, and time, without sending the puzzle to a game server.

---

### User Story 7 - Inspect generation (Priority: P3)

A developer can type a seed, difficulty, level number, and variation, rebuild the puzzle, and see the target, starting pieces, hidden solution, difficulty score, solver result, generation time, and how many candidates were rejected.

**Why this priority**: Tuning an endless generator requires a way to see why a puzzle was accepted.

**Independent Test**: Enter one seed twice and confirm the preview matches, including the solution overlay.

**Acceptance Scenarios**:

1. **Given** the developer inspector, **When** a seed is entered and generated, **Then** the target, starting pieces, score, time, and rejection count are shown.
2. **Given** the same inputs, **When** generation is repeated, **Then** the preview is identical.
3. **Given** a solution overlay, **When** it is enabled, **Then** the intended placements are visible only on this inspector, not on the normal play screen.

---

### Edge Cases

- A cut that misses the piece, clips only an edge without dividing it, or would create an empty piece is rejected.
- Undo at the start of an attempt does nothing harmful. Reset during a timed puzzle restarts the countdown as well as the pieces.
- If the player fills the target on the last second of a timed puzzle, the clear counts.
- Very hard puzzles stay on the same 8 by 8 touch grid. They do not spill into a larger board.
- After the third themed world, play continues without a new hand-authored world list, and themes cycle.
- Changing device date backward does not grant extra daily rewards for a day already cleared.
- If generation must retry, the player still receives a solvable puzzle. The game does not show a broken board.
- A hint on an already optimal piece still counts as a hint used.
- Spending a power-up and then undoing that action refunds the charge for the attempt.
- Level numbers continue past 90, 1,000, and beyond. Nothing in the campaign ends at a final authored level.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST present a target shape and one or more starting pieces for every puzzle.
- **FR-002**: Players MUST cut a piece by dragging a straight line across it, with a preview that distinguishes legal and illegal cuts before release.
- **FR-003**: A legal cut MUST divide the selected piece into two or more non-empty connected pieces. Cuts that do not increase the number of pieces MUST be rejected.
- **FR-004**: Players MUST drag pieces, snap them into valid target cells, and be blocked from overlaps and cells outside the target.
- **FR-005**: Players MUST be able to undo, reset, and request a single-step hint.
- **FR-006**: Quarter-turn rotation MUST be available when the puzzle allows it, and unavailable when the puzzle forbids it, unless a rotate charge is spent.
- **FR-007**: Completing a puzzle MUST calculate a score and one to three stars, then offer the next puzzle.
- **FR-008**: Puzzles MUST be generated from a known solution rather than from an unrelated target and starting block.
- **FR-009**: The same generator version, seed, level number, and variation MUST always produce the same puzzle.
- **FR-010**: Every offered puzzle MUST be connected, area-balanced, and solvable by replaying its hidden solution. The hidden solution MUST NOT appear on the play screen.
- **FR-011**: Difficulty MUST be an internal score from 0 through 100, classified as Easy (0–24), Medium (25–49), Hard (50–74), and Very Hard (75–100).
- **FR-012**: Campaign difficulty MUST follow the teach, practice, challenge, and recovery curriculum in [DIFFICULTY_PROGRESSION.md](../../DIFFICULTY_PROGRESSION.md). Its baseline MUST rise gradually and eventually plateau, while individual recovery levels deliberately become easier. New rules MUST be introduced separately, and timed play MUST remain optional.
- **FR-013**: Recent puzzles MUST be compared by a signature, and a candidate that is too similar to one of the last 80 MUST be rejected when another candidate exists.
- **FR-014**: The game MUST support Normal, One Cut, No Rotation, Exact Fit, Timed, and Multi Block as endless variations with separate counters.
- **FR-015**: Laser Cut, Line Split, Rotate Piece, and Extra Cut MUST be optional charges. None of them is required to solve a puzzle.
- **FR-016**: The game MUST store only the campaign seed, level counters, results, streak, daily completion, tool wallet, and selected looks. It MUST NOT require a server.
- **FR-017**: The daily puzzle MUST be derived from the calendar date and the generator version so every player on that version gets the same puzzle that day.
- **FR-018**: Three worlds MUST unlock by stars. Each world shows a band of generated levels. Play MUST continue after the third world.
- **FR-019**: Players MUST be able to equip block skins, tray themes, and backgrounds, including looks that start locked behind stars, worlds, or the weekly daily reward.
- **FR-020**: A developer inspector MUST rebuild any puzzle from seed, difficulty, level number, and variation, and MUST show the solution, score, solver outcome, generation time, and rejection count.
- **FR-021**: A scale check MUST create at least 10,000 puzzles and report how many were valid, how many candidates were rejected, average creation time, average solver time, and the percentage in each difficulty tier.
- **FR-022**: Completion, cutting, snapping, and invalid actions MUST provide a physical response: motion, a haptic pulse when haptics are on, and a sound hook when sound is on.
- **FR-023**: The first campaign puzzle MUST teach one obvious cut on a simple rectangle.

### Key Entities

- **Puzzle**: A seeded level with a target shape, starting pieces, allowed cuts, rotation rule, difficulty score, difficulty tier, variation, generator version, and a hidden solution.
- **Piece**: A connected set of cells with an orientation, an identity, and either a tray position or a placement on the target.
- **Cut**: A straight division of one piece. Solution cuts are horizontal or vertical. A laser cut may be any angle.
- **Placement**: Where a piece sits on the target, including its quarter-turn.
- **Attempt**: The player's cuts, moves, rotations, hints, tool uses, and elapsed time for one try.
- **Progress**: The saved seed, level counters, best stars, best scores, daily streak, tool wallet, and equipped looks.
- **Variation**: A ruleset that constrains generation and play without replacing the generator.
- **Look**: A cosmetic for blocks, the tray, or the background. It does not change puzzle logic.
- **World**: A named theme band over a range of campaign levels, unlocked by stars.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new player can complete the teaching puzzle in under 3 minutes without written instructions beyond the board itself.
- **SC-002**: In a scale run of 10,000 generated puzzles, every accepted puzzle is geometrically valid and solvable, and repeating any seed reproduces the same puzzle.
- **SC-003**: At least 90% of accepted puzzles in that run fall in the difficulty tier requested for their level or chosen tier.
- **SC-004**: A typical puzzle is ready in under 100 milliseconds, and a very hard puzzle is ready in under 500 milliseconds, so advancing to the next puzzle does not freeze the screen.
- **SC-005**: Easy, Medium, Hard, and Very Hard each appear as a non-trivial share of a mixed 10,000-puzzle sample rather than one tier collapsing into another.
- **SC-006**: Across 80 consecutive campaign puzzles, no two neighboring puzzles share the same signature.
- **SC-007**: Players can keep playing past level 1,000 with no additional authored puzzles.
- **SC-008**: Optimal clears earn more stars than clears that use extra cuts or hints, and time alone cannot turn a wasteful clear into a perfect score.
- **SC-009**: The same calendar day produces one shared daily puzzle for everyone on the same generator version.
- **SC-010**: The normal play screen never reveals the intended cuts or placements. The developer inspector can reveal them on demand.

## Assumptions

- The game is a single-player phone experience. There are no accounts, leaderboards hosted online, or cloud saves in this version.
- "Everyone gets the same daily puzzle" means everyone using the same rules version and the same local calendar date.
- The weekly daily reward uses the device's local week.
- Timed puzzles use a generous countdown of about three minutes on easier puzzles, easing toward about 90 seconds on the hardest, and timing out restarts the attempt rather than deleting progress.
- Star thresholds loosen slightly on harder puzzles so a single extra cut on a very hard puzzle can still earn two stars.
- Tool kits are smaller on harder puzzles. Stored tools from three-star clears and the weekly reward are capped at three per tool.
- Worlds unlock at 0, 40, and 100 total stars for the first, second, and third themes. After level 90, themes cycle while the level number keeps climbing.
- Looks that start locked are tied to star totals, world unlocks, or the weekly daily reward. Default rice, wood tray, and kitchen background are free.
- The mascot is a guide on the home, world, and result screens and does not affect rules.
- Sharing uses the device share sheet and a locally rendered card.
- The developer inspector is available from settings in development builds only.
- Holes inside shapes and diagonal cuts are not part of generated solutions. Diagonal or free-angle cuts exist only through the laser tool.
