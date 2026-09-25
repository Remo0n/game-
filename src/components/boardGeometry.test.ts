import assert from "node:assert/strict";
import test from "node:test";
import { layoutBoard, pieceAtPoint, resolveBoardCut } from "./boardGeometry";
import type { BoardPiece } from "../engine/play/attempt";
import { getBounds } from "../engine/geometry/shape";

const line: BoardPiece = {
  id: "line",
  shape: [0, 1, 2, 3, 4, 5].map((x) => ({ x, y: 0 })),
  placed: false,
  rotation: 0,
  x: 0,
  y: 0,
};
const layouts = { line: { x: 60, y: 130, width: 180, height: 30 } };
const swipe = (from: { x: number; y: number }, to: { x: number; y: number }) =>
  resolveBoardCut(from, to, [line], layouts, 30);

test("cuts can start and end in empty board space in either direction", () => {
  for (const [from, to] of [
    [
      { x: 150, y: 90 },
      { x: 150, y: 200 },
    ],
    [
      { x: 150, y: 200 },
      { x: 150, y: 90 },
    ],
  ]) {
    const cut = swipe(from, to);
    assert.equal(cut?.pieceId, "line");
    assert.equal(cut?.orientation, "vertical");
    assert.equal(cut?.position, 3);
  }
});
test("a cut can start inside a piece, or slightly off a seam", () => {
  assert.equal(swipe({ x: 150, y: 138 }, { x: 150, y: 190 })?.position, 3);
  assert.equal(swipe({ x: 155, y: 90 }, { x: 155, y: 200 })?.position, 3);
});
test("empty strokes, taps, outside edges, and strokes that stop short do not cut", () => {
  assert.equal(swipe({ x: 150, y: 140 }, { x: 150, y: 145 }), null);
  assert.equal(swipe({ x: 150, y: 80 }, { x: 150, y: 110 }), null);
  assert.equal(swipe({ x: 35, y: 90 }, { x: 35, y: 200 }), null);
  assert.equal(swipe({ x: 60, y: 90 }, { x: 60, y: 200 }), null);
  assert.equal(swipe({ x: 240, y: 90 }, { x: 240, y: 200 }), null);
  assert.equal(swipe({ x: 135, y: 90 }, { x: 135, y: 200 }), null);
});
test("crossing a bounding-box hole does not cut an L-shaped piece", () => {
  const l: BoardPiece = {
    ...line,
    shape: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ],
  };
  const position = { line: { x: 60, y: 130, width: 90, height: 90 } };
  assert.equal(
    resolveBoardCut({ x: 90, y: 175 }, { x: 90, y: 215 }, [l], position, 30),
    null,
  );
  assert.equal(
    resolveBoardCut({ x: 90, y: 110 }, { x: 90, y: 170 }, [l], position, 30)
      ?.position,
    1,
  );
});
test("a board-wide stroke cuts the first crossed loose piece only", () => {
  const second = { ...line, id: "second" };
  const positions = { ...layouts, second: { ...layouts.line, y: 220 } };
  const pieces = [second, line];
  assert.equal(
    resolveBoardCut(
      { x: 150, y: 90 },
      { x: 150, y: 270 },
      pieces,
      positions,
      30,
    )?.pieceId,
    "line",
  );
  assert.equal(
    resolveBoardCut(
      { x: 150, y: 270 },
      { x: 150, y: 90 },
      pieces,
      positions,
      30,
    )?.pieceId,
    "second",
  );
  assert.equal(
    resolveBoardCut(
      { x: 150, y: 90 },
      { x: 150, y: 270 },
      [{ ...line, placed: true }, second],
      positions,
      30,
    )?.pieceId,
    "second",
  );
});
test("horizontal swipes and nonzero shape origins resolve in board coordinates", () => {
  const piece = {
    ...line,
    shape: [
      { x: 5, y: 4 },
      { x: 5, y: 5 },
      { x: 5, y: 6 },
    ],
  };
  const cut = resolveBoardCut(
    { x: 25, y: 160 },
    { x: 120, y: 160 },
    [piece],
    { line: { x: 60, y: 130, width: 30, height: 90 } },
    30,
  );
  assert.equal(cut?.orientation, "horizontal");
  assert.equal(cut?.position, 5);
});
test("selecting empty space does not select a shape's bounding box", () => {
  const l = {
    ...line,
    shape: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
  };
  const positions = { line: { x: 60, y: 130, width: 60, height: 60 } };
  assert.equal(pieceAtPoint({ x: 105, y: 175 }, [l], positions, 30), undefined);
  assert.equal(pieceAtPoint({ x: 75, y: 175 }, [l], positions, 30)?.id, "line");
});
test("mobile layouts keep loose and packed pieces inside their surfaces", () => {
  const target = Array.from({ length: 6 }, (_, i) => ({
    x: i % 3,
    y: Math.floor(i / 3),
  }));
  for (const width of [238, 278, 308, 350, 778]) {
    for (const pieces of [
      [line],
      Array.from({ length: 6 }, (_, i) => ({
        ...line,
        id: String(i),
        shape: [{ x: 0, y: 0 }],
      })),
      [{ ...line, shape: target, placed: true }],
    ]) {
      const board = layoutBoard(target, pieces, width, 296);
      assert.ok(board.cell >= 12);
      for (const piece of pieces) {
        const p = board.layouts[piece.id];
        assert.ok(p.x >= 0 && p.x + p.width <= width);
        assert.ok(p.y >= (piece.placed ? 0 : board.cuttingTop));
        assert.ok(p.y + p.height <= board.height);
        assert.equal(p.width, getBounds(piece.shape).width * board.cell);
      }
    }
  }
});

test("tall puzzles on short phones grow the scrollable board instead of becoming tiny", () => {
  const target = Array.from({ length: 16 }, (_, i) => ({
    x: i % 2,
    y: Math.floor(i / 2),
  }));
  const stock = {
    ...line,
    shape: Array.from({ length: 16 }, (_, i) => ({
      x: i % 8,
      y: Math.floor(i / 8),
    })),
  };
  const board = layoutBoard(target, [stock], 238, 296);
  assert.equal(board.cell, 24);
  assert.ok(board.height > 296);
  assert.ok(board.layouts.line.x >= 0);
  assert.ok(board.layouts.line.x + board.layouts.line.width <= 238);
  assert.ok(board.layouts.line.y + board.layouts.line.height <= board.height);
  assert.equal(
    resolveBoardCut(
      {
        x: board.layouts.line.x + 4 * board.cell,
        y: board.layouts.line.y - 12,
      },
      {
        x: board.layouts.line.x + 4 * board.cell,
        y: board.layouts.line.y + board.layouts.line.height + 12,
      },
      [stock],
      board.layouts,
      board.cell,
    )?.position,
    4,
  );
});
