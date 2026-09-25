import assert from "node:assert/strict";
import test from "node:test";
import {
  finishRun,
  initialProgress,
  restoreProgress,
  runKey,
  progressKey,
  type CompletedRun,
} from "./progress";
const run = (overrides: Partial<CompletedRun> = {}): CompletedRun => ({
  source: "campaign",
  variation: "NORMAL",
  levelNumber: 1,
  date: "2026-09-23",
  nextWorldStars: 0,
  result: {
    stars: 3,
    score: 150,
    elapsedMs: 4100,
    cutsUsed: 1,
    optimalCuts: 1,
    hintsUsed: 0,
  },
  ...overrides,
});
test("completion saves full results, stars, reward and unlock together; repeats don't duplicate rewards", () => {
  const input = run();
  const first = finishRun(initialProgress(42), input);
  assert.equal(first.levelNumber, 2);
  assert.equal(first.totalStars, 3);
  assert.equal(first.wallet.lineSplit, 1);
  assert.deepEqual(first.results[runKey(input)].lastRun, input.result);
  const replay = finishRun(first, input);
  assert.equal(replay.levelNumber, 2);
  assert.equal(replay.totalStars, 3);
  assert.equal(replay.wallet.lineSplit, 1);
});
test("daily results use distinct dates and cannot double-count an older replay", () => {
  let state = initialProgress(42);
  for (const date of ["2026-09-21", "2026-09-22", "2026-09-23"])
    state = finishRun(state, run({ source: "daily", levelNumber: 7, date }));
  assert.equal(Object.keys(state.results).length, 3);
  assert.equal(state.totalStars, 9);
  assert.equal(state.streak, 3);
  assert.equal(state.weeklyDailyCount, 3);
  assert.equal(state.weeklyRewardClaimed, true);
  state = finishRun(
    state,
    run({ source: "daily", levelNumber: 7, date: "2026-09-21" }),
  );
  assert.equal(state.streak, 3);
  assert.equal(state.weeklyDailyCount, 3);
  assert.equal(state.lastDailyDate, "2026-09-23");
  assert.equal(state.totalStars, 9);
});
test("a new week resets the daily counter; a missed day resets the streak", () => {
  let state = finishRun(
    initialProgress(42),
    run({ source: "daily", date: "2026-09-20" }),
  );
  state = finishRun(state, run({ source: "daily", date: "2026-09-22" }));
  assert.equal(state.streak, 1);
  assert.equal(state.weeklyDailyCount, 1);
});
test("restore migrates the old shared daily key and keeps settings and earned progress", () => {
  const saved = {
    ...initialProgress(8),
    levelNumber: 7,
    totalStars: 15,
    selectedSkin: "pizza",
    results: {
      [progressKey("daily", 7)]: { stars: 3, bestScore: 50 },
      [progressKey("campaign", 1)]: { stars: 2, bestScore: 12 },
    },
    dailyCompletedDate: "2026-09-23",
    lastDailyDate: "2026-09-23",
    wallet: { laser: 2, lineSplit: 1, rotate: 0, extraCut: 1 },
  };
  const restored = restoreProgress(saved, 999);
  assert.equal(restored.campaignSeed, 8);
  assert.equal(restored.levelNumber, 7);
  assert.equal(restored.selectedSkin, "pizza");
  assert.equal(restored.results[progressKey("daily", 7)], undefined);
  assert.equal(restored.results[progressKey("daily", "2026-09-23")].stars, 3);
  assert.equal(restored.totalStars, 5);
  assert.deepEqual(restored.wallet, saved.wallet);
});
test("malformed saved data cannot poison the generator or tool inventory", () => {
  const restored = restoreProgress(
    {
      levelNumber: -1,
      campaignSeed: "oops",
      variationLevel: null,
      wallet: { laser: -10 },
      results: { bad: null },
      soundEnabled: "false",
      dailyCompletedDate: "2026-02-31",
    },
    4,
  );
  assert.deepEqual(restored, initialProgress(4));
});
test("a lower replay keeps best stars and score but saves the latest run accurately", () => {
  const first = finishRun(initialProgress(1), run());
  const input = run({
    result: { ...run().result, stars: 1, score: 12, cutsUsed: 3 },
  });
  const replay = finishRun(first, input);
  const restored = restoreProgress(JSON.parse(JSON.stringify(replay)), 99);
  assert.equal(restored.results[runKey(input)].stars, 3);
  assert.equal(restored.results[runKey(input)].bestScore, 150);
  assert.equal(restored.results[runKey(input)].lastRun?.cutsUsed, 3);
  assert.equal(restored.results[runKey(input)].lastRun?.stars, 1);
});
