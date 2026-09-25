import assert from "node:assert/strict";
import test from "node:test";
import {
  campaignPlan,
  variationPlan,
  fitsPlan,
  progressionBaseline,
} from "./progression";
import {
  countLegalPlacements,
  generateLevel,
  validateLevel,
} from "./generateLevel";
import { loadCampaignLevel, loadVariationLevel } from "../../game/levels";
import { canCut } from "../geometry/cuts";
import { rectangle } from "./primitives";
import {
  normalizeShape,
  rotateShape,
  shapeEquals,
  translateShape,
  cellKey,
} from "../geometry/shape";
import type { LevelDefinition, Shape, Variation } from "../types";

function replayPlayerCuts(level: LevelDefinition) {
  const pieces = new Map(level.startingPieces.map((p) => [p.id, p.shape]));
  for (const cut of level.solution.cuts) {
    const piece = pieces.get(cut.pieceId);
    assert.ok(piece, `missing ${cut.pieceId} in ${level.id}`);
    const next = canCut(piece, cut);
    assert.equal(next.valid, true, `bad local cut in ${level.id}`);
    assert.equal(next.resultingPieces?.length, 2);
    pieces.delete(cut.pieceId);
    pieces.set(`${cut.pieceId}L`, next.resultingPieces![0]);
    pieces.set(`${cut.pieceId}R`, next.resultingPieces![1]);
  }
  const remaining = [...pieces.values()];
  for (const solutionPiece of level.solution.pieces) {
    const index = remaining.findIndex((piece) =>
      shapeEquals(piece, solutionPiece.shape),
    );
    assert.ok(
      index >= 0,
      `cut sequence doesn't produce ${solutionPiece.id}: ${level.id}`,
    );
    remaining.splice(index, 1);
  }
  assert.equal(remaining.length, 0);
  assert.equal(level.solution.cuts.length, level.optimalCuts);
}

