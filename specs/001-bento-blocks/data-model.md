# Data Model: Bento Blocks

## Cell

- `x`, `y`: integer grid coordinates.
- Shapes are arrays of cells. Canonical shapes are translated so the minimum x and y are 0 and sorted by y, then x.

## Shape

- Occupied cells only. No holes in generated pieces or targets.
- Connectivity is 4-directional (edges, not corners).

## Rotation

- `0 | 90 | 180 | 270` clockwise.

## Cut

- `pieceId`
- `orientation`: `horizontal` or `vertical` for solution and normal play.
- `position`: integer line. Horizontal keeps `y < position` on one side and `y >= position` on the other. Vertical uses `x`.
- Laser cuts instead store two endpoints. They are attempt actions, not solution cuts.

## Piece

- `id`
- `shape` (normalized)
- `rotation`
- Tray pieces also track whether they are placed and their target offset.

## Placement

- `pieceId`
- `x`, `y` offset of the normalized, rotated shape on the target
- `rotation`

## Cut node (hidden solution tree)

- Either a leaf holding a piece id and its stock cells, or a cut plus two child nodes.
- Preorder replay applies parent cuts before child cuts.

## Level definition

- `id`: `version:seed:levelNumber:variation`
- `seed`, `levelNumber`, `generatorVersion` (`1.0.0`)
- `difficulty`: `EASY | MEDIUM | HARD | VERY_HARD`
- `difficultyScore`: 0–100 measured
- `targetScore`: score the campaign or request aimed at
- `variation`: `NORMAL | ONE_CUT | NO_ROTATION | EXACT_FIT | TIMED | MULTI_BLOCK`
- `targetShape`
- `startingPieces`
- `allowedCuts`, `optimalCuts`
- `rotationsAllowed`
- `timeLimitSec` or null
- `primitiveFamily`
- `signature`
- `rejectedCandidates`
- `solution` (placements plus ordered cuts). Removed before the value is passed to views.
- `kit`: charges for laser, line split, rotate, extra cut

## Playable level

Same as the level definition without `solution`.

## Attempt

- Pieces currently in play
- `cutsUsed`, `hintsUsed`, `powerUpsUsed`, `wastedMoves`
- `startedAt`
- Undo stack of piece snapshots and charge snapshots
- Hint ghost: either a cut preview or a placement preview

## Progress

- `campaignSeed`
- `levelNumber` (current campaign level)
- `variationLevel` per variation
- `results` keyed by `generatorVersion:mode:levelNumber` with `stars` and `bestScore`
- `totalStars`
- `streak`, `lastDailyDate`, `dailyCompletedDate`
- `weekKey`, `weeklyDailyCount`, `weeklyRewardClaimed`
- `wallet` capped at 3 per tool
- `unlockedSkins`, `unlockedTrays`, `unlockedBackgrounds`
- `selectedSkin`, `selectedTray`, `selectedBackground`
- `soundEnabled`, `hapticsEnabled`

## World

- `id`, `name`, `theme`
- `startLevel`, `endLevel` for the first cycle (1–30, 31–60, 61–90)
- `unlockStars`: 0, 40, 100
- After level 90, theme index is `((levelNumber - 1) / 30) % 3`

## Signature

- Primitive family, piece count, optimal cuts, variation, rotation flag, and a hash of the normalized target.
- A new puzzle is too similar when the signature equals one in the last 80, or when the target hash matches.

## Validation rules

- Target area equals the sum of solution piece areas.
- Target and every piece are connected and hole-free.
- Replaying solution cuts from the stock yields the solution pieces.
- Placements cover each target cell once.
- `allowedCuts >= optimalCuts`.
- One Cut: `optimalCuts = 1` and `allowedCuts = 1`.
- No Rotation: every solution rotation is 0 and `rotationsAllowed` is false.
- Exact Fit: target bounds are fully occupied and `allowedCuts = optimalCuts`.
- Multi Block: at least two starting pieces.
- Timed: `timeLimitSec` is set; other geometry rules still hold.
- Zero starting cuts only when the puzzle is not already solved.

## State transitions

1. Generated puzzle becomes an attempt with starting pieces in the tray.
2. A legal cut replaces one piece with two or more pieces and increments `cutsUsed`.
3. A legal release on the target marks the piece placed.
4. Undo pops the snapshot. Reset restores the opening snapshot and the opening charges.
5. When placed cells equal the target, the attempt becomes a result: score, stars, best-score update, next level number.
6. Timed expiry resets the attempt without writing a result.
