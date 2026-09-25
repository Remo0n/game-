import assert from "node:assert/strict";
import test from "node:test";
import { canLaserCut } from "../engine/geometry/cuts";
import { dailySeed } from "../engine/generator/daily";
import { generateLevel } from "../engine/generator/generateLevel";
import { sealLevel } from "./levels";
import { useSession } from "./sessionStore";

test("a session cuts, rejects a flat cut, snaps, rejects overlap, and wins", () => {
  const playable = sealLevel(generateLevel({ seed: 7, levelNumber: 1 }));
  useSession.getState().start(playable);
  const id = useSession.getState().selectedId;
  assert.ok(id);
  assert.equal(useSession.getState().cut(id, "horizontal", 1), false);
  assert.equal(useSession.getState().attempt?.pieces.length, 1);
  assert.equal(useSession.getState().cut(id, "vertical", 3.4), true);
  const pieces = useSession.getState().attempt?.pieces ?? [];
  assert.equal(pieces.length, 2);
  assert.equal(useSession.getState().drop(pieces[0].id, 0.2, 0.1), true);
  assert.equal(useSession.getState().drop(pieces[1].id, 0, -0.2), false);
  assert.equal(useSession.getState().result, null);
  assert.equal(useSession.getState().drop(pieces[1].id, 0.1, 1.05), true);
  assert.equal(useSession.getState().result?.stars, 3);
});

test("undo, rotate, line split, extra cut, and laser stay inside the rules", () => {
  const playable = sealLevel(generateLevel({ seed: 7, levelNumber: 1 }));
  useSession.getState().start(playable);
  const id = useSession.getState().selectedId ?? "";
  useSession.getState().rotate(id);
  assert.equal(useSession.getState().attempt?.kit.rotate, 0);
  assert.equal(useSession.getState().attempt?.powerUpsUsed, 1);
  useSession.getState().undoMove();
  assert.equal(useSession.getState().attempt?.pieces.length, 1);
  assert.equal(useSession.getState().attempt?.kit.rotate, 1);

  assert.equal(useSession.getState().lineSplit(id), true);
  assert.equal(useSession.getState().attempt?.pieces.length, 2);
  assert.ok(
    useSession
      .getState()
      .attempt?.pieces.some(
        (piece) => piece.id === useSession.getState().selectedId,
      ),
  );
  useSession.getState().reset();
  const before = useSession.getState().attempt?.allowedCuts ?? 0;
  useSession.getState().extraCut();
  assert.equal(useSession.getState().attempt?.allowedCuts, before + 1);

  let laserLevel = null;
  for (let seed = 1; seed < 40 && !laserLevel; seed += 1) {
    const level = generateLevel({
      seed,
      levelNumber: 6,
      skipTutorial: true,
      difficulty: "EASY",
    });
    const piece = level.startingPieces[0];
    const line = { x1: 0, y1: 0.2, x2: 4, y2: 3 };
    if (level.kit.laser > 0 && canLaserCut(piece.shape, line).valid)
      laserLevel = sealLevel(level);
  }
  assert.ok(laserLevel);
  useSession.getState().start(laserLevel);
  const laserPiece = useSession.getState().selectedId ?? "";
  assert.equal(
    useSession.getState().laser(laserPiece, { x1: 0, y1: 0.2, x2: 4, y2: 3 }),
    true,
  );
  assert.ok((useSession.getState().attempt?.pieces.length ?? 0) >= 2);
  assert.ok(
    useSession
      .getState()
      .attempt?.pieces.some(
        (piece) => piece.id === useSession.getState().selectedId,
      ),
  );
  assert.equal(
    useSession.getState().cutMode,
    useSession.getState().attempt!.cutsUsed <
      useSession.getState().attempt!.allowedCuts,
  );
});

test("daily and debug seeds rebuild the same board", () => {
  const input = {
    seed: dailySeed("2026-09-23"),
    levelNumber: 7,
    variation: "NORMAL" as const,
    skipTutorial: true,
    difficulty: "MEDIUM" as const,
  };
  const first = generateLevel(input);
  const second = generateLevel(input);
  assert.equal(first.id, second.id);
  assert.deepEqual(first.targetShape, second.targetShape);

  const debug = {
    seed: 839201,
    levelNumber: 42,
    variation: "NORMAL" as const,
    difficulty: "HARD" as const,
    skipTutorial: true,
  };
  const left = generateLevel(debug);
  const right = generateLevel(debug);
  assert.equal(left.signature, right.signature);
  assert.deepEqual(left.targetShape, right.targetShape);

  const oneCut = generateLevel({
    seed: 11,
    levelNumber: 4,
    variation: "ONE_CUT",
    skipTutorial: true,
    difficulty: "EASY",
  });
  assert.equal(oneCut.optimalCuts, 1);
  assert.equal(oneCut.allowedCuts, 1);
  assert.equal(oneCut.variation, "ONE_CUT");
});