test("campaign introduces one rule at a time, and timers are always opt-in", () => {
  const concepts = [
    "slice",
    "sequence",
    "rotation",
    "one-cut",
    "multi-block",
    "exact-fit",
    "no-rotation",
  ];
  for (let i = 0; i < concepts.length; i++) {
    const plan = campaignPlan(i * 5 + 1);
    assert.equal(plan.concept, concepts[i]);
    assert.equal(plan.beat, "learn");
  }
  for (let n = 1; n <= 1000; n++) {
    const plan = campaignPlan(n);
    assert.notEqual(plan.variation, "TIMED");
    if (n < 11) assert.equal(plan.rotationsAllowed, false);
    if (n < 16) assert.equal(plan.variation, "NORMAL");
    if (n < 21) assert.notEqual(plan.variation, "MULTI_BLOCK");
    if (n < 26) assert.notEqual(plan.variation, "EXACT_FIT");
  }
});
test("chapter baseline increases gently and every challenge is followed by recovery", () => {
  let previous = progressionBaseline(1);
  for (let n = 2; n <= 2000; n++) {
    const base = progressionBaseline(n);
    assert.ok(base >= previous && base - previous <= 2);
    previous = base;
  }
  for (let n = 4; n < 500; n++) {
    if (campaignPlan(n).beat !== "challenge") continue;
    const next = campaignPlan(n + 1);
    assert.equal(next.beat, "breather");
    assert.ok(next.targetScore < campaignPlan(n).targetScore);
  }
  assert.ok(progressionBaseline(1000000) <= 80);
});
test("authored opening lessons teach each gesture and require rotation only after its introduction", () => {
  for (const n of [1, 2, 3, 4, 5, 6, 11, 16]) {
    const level = loadCampaignLevel(7, n);
    assert.ok(validateLevel(level).ok, JSON.stringify(validateLevel(level)));
    assert.ok(fitsPlan(level, campaignPlan(n)));
    assert.equal(
      level.solution.cuts[0].orientation,
      n === 2 ? "horizontal" : "vertical",
    );
    replayPlayerCuts(level);
  }
  const turn = loadCampaignLevel(7, 11);
  assert.equal(turn.rotationsAllowed, true);
  assert.ok(turn.solution.placements.every((p) => p.rotation === 90));
  assert.equal(
    countLegalPlacements(
      turn.solution.pieces[0].shape,
      turn.targetShape,
      false,
    ),
    0,
  );
  assert.ok(
    countLegalPlacements(
      turn.solution.pieces[0].shape,
      turn.targetShape,
      true,
    ) > 0,
  );
  assert.equal(loadCampaignLevel(7, 6).optimalCuts, 2);
});
test("difficulty counts actual legal placements, deduplicating symmetric rotations", () => {
  assert.equal(countLegalPlacements(rectangle(2, 2), rectangle(2, 2), true), 1);
  assert.equal(
    countLegalPlacements(rectangle(3, 1), rectangle(2, 3), false),
    0,
  );
  assert.equal(countLegalPlacements(rectangle(3, 1), rectangle(2, 3), true), 2);
  assert.equal(
    countLegalPlacements(
      rectangle(2, 1),
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      false,
    ),
    1,
  );
});
test("campaign candidates obey structural lesson limits and their cuts replay locally", () => {
  for (const seed of [1, 404, 839201]) {
    for (const n of [
      7, 8, 9, 12, 17, 21, 24, 26, 29, 31, 45, 68, 125, 242, 399, 510, 1000,
    ]) {
      const level = loadCampaignLevel(seed, n);
      assert.ok(validateLevel(level).ok, `${seed}:${n}`);
      assert.ok(fitsPlan(level, campaignPlan(n)), `${seed}:${n}`);
      assert.equal(level.timeLimitSec, null);
      replayPlayerCuts(level);
      assert.ok(
        level.difficultyScore <= level.targetScore + 6,
        `unexpected spike ${seed}:${n} (${level.difficultyScore}/${level.targetScore})`,
      );
    }
  }
});
test("mode tracks remain their chosen mode and keep the timer only in Lunch rush", () => {
  const modes: Variation[] = [
    "NORMAL",
    "ONE_CUT",
    "NO_ROTATION",
    "EXACT_FIT",
    "TIMED",
    "MULTI_BLOCK",
  ];
  for (const variation of modes)
    for (const n of [1, 4, 20, 80, 250]) {
      const level = loadVariationLevel(42, variation, n);
      assert.equal(level.variation, variation);
      assert.ok(
        fitsPlan(level, variationPlan(variation, n)),
        `${variation}:${n}`,
      );
      assert.equal(level.timeLimitSec !== null, variation === "TIMED");
      assert.ok(validateLevel(level).ok, `${variation}:${n}`);
      replayPlayerCuts(level);
    }
});
test("a curriculum puzzle has a revisioned identity without changing daily generation", () => {
  const dailyInput = {
    seed: 2435,
    levelNumber: 7,
    difficulty: "MEDIUM" as const,
    skipTutorial: true,
  };
  const daily = generateLevel(dailyInput);
  const campaign = loadCampaignLevel(2435, 7);
  assert.ok(campaign.id.includes("curriculum-2"));
  assert.equal(daily.progression, undefined);
  assert.deepEqual(generateLevel(dailyInput), daily);
  assert.equal(
    loadCampaignLevel(2435, 7, ["ignored-history"]).signature,
    campaign.signature,
  );
});

test("higher-cut lessons reject a one-cut shortcut and mixed-block levels require a cut", async () => {
  const { hasOneBinaryCutSolution, canPackPair } = await import(
    "./generateLevel"
  );
  assert.equal(
    hasOneBinaryCutSolution(rectangle(6, 3), rectangle(3, 6), false),
    true,
  );
  for (const n of [6, 8, 9, 24, 26, 29, 45, 68, 125]) {
    const level = loadCampaignLevel(31415, n);
    if (level.startingPieces.length === 2)
      assert.equal(
        canPackPair(
          level.startingPieces[0].shape,
          level.startingPieces[1].shape,
          level.targetShape,
          level.rotationsAllowed,
        ),
        false,
        `no-cut shortcut ${n}`,
      );
    else if (level.progression!.minCuts >= 2)
      assert.equal(
        hasOneBinaryCutSolution(
          level.startingPieces[0].shape,
          level.targetShape,
          level.rotationsAllowed,
        ),
        false,
        `one-cut shortcut ${n}`,
      );
  }
});
