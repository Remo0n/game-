import assert from "node:assert/strict";
import test from "node:test";
import { generateLevel } from "../generator/generateLevel";
import { solvePuzzle } from "./solver";

test("the solver fits the teaching pieces and rejects an impossible pair", () => {
  const level = generateLevel({ seed: 3, levelNumber: 1 });
  const pieces = level.solution.pieces.map((piece) => piece.shape);
  const solved = solvePuzzle(pieces, level.targetShape, { rotations: false, nodeCap: 5000 });
  assert.equal(solved.solved, true);
  const impossible = solvePuzzle(
    [[{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }]],
    level.targetShape,
    { rotations: true, nodeCap: 2000 },
  );
  assert.equal(impossible.solved, false);
});
