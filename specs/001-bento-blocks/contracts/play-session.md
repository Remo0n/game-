# Contract: play session

The session store is the only writer of attempt state. Views read pieces, the target, counts, and the hint ghost.

## Commands

- `startLevel(playableLevel)` — tray pieces from `startingPieces`, counters at zero.
- `previewCut(pieceId, cut)` — returns valid or invalid and the pieces that would result. Does not mutate.
- `applyCut(pieceId, cut)` — commits a legal cut or no-ops.
- `movePiece(pieceId, x, y)` — if the cells fit in the empty target, mark placed; otherwise leave the piece in the tray.
- `rotatePiece(pieceId)` — quarter-turn clockwise when allowed, or when a rotate charge is spent.
- `undo()` / `reset()`
- `useHint()` — one ghost cut or one ghost placement from the vault. Increments hints.
- `useLaser(pieceId, line)` / `useLineSplit(pieceId)` / `useExtraCut()`
- `tickTimeout()` — timed variations only; resets the attempt when time is up.

## Completion

When placed cells cover the target, the store exposes a result:

```text
{ score, stars, cutsUsed, optimalCuts, elapsedMs, hintsUsed, isNewBest }
```

The store does not navigate. The play screen opens the result.

## Solution boundary

`startLevel` accepts a playable level only. Hint and line-split ask the vault by level id. If the vault has no entry, hint and line-split no-op rather than guessing a solution on screen.
