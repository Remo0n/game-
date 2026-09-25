import type { Shape } from "../types";
import { SeededRandom } from "../rng";
import { cellKey, fitsOnBoard, getBounds, hasHole, isConnected, normalizeShape } from "../geometry/shape";

export function rectangle(width: number, height: number): Shape {
  const cells: Shape = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) cells.push({ x, y });
  }
  return cells;
}

export function factorPairs(area: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let width = 1; width <= 8; width += 1) {
    if (area % width !== 0) continue;
    const height = area / width;
    if (height >= 1 && height <= 8) pairs.push([width, height]);
  }
  return pairs;
}

export function rectangularStock(area: number, rng: SeededRandom): Shape | null {
  const pairs = factorPairs(area);
  if (pairs.length === 0) return null;
  pairs.sort((a, b) => Math.abs(a[0] - a[1]) - Math.abs(b[0] - b[1]));
  const pool = pairs.slice(0, Math.max(1, Math.ceil(pairs.length / 2)));
  const [width, height] = rng.pick(pool);
  return rectangle(width, height);
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

function seedBlob(family: string, rng: SeededRandom): Shape {
  if (family === "ell") return [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
  if (family === "tee") return [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }];
  if (family === "plus") {
    return [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ];
  }
  if (family === "stairs") return [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }];
  if (family === "hook") return [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }];
  if (family === "snake") {
    const length = rng.int(4, 6);
    return Array.from({ length }, (_, index) => ({ x: index, y: index % 2 }));
  }
  return [{ x: 0, y: 0 }];
}

export function growPolyomino(area: number, rng: SeededRandom, family: string): Shape {
  let cells = normalizeShape(seedBlob(family, rng)).slice(0, area);
  const filled = new Set(cells.map(cellKey));
  let guard = 0;
  while (cells.length < area && guard < area * 12) {
    guard += 1;
    const options: Array<{ x: number; y: number }> = [];
    for (const cell of cells) {
      for (const [dx, dy] of DIRS) {
        const next = { x: cell.x + dx, y: cell.y + dy };
        if (filled.has(cellKey(next))) continue;
        const bounds = getBounds(cells.concat([next]));
        if (bounds.width > 8 || bounds.height > 8) continue;
        options.push(next);
      }
    }
    if (options.length === 0) break;
    const unique = new Map<string, { x: number; y: number }>();
    for (const option of options) unique.set(cellKey(option), option);
    const list = [...unique.values()];
    list.sort((a, b) => {
      const boxA = getBounds(cells.concat([a]));
      const boxB = getBounds(cells.concat([b]));
      return boxA.width * boxA.height - boxB.width * boxB.height;
    });
    const pool = list.slice(0, Math.max(1, Math.ceil(list.length * 0.45)));
    const choice = rng.pick(pool);
    const nextShape = cells.concat([choice]);
    if (hasHole(nextShape)) continue;
    cells = nextShape;
    filled.add(cellKey(choice));
  }
  return normalizeShape(cells);
}

export function buildStock(area: number, irregular: boolean, rng: SeededRandom): { shape: Shape; family: string } {
  if (!irregular) {
    const rect = rectangularStock(area, rng) ?? growPolyomino(area, rng, "grown");
    return { shape: normalizeShape(rect), family: "rectangle" };
  }
  const families = ["ell", "tee", "plus", "stairs", "hook", "snake", "grown"];
  const family = rng.pick(families);
  let shape = growPolyomino(area, rng, family);
  if (!isConnected(shape) || hasHole(shape) || !fitsOnBoard(shape) || shape.length < area) {
    const rect = rectangularStock(area, rng);
    if (rect) return { shape: rect, family: "rectangle" };
    shape = growPolyomino(area, rng, "grown");
  }
  return { shape: normalizeShape(shape), family };
}
