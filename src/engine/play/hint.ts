import { mostEvenCut } from "../geometry/cuts";
import { cellKey, getBounds, normalizeShape, rotateShape, shapeEquals, translateShape } from "../geometry/shape";
import type { AxisCut, CutNode, Shape, Solution } from "../types";
import type { BoardPiece, HintGhost } from "./attempt";

function nodeCells(node: CutNode): Shape {
  if (node.type === "leaf") return node.cells;
  return [...nodeCells(node.left), ...nodeCells(node.right)];
}

function walk(node: CutNode, visit: (node: CutNode, cells: Shape) => void): void {
  visit(node, nodeCells(node));
  if (node.type === "cut") {
    walk(node.left, visit);
    walk(node.right, visit);
  }
}

export function suggestLineSplit(piece: BoardPiece, solution: Solution): AxisCut | null {
  let matched: AxisCut | null = null;
  walk(solution.tree, (node, cells) => {
    if (matched || node.type !== "cut") return;
    if (!shapeEquals(piece.shape, normalizeShape(cells))) return;
    const bounds = getBounds(cells);
    matched = {
      pieceId: piece.id,
      orientation: node.orientation,
      position: node.orientation === "vertical" ? node.position - bounds.minX : node.position - bounds.minY,
    };
  });
  if (matched) return matched;
  const even = mostEvenCut(piece.shape);
  if (!even) return null;
  return { pieceId: piece.id, orientation: even.orientation, position: even.position };
}

export function suggestHint(pieces: BoardPiece[], solution: Solution): HintGhost | null {
  for (const piece of pieces) {
    if (piece.placed || piece.shape.length < 2) continue;
    const split = suggestLineSplit(piece, solution);
    if (split) {
      return { kind: "cut", pieceId: piece.id, orientation: split.orientation, position: split.position };
    }
  }
  const covered = new Set<string>();
  for (const piece of pieces) {
    if (!piece.placed) continue;
    for (const cell of piece.shape) covered.add(cellKey({ x: cell.x + piece.x, y: cell.y + piece.y }));
  }
  for (const piece of solution.pieces) {
    const placement = solution.placements.find((item) => item.pieceId === piece.id);
    if (!placement) continue;
    const cells = translateShape(rotateShape(piece.shape, placement.rotation), placement.x, placement.y);
    if (cells.some((cell) => !covered.has(cellKey(cell)))) {
      return { kind: "cells", cells };
    }
  }
  return null;
}
