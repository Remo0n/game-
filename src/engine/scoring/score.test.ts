import assert from "node:assert/strict";
import test from "node:test";
import { scoreAttempt } from "./score";

const base = {
  difficultyScore: 40,
  area: 12,
  optimalCuts: 2,
  allowedCuts: 3,
  wastedMoves: 0,
  elapsedMs: 20000,
};

test("an optimal clear earns three stars and outscores a wasteful clear", () => {
  const perfect = scoreAttempt({ ...base, cutsUsed: 2, hintsUsed: 0, powerUpsUsed: 0 });
  const wasteful = scoreAttempt({ ...base, cutsUsed: 6, hintsUsed: 2, powerUpsUsed: 1, elapsedMs: 5000 });
  assert.equal(perfect.stars, 3);
  assert.equal(wasteful.stars, 1);
  assert.ok(perfect.score > wasteful.score);
});

test("speed cannot turn extra cuts into a perfect score", () => {
  const slowPerfect = scoreAttempt({ ...base, cutsUsed: 2, hintsUsed: 0, powerUpsUsed: 0, elapsedMs: 180000 });
  const fastWaste = scoreAttempt({ ...base, cutsUsed: 5, hintsUsed: 1, powerUpsUsed: 0, elapsedMs: 3000 });
  assert.ok(slowPerfect.score > fastWaste.score);
});
