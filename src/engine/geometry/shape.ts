import type { Cell, Rotation, Shape } from "../types";

export function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

export function normalizeShape(shape: Shape): Shape {
  if (shape.length === 0) return [];
  let minX = shape[0].x;
  let minY = shape[0].y;
  for (const cell of shape) {
    if (cell.x < minX) minX = cell.x;
    if (cell.y < minY) minY = cell.y;
  }
  return shape
    .map((cell) => ({ x: cell.x - minX, y: cell.y - minY }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

export function rotateShape(shape: Shape, rotation: Rotation): Shape {
  const turns = ((rotation / 90) % 4 + 4) % 4;
  let current = shape;
  for (let turn = 0; turn < turns; turn += 1) {
    current = current.map((cell) => ({ x: cell.y, y: -cell.x }));
  }
  return normalizeShape(current);
}

export function mirrorShape(shape: Shape): Shape {
  return normalizeShape(shape.map((cell) => ({ x: -cell.x, y: cell.y })));
}

export function translateShape(shape: Shape, dx: number, dy: number): Shape {
  return shape.map((cell) => ({ x: cell.x + dx, y: cell.y + dy }));
}

export function shapeEquals(a: Shape, b: Shape): boolean {
  const left = normalizeShape(a);
  const right = normalizeShape(b);
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i].x !== right[i].x || left[i].y !== right[i].y) return false;
  }
  return true;
}

export function shapeContains(shape: Shape, cell: Cell): boolean {
  return shape.some((other) => other.x === cell.x && other.y === cell.y);
}

export function getBounds(shape: Shape): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (shape.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = shape[0].x;
  let minY = shape[0].y;
  let maxX = shape[0].x;
  let maxY = shape[0].y;
  for (const cell of shape) {
    if (cell.x < minX) minX = cell.x;
    if (cell.y < minY) minY = cell.y;
    if (cell.x > maxX) maxX = cell.x;
    if (cell.y > maxY) maxY = cell.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export function getArea(shape: Shape): number {
  return shape.length;
}

export function mergeShapes(a: Shape, b: Shape): Shape {
  const seen = new Set<string>();
  const merged: Shape = [];
  for (const cell of [...a, ...b]) {
    const key = cellKey(cell);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ x: cell.x, y: cell.y });
  }
  return merged.sort((left, right) => left.y - right.y || left.x - right.x);
}

export function subtractShape(source: Shape, removed: Shape): Shape {
  const gone = new Set(removed.map(cellKey));
  return source.filter((cell) => !gone.has(cellKey(cell)));
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function getConnectedComponents(shape: Shape): Shape[] {
  const remaining = new Set(shape.map(cellKey));
  const lookup = new Map(shape.map((cell) => [cellKey(cell), cell]));
  const components: Shape[] = [];
  for (const start of shape) {
    const startKey = cellKey(start);
    if (!remaining.has(startKey)) continue;
    remaining.delete(startKey);
    const component: Cell[] = [];
    const queue = [start];
    while (queue.length > 0) {
      const cell = queue.pop() as Cell;
      component.push(cell);
      for (const [dx, dy] of DIRS) {
        const next = { x: cell.x + dx, y: cell.y + dy };
        const key = cellKey(next);
        if (!remaining.has(key)) continue;
        remaining.delete(key);
        queue.push(lookup.get(key) as Cell);
      }
    }
    components.push(normalizeShape(component));
  }
  return components;
}

export function detectDisconnectedPieces(shape: Shape): boolean {
  if (shape.length === 0) return false;
  return getConnectedComponents(shape).length > 1;
}

export function isConnected(shape: Shape): boolean {
  return shape.length > 0 && !detectDisconnectedPieces(shape);
}

export function hasHole(shape: Shape): boolean {
  if (shape.length === 0) return false;
  const bounds = getBounds(shape);
  const filled = new Set(shape.map(cellKey));
  const seen = new Set<string>();
  const queue: Cell[] = [];
  for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
    queue.push({ x, y: bounds.minY }, { x, y: bounds.maxY });
  }
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    queue.push({ x: bounds.minX, y }, { x: bounds.maxX, y });
  }
  while (queue.length > 0) {
    const cell = queue.pop() as Cell;
    if (cell.x < bounds.minX || cell.y < bounds.minY || cell.x > bounds.maxX || cell.y > bounds.maxY) {
      continue;
    }
    const key = cellKey(cell);
    if (seen.has(key) || filled.has(key)) continue;
    seen.add(key);
    for (const [dx, dy] of DIRS) {
      queue.push({ x: cell.x + dx, y: cell.y + dy });
    }
  }
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const key = cellKey({ x, y });
      if (!filled.has(key) && !seen.has(key)) return true;
    }
  }
  return false;
}

export function canPlaceShape(
  piece: Shape,
  x: number,
  y: number,
  target: Shape,
  occupied: ReadonlySet<string> = new Set(),
): boolean {
  if (piece.length === 0) return false;
  const targetKeys = new Set(target.map(cellKey));
  for (const cell of piece) {
    const placed = { x: cell.x + x, y: cell.y + y };
    const key = cellKey(placed);
    if (!targetKeys.has(key) || occupied.has(key)) return false;
  }
  return true;
}

export function occupiedCells(pieces: { shape: Shape; x: number; y: number; placed: boolean }[], exceptId?: string): Set<string> {
  const keys = new Set<string>();
  for (const piece of pieces) {
    if (!piece.placed) continue;
    if (exceptId && "id" in piece && (piece as { id: string }).id === exceptId) continue;
    for (const cell of translateShape(piece.shape, piece.x, piece.y)) {
      keys.add(cellKey(cell));
    }
  }
  return keys;
}

export function perimeter(shape: Shape): number {
  const filled = new Set(shape.map(cellKey));
  let edges = 0;
  for (const cell of shape) {
    for (const [dx, dy] of DIRS) {
      if (!filled.has(cellKey({ x: cell.x + dx, y: cell.y + dy }))) edges += 1;
    }
  }
  return edges;
}

export function density(shape: Shape): number {
  const bounds = getBounds(shape);
  if (bounds.width === 0 || bounds.height === 0) return 0;
  return shape.length / (bounds.width * bounds.height);
}

export function shapeHash(shape: Shape): string {
  const normal = normalizeShape(shape);
  let hash = 2166136261;
  for (const cell of normal) {
    hash ^= cell.x + cell.y * 31;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function fitsOnBoard(shape: Shape, size = 8): boolean {
  const bounds = getBounds(shape);
  return bounds.width <= size && bounds.height <= size;
}
