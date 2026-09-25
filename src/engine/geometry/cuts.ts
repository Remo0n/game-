import type { Cell, CutOrientation, LaserLine, Shape } from "../types";
import { getBounds, getConnectedComponents, normalizeShape } from "./shape";

export interface CutRequest {
  orientation: CutOrientation;
  position: number;
}

export interface CutResult {
  valid: boolean;
  resultingPieces?: Shape[];
}

export interface BinaryCut {
  orientation: CutOrientation;
  position: number;
  low: Shape;
  high: Shape;
}

function splitSides(shape: Shape, cut: CutRequest): { low: Cell[]; high: Cell[] } {
  const low: Cell[] = [];
  const high: Cell[] = [];
  for (const cell of shape) {
    const value = cut.orientation === "vertical" ? cell.x : cell.y;
    if (value < cut.position) low.push(cell);
    else high.push(cell);
  }
  return { low, high };
}

export function canCut(piece: Shape, cut: CutRequest): CutResult {
  if (piece.length < 2) return { valid: false };
  const { low, high } = splitSides(piece, cut);
  if (low.length === 0 || high.length === 0) return { valid: false };
  const pieces = [...getConnectedComponents(low), ...getConnectedComponents(high)];
  if (pieces.length < 2) return { valid: false };
  const original = getConnectedComponents(piece).length;
  if (pieces.length <= original) return { valid: false };
  return { valid: true, resultingPieces: pieces.map(normalizeShape) };
}

export function listBinaryCuts(shape: Shape): BinaryCut[] {
  if (shape.length < 2) return [];
  const bounds = getBounds(shape);
  const cuts: BinaryCut[] = [];
  for (let x = bounds.minX + 1; x <= bounds.maxX; x += 1) {
    const { low, high } = splitSides(shape, { orientation: "vertical", position: x });
    if (low.length === 0 || high.length === 0) continue;
    if (getConnectedComponents(low).length !== 1 || getConnectedComponents(high).length !== 1) continue;
    cuts.push({ orientation: "vertical", position: x, low, high });
  }
  for (let y = bounds.minY + 1; y <= bounds.maxY; y += 1) {
    const { low, high } = splitSides(shape, { orientation: "horizontal", position: y });
    if (low.length === 0 || high.length === 0) continue;
    if (getConnectedComponents(low).length !== 1 || getConnectedComponents(high).length !== 1) continue;
    cuts.push({ orientation: "horizontal", position: y, low, high });
  }
  return cuts;
}

export function canLaserCut(piece: Shape, line: LaserLine): CutResult {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  if (Math.hypot(dx, dy) < 0.2) return { valid: false };
  const low: Cell[] = [];
  const high: Cell[] = [];
  for (const cell of piece) {
    const cross = dx * (cell.y + 0.5 - line.y1) - dy * (cell.x + 0.5 - line.x1);
    if (Math.abs(cross) < 1e-6) return { valid: false };
    if (cross > 0) high.push(cell);
    else low.push(cell);
  }
  if (low.length === 0 || high.length === 0) return { valid: false };
  const pieces = [...getConnectedComponents(low), ...getConnectedComponents(high)];
  if (pieces.length < 2) return { valid: false };
  return { valid: true, resultingPieces: pieces.map(normalizeShape) };
}

export function mostEvenCut(shape: Shape): CutRequest | null {
  const options = listBinaryCuts(shape);
  if (options.length === 0) return null;
  options.sort(
    (a, b) => Math.abs(a.low.length - a.high.length) - Math.abs(b.low.length - b.high.length),
  );
  return { orientation: options[0].orientation, position: options[0].position };
}

export function nearestAxisCut(shape: Shape, orientation: CutOrientation, along: number): CutRequest | null {
  const options = listBinaryCuts(shape).filter((cut) => cut.orientation === orientation);
  if (options.length === 0) return null;
  let best = options[0];
  let bestDistance = Math.abs(options[0].position - along);
  for (const option of options) {
    const distance = Math.abs(option.position - along);
    if (distance < bestDistance) {
      best = option;
      bestDistance = distance;
    }
  }
  return { orientation: best.orientation, position: best.position };
}
