import assert from "node:assert/strict";
import test from "node:test";
import { initialProgress } from "./progress";
import { parseGameRoute } from "./routes";
import { journeyPage } from "./journey";
import { worldForLevel, WORLDS } from "../theme/theme";
const state = initialProgress(1);
test("bad deep links are rejected before they reach the generator", () => {
  for (const level of ["NaN", "-1", "0", "1.5", "Infinity", "1000001", "1e2"])
    assert.equal(parseGameRoute({ level }, state), null);
  for (const params of [
    { source: "unknown" },
    { variation: "BAD" },
    { level: ["1", "2"] },
    { source: "daily", date: "2026-02-31" },
    { source: "daily", date: "2026-09-26" },
  ])
    assert.equal(parseGameRoute(params, state, "2026-09-25"), null);
});
test("route defaults use saved progress and a daily always uses the date seed", () => {
  assert.equal(
    parseGameRoute({}, { ...state, levelNumber: 8 })?.levelNumber,
    8,
  );
  assert.deepEqual(parseGameRoute({ source: "daily" }, state, "2026-09-25"), {
    source: "daily",
    variation: "NORMAL",
    levelNumber: 7,
    date: "2026-09-25",
  });
});

test("world navigation keeps older chapters reachable after level 90", () => {
  assert.equal(journeyPage(1, 151).start, 91);
  assert.equal(journeyPage(1, 151, 0).start, 1);
  assert.equal(journeyPage(31, 151).start, 121);
  assert.equal(journeyPage(61, 151).start, 151);
  assert.equal(journeyPage(61, 151, 0).start, 61);
  assert.equal(journeyPage(1, 151, 99).start, 91);
  assert.equal(journeyPage(31, 1).start, 31);
});

test("every reached level belongs to a reachable page of its correct world", () => {
  const reached = new Set<number>();
  for (const world of WORLDS) {
    const { lastPage } = journeyPage(world.start, 1000);
    for (let page = 0; page <= lastPage; page++) {
      const { start, end } = journeyPage(world.start, 1000, page);
      for (let n = start; n <= end && n <= 1000; n++) {
        assert.equal(worldForLevel(n).id, world.id);
        assert.equal(reached.has(n), false);
        reached.add(n);
      }
    }
  }
  assert.equal(reached.size, 1000);
});
