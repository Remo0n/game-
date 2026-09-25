import assert from "node:assert/strict";
import test from "node:test";
import { canCut, canLaserCut, listBinaryCuts } from "./cuts";

test("a vertical cut divides a bar into two pieces", () => {
  const bar = [0, 1, 2, 3, 4, 5].map((x) => ({ x, y: 0 }));
  const cut = canCut(bar, { orientation: "vertical", position: 3 });
  assert.equal(cut.valid, true);
  assert.equal(cut.resultingPieces?.length, 2);
  assert.equal(cut.resultingPieces?.[0].length, 3);
  assert.equal(cut.resultingPieces?.[1].length, 3);
});

test("edge cuts and single cells are rejected", () => {
  const bar = [0, 1, 2, 3].map((x) => ({ x, y: 0 }));
  assert.equal(canCut(bar, { orientation: "vertical", position: 0 }).valid, false);
  assert.equal(canCut(bar, { orientation: "vertical", position: 4 }).valid, false);
  assert.equal(canCut([{ x: 0, y: 0 }], { orientation: "vertical", position: 1 }).valid, false);
  assert.equal(canCut(bar, { orientation: "horizontal", position: 1 }).valid, false);
});

test("binary cuts exist on a rectangle and a laser can split a square", () => {
  const rect = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 3; x += 1) rect.push({ x, y });
  }
  const cuts = listBinaryCuts(rect);
  assert.ok(cuts.length >= 2);
  const laser = canLaserCut(rect, { x1: 0, y1: 0, x2: 3, y2: 2 });
  assert.equal(laser.valid, true);
  assert.ok((laser.resultingPieces?.length ?? 0) >= 2);
});
