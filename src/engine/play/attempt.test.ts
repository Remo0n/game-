import assert from "node:assert/strict";
import test from "node:test";
import { generateLevel } from "../generator/generateLevel";
import { commitCut, createAttempt, isSolved, placePiece, resetAttempt, undo } from "./attempt";

test("the teaching puzzle is solved by one cut and two placements", () => {
  const level = generateLevel({ seed: 7, levelNumber: 1 });
  const { solution: _solution, ...playable } = level;
  let state = createAttempt(playable);
  state = commitCut(state, "p0", "vertical", 3);
  assert.equal(state.cutsUsed, 1);
  assert.equal(state.pieces.length, 2);
  const first = placePiece(state, state.pieces[0].id, 0, 0);
  const second = placePiece(first.state, state.pieces[1].id, 0, 1);
  assert.equal(second.placed, true);
  assert.equal(isSolved(second.state), true);
});

test("undo and reset restore the uncut block", () => {
  const level = generateLevel({ seed: 7, levelNumber: 1 });
  const { solution: _solution, ...playable } = level;
  const start = createAttempt(playable);
  const cut = commitCut(start, "p0", "vertical", 3);
  const undone = undo(cut);
  assert.equal(undone.pieces.length, 1);
  assert.equal(undone.cutsUsed, 0);
  const recut = commitCut(undone, "p0", "vertical", 3);
  const reset = resetAttempt(recut);
  assert.equal(reset.pieces.length, 1);
  assert.equal(reset.cutsUsed, 0);
});

test("an overlapping drop is rejected", () => {
  const level = generateLevel({ seed: 7, levelNumber: 1 });
  const { solution: _solution, ...playable } = level;
  let state = createAttempt(playable);
  state = commitCut(state, "p0", "vertical", 3);
  const first = placePiece(state, state.pieces[0].id, 0, 0);
  const overlap = placePiece(first.state, state.pieces[1].id, 0, 0);
  assert.equal(overlap.placed, false);
  assert.equal(isSolved(overlap.state), false);
});