test("undo and restart restore a selectable piece and the correct cutting mode", () => {
  const level = sealLevel(generateLevel({ seed: 7, levelNumber: 1 }));
  useSession.getState().start(level);
  const originalId = useSession.getState().selectedId!;
  assert.equal(useSession.getState().cut(originalId, "vertical", 3), true);
  useSession.getState().setCutMode(false);
  useSession.getState().undoMove();
  assert.equal(useSession.getState().selectedId, originalId);
  assert.equal(useSession.getState().cutMode, true);
  assert.equal(useSession.getState().cut(originalId, "vertical", 3), true);
  useSession.getState().reset();
  assert.equal(useSession.getState().selectedId, originalId);
  assert.equal(useSession.getState().attempt?.pieces.length, 1);
  assert.equal(useSession.getState().result, null);
});

test("failed wallet-funded actions roll back the borrowed tool", () => {
  const level = sealLevel(generateLevel({ seed: 7, levelNumber: 1 }));
  useSession.getState().start(level);
  const before = useSession.getState().attempt;
  const ok = useSession
    .getState()
    .withTool("laser", true, () =>
      useSession.getState().laser("missing", { x1: 0, y1: 0, x2: 2, y2: 2 }),
    );
  assert.equal(ok, false);
  assert.deepEqual(useSession.getState().attempt, before);
});

test("campaign replays stay identical after cache eviction and saved-history changes", async () => {
  const { loadCampaignLevel, loadVariationLevel } = await import("./levels");
  const first = loadCampaignLevel(891, 12, []);
  for (let i = 1; i <= 102; i++) loadVariationLevel(i, "NORMAL", 1);
  const replay = loadCampaignLevel(891, 12, [first.signature]);
  assert.equal(replay.signature, first.signature);
  assert.deepEqual(replay.startingPieces, first.startingPieces);
});

test("pausing excludes background time from the score and blocks board actions", () => {
  const originalNow = Date.now;
  let now = 10000;
  Date.now = () => now;
  try {
    const level = sealLevel(generateLevel({ seed: 7, levelNumber: 1 }));
    useSession.getState().start(level);
    now += 1500;
    useSession.getState().pause();
    const id = useSession.getState().selectedId!;
    assert.equal(useSession.getState().cut(id, "vertical", 3), false);
    now += 60000;
    useSession.getState().resume();
    assert.equal(now - useSession.getState().startedAt, 1500);
    assert.equal(useSession.getState().pausedAt, null);
    assert.equal(useSession.getState().cut(id, "vertical", 3), true);
  } finally {
    Date.now = originalNow;
  }
});

test("confirming a tool from its dialog resumes play without charging paused time", () => {
  const originalNow = Date.now;
  let now = 10000;
  Date.now = () => now;
  try {
    useSession
      .getState()
      .start(sealLevel(generateLevel({ seed: 7, levelNumber: 1 })));
    const before = useSession.getState().attempt!;
    now += 2000;
    useSession.getState().pause();
    now += 60000;
    const apply = () => useSession.getState().extraCut();
    assert.equal(
      useSession.getState().withTool("extraCut", false, apply),
      false,
    );
    assert.equal(useSession.getState().attempt, before);
    assert.equal(
      useSession.getState().withTool("extraCut", false, apply, true),
      true,
    );
    const after = useSession.getState();
    assert.equal(after.attempt!.allowedCuts, before.allowedCuts + 1);
    assert.equal(after.attempt!.kit.extraCut, before.kit.extraCut - 1);
    assert.equal(after.pausedAt, null);
    assert.equal(now - after.startedAt, 2000);
    assert.equal(after.withTool("extraCut", false, apply, true), false);
  } finally {
    Date.now = originalNow;
  }
});

test("a failed wallet tool confirmed from a dialog preserves the inventory", () => {
  useSession
    .getState()
    .start(sealLevel(generateLevel({ seed: 7, levelNumber: 1 })));
  useSession.getState().pause();
  const before = useSession.getState().attempt;
  assert.equal(
    useSession
      .getState()
      .withTool(
        "lineSplit",
        true,
        () => useSession.getState().lineSplit("missing"),
        true,
      ),
    false,
  );
  assert.deepEqual(useSession.getState().attempt, before);
  assert.equal(useSession.getState().pausedAt, null);
});
