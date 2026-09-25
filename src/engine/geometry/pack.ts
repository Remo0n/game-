import type { Rotation, Shape } from "../types";
import { canPlaceShape, cellKey, density, fitsOnBoard, getBounds, hasHole, isConnected, mergeShapes, normalizeShape, rotateShape, translateShape } from "./shape";

export interface PackedPlacement {
  index: number;
  x: number;
  y: number;
  rotation: Rotation;
}

export interface PackedLayout {
  target: Shape;
  placements: PackedPlacement[];
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function identityLayout(leaves: Shape[]): PackedLayout {
  const all = leaves.flat();
  const origin = getBounds(all);
  const placements = leaves.map((cells, index) => {
    const bounds = getBounds(cells);
    return {
      index,
      x: bounds.minX - origin.minX,
      y: bounds.minY - origin.minY,
      rotation: 0 as Rotation,
    };
  });
  return { target: normalizeShape(all), placements };
}

function attachmentScore(union: Shape, shape: Shape, x: number, y: number): number | null {
  if (!canPlaceShape(shape, x, y, expandTarget(union, shape, x, y))) return null;
  const placed = translateShape(shape, x, y);
  for (const cell of placed) {
    if (union.some((other) => other.x === cell.x && other.y === cell.y)) return null;
  }
  const merged = mergeShapes(union, placed);
  const bounds = getBounds(merged);
  if (bounds.width > 8 || bounds.height > 8) return null;
  return bounds.width * bounds.height * 10 + Math.abs(bounds.width - bounds.height);
}

function expandTarget(union: Shape, shape: Shape, x: number, y: number): Shape {
  return mergeShapes(union, translateShape(shape, x, y));
}

export function packLeaves(shapes: Shape[], rotations: Rotation[], limit = 8): PackedLayout | null {
  if (shapes.length === 0) return null;
  let union: Shape = [];
  const placements: PackedPlacement[] = [];
  for (let index = 0; index < shapes.length; index += 1) {
    const shape = rotateShape(shapes[index], rotations[index] ?? 0);
    if (!fitsOnBoard(shape, limit)) return null;
    if (index === 0) {
      union = shape;
      placements.push({ index, x: 0, y: 0, rotation: rotations[index] ?? 0 });
      continue;
    }
    const unionKeys = new Set(union.map(cellKey));
    let best: { x: number; y: number; score: number } | null = null;
    const seen = new Set<string>();
    for (const anchor of union) {
      for (const cell of shape) {
        for (const [dx, dy] of DIRS) {
          const x = anchor.x + dx - cell.x;
          const y = anchor.y + dy - cell.y;
          const id = `${x},${y}`;
          if (seen.has(id)) continue;
          seen.add(id);
          const placed = translateShape(shape, x, y);
          if (placed.some((item) => unionKeys.has(cellKey(item)))) continue;
          const score = attachmentScore(union, shape, x, y);
          if (score === null) continue;
          if (!best || score < best.score) best = { x, y, score };
        }
      }
    }
    if (!best) return null;
    union = mergeShapes(union, translateShape(shape, best.x, best.y));
    placements.push({ index, x: best.x, y: best.y, rotation: rotations[index] ?? 0 });
  }
  const bounds = getBounds(union);
  if (bounds.width > limit || bounds.height > limit) return null;
  const target = translateShape(union, -bounds.minX, -bounds.minY);
  if (!isConnected(target) || hasHole(target) || density(target) < 0.55) return null;
  return {
    target: normalizeShape(target),
    placements: placements.map((placement) => ({
      ...placement,
      x: placement.x - bounds.minX,
      y: placement.y - bounds.minY,
    })),
  };
}
