import { canPlaceShape, cellKey, getBounds, normalizeShape, rotateShape } from "../geometry/shape";
import type { Placement, Rotation, Shape } from "../types";

export interface SolveOptions {
  rotations?: boolean;
  nodeCap?: number;
}

export interface SolveResult {
  solved: boolean;
  solution?: Placement[];
  moves: number;
  elapsedMs: number;
}

export function solvePuzzle(pieces: Shape[], target: Shape, options: SolveOptions = {}): SolveResult {
  const started = Date.now();
  const rotationsAllowed = options.rotations ?? true;
  const nodeCap = options.nodeCap ?? 20000;
  const board = normalizeShape(target);
  const index = new Map<string, number>();
  board.forEach((cell, cellIndex) => index.set(cellKey(cell), cellIndex));
  const order = pieces
    .map((shape, pieceIndex) => ({ shape: normalizeShape(shape), pieceIndex }))
    .sort((a, b) => b.shape.length - a.shape.length || a.pieceIndex - b.pieceIndex);
  const full = board.length;
  let moves = 0;
  let solved: Placement[] | null = null;
  const placed: Placement[] = [];

  function rec(pieceOrdinal: number, covered: Set<string>): boolean {
    if (solved) return true;
    moves += 1;
    if (moves > nodeCap) return false;
    if (pieceOrdinal === order.length) {
      if (covered.size === full) {
        solved = placed.map((item) => ({ ...item }));
        return true;
      }
      return false;
    }
    const piece = order[pieceOrdinal];
    const turns: Rotation[] = rotationsAllowed ? [0, 90, 180, 270] : [0];
    const seen = new Set<string>();
    const bounds = getBounds(board);
    for (const rotation of turns) {
      const shape = rotateShape(piece.shape, rotation);
      const signature = shape.map((cell) => `${cell.x},${cell.y}`).join(";");
      if (seen.has(signature)) continue;
      seen.add(signature);
      for (let y = bounds.minY - shape.length; y <= bounds.maxY; y += 1) {
        for (let x = bounds.minX - shape.length; x <= bounds.maxX; x += 1) {
          if (!canPlaceShape(shape, x, y, board, covered)) continue;
          const added: string[] = [];
          for (const cell of shape) {
            const key = cellKey({ x: cell.x + x, y: cell.y + y });
            covered.add(key);
            added.push(key);
          }
          placed.push({ pieceId: `s${piece.pieceIndex}`, x, y, rotation });
          if (rec(pieceOrdinal + 1, covered)) return true;
          placed.pop();
          for (const key of added) covered.delete(key);
          if (moves > nodeCap) return false;
        }
      }
    }
    return false;
  }

  rec(0, new Set());
  return {
    solved: solved !== null,
    solution: solved ?? undefined,
    moves,
    elapsedMs: Date.now() - started,
  };
}
