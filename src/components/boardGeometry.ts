import { listBinaryCuts } from "../engine/geometry/cuts";
import { cellKey, getBounds } from "../engine/geometry/shape";
import type { BoardPiece } from "../engine/play/attempt";
import type { CutOrientation, Shape } from "../engine/types";

export interface Point {
  x: number;
  y: number;
}
export interface PieceLayout extends Point {
  width: number;
  height: number;
}
export interface BoardCut {
  pieceId: string;
  orientation: CutOrientation;
  position: number;
  from: Point;
  to: Point;
}

/** One coordinate system for the tray, loose pieces, and the whole cutting surface. */
export function layoutBoard(
  target: Shape,
  pieces: BoardPiece[],
  width: number,
  height: number,
  maxCell = 46,
) {
  const bounds = getBounds(target);
  const loose = pieces.filter((p) => !p.placed);
  const gap = 18;
  const padding = 20;
  function arrange(cell: number) {
    const rows: { ids: string[]; width: number; height: number }[] = [];
    for (const piece of loose) {
      const b = getBounds(piece.shape);
      const w = b.width * cell;
      const h = b.height * cell;
      let row = rows[rows.length - 1];
      if (!row || row.width + gap + w > width - padding * 2) {
        row = { ids: [], width: 0, height: 0 };
        rows.push(row);
      }
      row.width += (row.ids.length ? gap : 0) + w;
      row.height = Math.max(row.height, h);
      row.ids.push(piece.id);
    }
    return rows;
  }
  const widest = Math.max(
    bounds.width,
    ...pieces.map((p) => getBounds(p.shape).width),
  );
  let cell = Math.max(
    12,
    Math.min(maxCell, Math.floor((width - padding * 2) / widest)),
  );
  // Let a short screen scroll before shrinking a tall puzzle into tiny targets.
  // Width still wins so every piece remains within the board horizontally.
  const minCell = Math.min(24, cell);
  let rows = arrange(cell);
  const requiredHeight = () =>
    bounds.height * cell +
    92 +
    Math.max(
      100,
      rows.reduce((h, r) => h + r.height, 0) +
        Math.max(0, rows.length - 1) * gap +
        padding * 2,
    );
  while (cell > minCell && requiredHeight() > height) {
    cell--;
    rows = arrange(cell);
  }
  const totalHeight = Math.max(height, requiredHeight());
  const grid = { x: (width - bounds.width * cell) / 2, y: 40 };
  const cuttingTop = bounds.height * cell + 92;
  const cuttingHeight = totalHeight - cuttingTop;
  const contentHeight =
    rows.reduce((h, r) => h + r.height, 0) + Math.max(0, rows.length - 1) * gap;
  let y = cuttingTop + (cuttingHeight - contentHeight) / 2;
  const layouts: Record<string, PieceLayout> = {};
  for (const row of rows) {
    let x = (width - row.width) / 2;
    for (const id of row.ids) {
      const piece = pieces.find((p) => p.id === id)!;
      const b = getBounds(piece.shape);
      layouts[id] = {
        x,
        y: y + (row.height - b.height * cell) / 2,
        width: b.width * cell,
        height: b.height * cell,
      };
      x += b.width * cell + gap;
    }
    y += row.height + gap;
  }
  for (const piece of pieces.filter((p) => p.placed)) {
    const b = getBounds(piece.shape);
    layouts[piece.id] = {
      x: grid.x + (piece.x + b.minX - bounds.minX) * cell,
      y: grid.y + (piece.y + b.minY - bounds.minY) * cell,
      width: b.width * cell,
      height: b.height * cell,
    };
  }
  return {
    cell,
    grid,
    cuttingTop,
    cuttingHeight,
    height: totalHeight,
    layouts,
  };
}

/** A finite swipe must cross an actual shared cell edge, not just a piece's bounding box. */
export function resolveBoardCut(
  start: Point,
  end: Point,
  pieces: BoardPiece[],
  layouts: Record<string, PieceLayout>,
  cell: number,
): BoardCut | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.hypot(dx, dy) < 14) return null;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const orientation = horizontal ? "horizontal" : "vertical";
  const a = horizontal ? start.x : start.y;
  const b = horizontal ? end.x : end.y;
  const crossA = horizontal ? start.y : start.x;
  const crossB = horizontal ? end.y : end.x;
  let best: { time: number; distance: number; cut: BoardCut } | null = null;
  for (const piece of pieces) {
    const layout = layouts[piece.id];
    if (piece.placed || !layout) continue;
    const bounds = getBounds(piece.shape);
    const keys = new Set(piece.shape.map(cellKey));
    for (const cut of listBinaryCuts(piece.shape).filter(
      (c) => c.orientation === orientation,
    )) {
      const seam = horizontal
        ? layout.y + (cut.position - bounds.minY) * cell
        : layout.x + (cut.position - bounds.minX) * cell;
      for (const square of piece.shape) {
        if ((horizontal ? square.y : square.x) !== cut.position) continue;
        const neighbor = horizontal
          ? { x: square.x, y: square.y - 1 }
          : { x: square.x - 1, y: square.y };
        if (!keys.has(cellKey(neighbor))) continue;
        const edgeStart = horizontal
          ? layout.x + (square.x - bounds.minX) * cell
          : layout.y + (square.y - bounds.minY) * cell;
        const lo = Math.max(Math.min(a, b), edgeStart);
        const hi = Math.min(Math.max(a, b), edgeStart + cell);
        if (hi - lo < Math.min(10, cell * 0.3)) continue;
        const midpoint = (lo + hi) / 2;
        const time = (midpoint - a) / (b - a);
        const distance = Math.abs(crossA + (crossB - crossA) * time - seam);
        if (distance > cell * 0.42) continue;
        const candidate: BoardCut = {
          pieceId: piece.id,
          orientation,
          position: cut.position,
          from: horizontal
            ? { x: layout.x, y: seam }
            : { x: seam, y: layout.y },
          to: horizontal
            ? { x: layout.x + layout.width, y: seam }
            : { x: seam, y: layout.y + layout.height },
        };
        if (
          !best ||
          time < best.time - 0.01 ||
          (Math.abs(time - best.time) < 0.01 && distance < best.distance)
        )
          best = { time, distance, cut: candidate };
      }
    }
  }
  return best?.cut ?? null;
}

export function pieceAtPoint(
  point: Point,
  pieces: BoardPiece[],
  layouts: Record<string, PieceLayout>,
  cell: number,
) {
  return pieces.find((piece) => {
    if (piece.placed) return false;
    const layout = layouts[piece.id];
    if (!layout) return false;
    const bounds = getBounds(piece.shape);
    const x = Math.floor((point.x - layout.x) / cell) + bounds.minX;
    const y = Math.floor((point.y - layout.y) / cell) + bounds.minY;
    return piece.shape.some((square) => square.x === x && square.y === y);
  });
}
