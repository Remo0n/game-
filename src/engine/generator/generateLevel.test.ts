import assert from "node:assert/strict";
import test from "node:test";
import { campaignTargetScore, classifyScore } from "./difficulty";
import { generateLevel, validateLevel } from "./generateLevel";
import { rotateShape, shapeEquals } from "../geometry/shape";
import type { Rotation, Variation } from "../types";

test("campaign anchors land on the requested scores", () => {
  assert.equal(campaignTargetScore(1), 5);
  assert.equal(campaignTargetScore(10), 12);
  assert.equal(campaignTargetScore(30), 27);
  assert.equal(campaignTargetScore(75), 48);
  assert.equal(campaignTargetScore(150), 69);
  assert.equal(campaignTargetScore(300), 84);
});

test("level 1 is the teaching bar and ignores the seed", () => {
  const first = generateLevel({ seed: 1, levelNumber: 1 });
  const second = generateLevel({ seed: 99, levelNumber: 1 });
  assert.equal(first.targetShape.length, 6);
  assert.equal(first.optimalCuts, 1);
  assert.equal(first.startingPieces.length, 1);
  assert.deepEqual(first.targetShape, second.targetShape);
  assert.deepEqual(first.startingPieces, second.startingPieces);
  assert.equal(validateLevel(first).ok, true);
});

test("the same seed rebuilds the same puzzle", () => {
  const input = { seed: 839201, levelNumber: 42, difficulty: "HARD" as const, skipTutorial: true };
  const left = generateLevel(input);
  const right = generateLevel(input);
  assert.deepEqual(left, right);
  assert.equal(validateLevel(left).ok, true);
  assert.equal(left.difficulty, "HARD");
});

test("each variation keeps its rule", () => {
  const variations: Variation[] = ["ONE_CUT", "NO_ROTATION", "EXACT_FIT", "TIMED", "MULTI_BLOCK"];
  for (const variation of variations) {
    const level = generateLevel({
      seed: 1200 + variation.length,
      levelNumber: 18,
      variation,
      skipTutorial: true,
    });
    const validation = validateLevel(level);
    assert.equal(validation.ok, true, `${variation}: ${validation.reasons.join(", ")}`);
    assert.equal(level.variation, variation);
    assert.equal(classifyScore(level.difficultyScore), level.difficulty);
  }
});

test("early levels cannot be solved without a cut", () => {
  for (let levelNumber = 1; levelNumber <= 12; levelNumber += 1) {
    const level = generateLevel({ seed: 404, levelNumber, skipTutorial: levelNumber !== 1 });
    assert.equal(validateLevel(level).ok, true, validateLevel(level).reasons.join(", "));
    assert.ok(level.optimalCuts >= 1, `level ${levelNumber} has no required cut`);
    if (level.startingPieces.length === 1) {
      const start = level.startingPieces[0].shape;
      const turns: Rotation[] = level.rotationsAllowed ? [0, 90, 180, 270] : [0];
      for (const turn of turns) {
        assert.equal(shapeEquals(rotateShape(start, turn), level.targetShape), false, `level ${levelNumber} fits before cutting`);
      }
    }
  }
});

test("neighboring campaign puzzles do not share a signature", () => {
  const signatures: string[] = [];
  for (let levelNumber = 1; levelNumber <= 40; levelNumber += 1) {
    const level = generateLevel({
      seed: 404,
      levelNumber,
      skipTutorial: levelNumber !== 1,
      recentSignatures: signatures.slice(-80),
    });
    assert.equal(validateLevel(level).ok, true, validateLevel(level).reasons.join(", "));
    assert.equal(signatures.includes(level.signature), false);
    signatures.push(level.signature);
  }
});
