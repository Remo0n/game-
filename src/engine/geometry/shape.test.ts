import assert from "node:assert/strict";
import test from "node:test";
import {
  canPlaceShape,
  detectDisconnectedPieces,
  getArea,
  getBounds,
  getConnectedComponents,
  hasHole,
  mergeShapes,
  mirrorShape,
  normalizeShape,
  rotateShape,
  shapeEquals,
  subtractShape,
  translateShape,
} from "./shape";

test("normalizeShape shifts to the origin and sorts", () => {
  const shape = normalizeShape([
    { x: 3, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
  ]);
  assert.deepEqual(shape, [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ]);
});

test("rotation by 90 turns a bar vertical and four turns restore it", () => {
  const bar = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];
  const turned = rotateShape(bar, 90);
  assert.deepEqual(turned, [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
  ]);
  assert.equal(shapeEquals(rotateShape(bar, 0), bar), true);
  assert.equal(shapeEquals(rotateShape(rotateShape(rotateShape(rotateShape(bar, 90), 90), 90), 90), bar), true);
});

test("shapeEquals ignores translation", () => {
  const shape = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ];
  assert.equal(shapeEquals(shape, translateShape(shape, 4, -2)), true);
  assert.equal(shapeEquals(shape, [{ x: 0, y: 0 }]), false);
});

test("mirrorShape flips horizontally", () => {
  const ell = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ];
  const mirrored = mirrorShape(ell);
  assert.equal(shapeEquals(mirrored, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ]), true);
});

test("bounds, area, merge, and subtract", () => {
  const shape = [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 3 },
  ];
  assert.equal(getArea(shape), 3);
  assert.deepEqual(getBounds(shape), { minX: 1, minY: 1, maxX: 2, maxY: 3, width: 2, height: 3 });
  const merged = mergeShapes(shape, [{ x: 1, y: 1 }, { x: 0, y: 0 }]);
  assert.equal(merged.length, 4);
  assert.equal(subtractShape(shape, [{ x: 2, y: 1 }]).length, 2);
});

test("components, holes, and placement", () => {
  const split = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
  ];
  assert.equal(detectDisconnectedPieces(split), true);
  assert.equal(getConnectedComponents(split).length, 2);
  const ring = [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
    { x: 0, y: 1 }, { x: 2, y: 1 },
    { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
  ];
  assert.equal(hasHole(ring), true);
  const solid = [
    { x: 0, y: 0 }, { x: 1, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 },
  ];
  assert.equal(hasHole(solid), false);
  assert.equal(canPlaceShape([{ x: 0, y: 0 }, { x: 1, y: 0 }], 0, 1, solid), true);
  assert.equal(canPlaceShape([{ x: 0, y: 0 }], 0, 0, solid, new Set(["0,0"])), false);
  assert.equal(canPlaceShape([{ x: 0, y: 0 }], 2, 0, solid), false);
});
