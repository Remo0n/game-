import assert from "node:assert/strict";
import test from "node:test";
import { cellCornerRadius, fitPlayCell, TARGET_TRAY_CHROME } from "./fitTarget";

const MASCOT = 84;
const GAP = 8;
const PADDING = 24;

function rowWidth(screenWidth: number, playHeight: number, columns: number, rows: number): number {
  const cell = fitPlayCell({ screenWidth, playHeight, columns, rows, mascot: true });
  const tray = Math.max(148, columns * cell + TARGET_TRAY_CHROME);
  return tray + MASCOT + GAP + PADDING;
}

test("a long or tall target stays beside Tabi", () => {
  for (const screenWidth of [320, 360, 390, 430]) {
    for (const [columns, rows] of [
      [8, 1],
      [1, 8],
      [8, 8],
      [6, 2],
    ] as const) {
      assert.ok(
        rowWidth(screenWidth, 420, columns, rows) <= screenWidth,
        `${columns}x${rows} overflows a ${screenWidth}px screen`,
      );
    }
  }
});

test("the target and the pieces share one cell size", () => {
  const cell = fitPlayCell({ screenWidth: 390, playHeight: 420, columns: 3, rows: 2, mascot: true });
  assert.equal(cell, 46);
  const wide = fitPlayCell({ screenWidth: 390, playHeight: 420, columns: 8, rows: 1, mascot: true });
  assert.ok(wide < 46);
  assert.equal(wide, fitPlayCell({ screenWidth: 390, playHeight: 420, columns: 8, rows: 1, mascot: true }));
});

test("cell corners stay square", () => {
  for (const cell of [12, 18, 24, 32, 46]) {
    const radius = cellCornerRadius(cell);
    assert.ok(radius * 2 < cell, `radius ${radius} turns a ${cell}px cell into a circle`);
  }
});
