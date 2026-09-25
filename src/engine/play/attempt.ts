import { canCut, canLaserCut, nearestAxisCut } from "../geometry/cuts";
import { canPlaceShape, cellKey, normalizeShape, rotateShape, translateShape } from "../geometry/shape";
import type { CutOrientation, LaserLine, PlayableLevel, Rotation, Shape, ToolKit } from "../types";

export interface BoardPiece {
  id: string;
  shape: Shape;
  rotation: Rotation;
  placed: boolean;
  x: number;
  y: number;
}

export type HintGhost =
  | { kind: "cut"; pieceId: string; orientation: CutOrientation; position: number }
  | { kind: "cells"; cells: Shape };

export interface AttemptState {
  levelId: string;
  target: Shape;
  pieces: BoardPiece[];
  allowedCuts: number;
  cutsUsed: number;
  rotationsAllowed: boolean;
  hintsUsed: number;
  powerUpsUsed: number;
  wastedMoves: number;
  kit: ToolKit;
  hint: HintGhost | null;
  undo: AttemptSnapshot[];
  initial: AttemptSnapshot;
}

export interface AttemptSnapshot {
  pieces: BoardPiece[];
  allowedCuts: number;
  cutsUsed: number;
  hintsUsed: number;
  powerUpsUsed: number;
  wastedMoves: number;
  kit: ToolKit;
  hint: HintGhost | null;
}

let pieceSerial = 1;

function nextId(): string {
  pieceSerial += 1;
  return `c${pieceSerial}`;
}

function clonePieces(pieces: BoardPiece[]): BoardPiece[] {
  return pieces.map((piece) => ({
    ...piece,
    shape: piece.shape.map((cell) => ({ ...cell })),
  }));
}

function snapshotOf(state: AttemptState): AttemptSnapshot {
  return {
    pieces: clonePieces(state.pieces),
    allowedCuts: state.allowedCuts,
    cutsUsed: state.cutsUsed,
    hintsUsed: state.hintsUsed,
    powerUpsUsed: state.powerUpsUsed,
    wastedMoves: state.wastedMoves,
    kit: { ...state.kit },
    hint: state.hint ? { ...state.hint, ...(state.hint.kind === "cells" ? { cells: state.hint.cells.map((cell) => ({ ...cell })) } : {}) } as HintGhost : null,
  };
}

function withSnapshot(state: AttemptState, next: Partial<AttemptState> & { pieces: BoardPiece[] }): AttemptState {
  return {
    ...state,
    ...next,
    undo: [...state.undo, snapshotOf(state)].slice(-40),
    hint: null,
  };
}

export function createAttempt(level: PlayableLevel): AttemptState {
  const pieces: BoardPiece[] = level.startingPieces.map((piece) => ({
    id: piece.id,
    shape: normalizeShape(piece.shape),
    rotation: 0,
    placed: false,
    x: 0,
    y: 0,
  }));
  const state: AttemptState = {
    levelId: level.id,
    target: level.targetShape.map((cell) => ({ ...cell })),
    pieces,
    allowedCuts: level.allowedCuts,
    cutsUsed: 0,
    rotationsAllowed: level.rotationsAllowed,
    hintsUsed: 0,
    powerUpsUsed: 0,
    wastedMoves: 0,
    kit: { ...level.kit },
    hint: null,
    undo: [],
    initial: {
      pieces: clonePieces(pieces),
      allowedCuts: level.allowedCuts,
      cutsUsed: 0,
      hintsUsed: 0,
      powerUpsUsed: 0,
      wastedMoves: 0,
      kit: { ...level.kit },
      hint: null,
    },
  };
  state.initial = snapshotOf(state);
  return state;
}

export function occupiedKeys(state: AttemptState, exceptId?: string): Set<string> {
  const keys = new Set<string>();
  for (const piece of state.pieces) {
    if (!piece.placed || piece.id === exceptId) continue;
    for (const cell of translateShape(piece.shape, piece.x, piece.y)) keys.add(cellKey(cell));
  }
  return keys;
}

export function previewCut(
  state: AttemptState,
  pieceId: string,
  orientation: CutOrientation,
  along: number,
): { valid: boolean; cut?: { orientation: CutOrientation; position: number }; pieces?: Shape[] } {
  if (state.cutsUsed >= state.allowedCuts) return { valid: false };
  const piece = state.pieces.find((item) => item.id === pieceId && !item.placed);
  if (!piece) return { valid: false };
  const cut = nearestAxisCut(piece.shape, orientation, along);
  if (!cut) return { valid: false };
  const result = canCut(piece.shape, cut);
  if (!result.valid || !result.resultingPieces) return { valid: false };
  return { valid: true, cut, pieces: result.resultingPieces };
}

export function commitCut(
  state: AttemptState,
  pieceId: string,
  orientation: CutOrientation,
  position: number,
): AttemptState {
  const piece = state.pieces.find((item) => item.id === pieceId && !item.placed);
  if (!piece || state.cutsUsed >= state.allowedCuts) {
    return { ...state, wastedMoves: state.wastedMoves + 1 };
  }
  const result = canCut(piece.shape, { orientation, position });
  if (!result.valid || !result.resultingPieces) {
    return { ...state, wastedMoves: state.wastedMoves + 1 };
  }
  const created: BoardPiece[] = result.resultingPieces.map((shape) => ({
    id: nextId(),
    shape,
    rotation: piece.rotation,
    placed: false,
    x: 0,
    y: 0,
  }));
  return withSnapshot(state, {
    pieces: state.pieces.filter((item) => item.id !== pieceId).concat(created),
    cutsUsed: state.cutsUsed + 1,
  });
}

export function commitLaser(state: AttemptState, pieceId: string, line: LaserLine): AttemptState {
  if (state.kit.laser <= 0 || state.cutsUsed >= state.allowedCuts) return state;
  const piece = state.pieces.find((item) => item.id === pieceId && !item.placed);
  if (!piece) return state;
  const result = canLaserCut(piece.shape, line);
  if (!result.valid || !result.resultingPieces) {
    return { ...state, wastedMoves: state.wastedMoves + 1 };
  }
  const created: BoardPiece[] = result.resultingPieces.map((shape) => ({
    id: nextId(),
    shape,
    rotation: piece.rotation,
    placed: false,
    x: 0,
    y: 0,
  }));
  return withSnapshot(state, {
    pieces: state.pieces.filter((item) => item.id !== pieceId).concat(created),
    cutsUsed: state.cutsUsed + 1,
    powerUpsUsed: state.powerUpsUsed + 1,
    kit: { ...state.kit, laser: state.kit.laser - 1 },
  });
}

export function commitLineSplit(state: AttemptState, pieceId: string, orientation: CutOrientation, position: number): AttemptState {
  if (state.kit.lineSplit <= 0) return state;
  const next = commitCut(state, pieceId, orientation, position);
  if (next === state || next.cutsUsed === state.cutsUsed) return next;
  return {
    ...next,
    powerUpsUsed: state.powerUpsUsed + 1,
    kit: { ...next.kit, lineSplit: state.kit.lineSplit - 1 },
  };
}

export function findSnap(
  shape: Shape,
  target: Shape,
  occupied: ReadonlySet<string>,
  approxX: number,
  approxY: number,
): { x: number; y: number } | null {
  const baseX = Math.round(approxX);
  const baseY = Math.round(approxY);
  let best: { x: number; y: number; distance: number } | null = null;
  for (let y = baseY - 2; y <= baseY + 2; y += 1) {
    for (let x = baseX - 2; x <= baseX + 2; x += 1) {
      const distance = Math.hypot(x - approxX, y - approxY);
      if (distance > 1.15) continue;
      if (!canPlaceShape(shape, x, y, target, occupied)) continue;
      if (!best || distance < best.distance) best = { x, y, distance };
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}

export function placePiece(state: AttemptState, pieceId: string, x: number, y: number): { state: AttemptState; placed: boolean } {
  const piece = state.pieces.find((item) => item.id === pieceId);
  if (!piece) return { state, placed: false };
  const occupied = occupiedKeys(state, pieceId);
  if (!canPlaceShape(piece.shape, x, y, state.target, occupied)) {
    return {
      placed: false,
      state: {
        ...state,
        wastedMoves: state.wastedMoves + 1,
        pieces: state.pieces.map((item) => (item.id === pieceId ? { ...item, placed: false } : item)),
      },
    };
  }
  return {
    placed: true,
    state: withSnapshot(state, {
      pieces: state.pieces.map((item) => (item.id === pieceId ? { ...item, placed: true, x, y } : item)),
    }),
  };
}

export function rotatePiece(state: AttemptState, pieceId: string): AttemptState {
  const piece = state.pieces.find((item) => item.id === pieceId);
  if (!piece) return state;
  const spend = !state.rotationsAllowed;
  if (spend && state.kit.rotate <= 0) return state;
  const rotation = ((piece.rotation + 90) % 360) as Rotation;
  const shape = rotateShape(piece.shape, 90);
  let placed = piece.placed;
  let x = piece.x;
  let y = piece.y;
  if (placed && !canPlaceShape(shape, x, y, state.target, occupiedKeys(state, pieceId))) {
    placed = false;
  }
  return withSnapshot(state, {
    pieces: state.pieces.map((item) => (item.id === pieceId ? { ...item, shape, rotation, placed, x, y } : item)),
    powerUpsUsed: spend ? state.powerUpsUsed + 1 : state.powerUpsUsed,
    kit: spend ? { ...state.kit, rotate: state.kit.rotate - 1 } : state.kit,
  });
}

export function useExtraCut(state: AttemptState): AttemptState {
  if (state.kit.extraCut <= 0) return state;
  return withSnapshot(state, {
    pieces: clonePieces(state.pieces),
    allowedCuts: state.allowedCuts + 1,
    powerUpsUsed: state.powerUpsUsed + 1,
    kit: { ...state.kit, extraCut: state.kit.extraCut - 1 },
  });
}

export function undo(state: AttemptState): AttemptState {
  const previous = state.undo[state.undo.length - 1];
  if (!previous) return state;
  return {
    ...state,
    ...previous,
    pieces: clonePieces(previous.pieces),
    kit: { ...previous.kit },
    undo: state.undo.slice(0, -1),
    initial: state.initial,
    levelId: state.levelId,
    target: state.target,
    rotationsAllowed: state.rotationsAllowed,
  };
}

export function resetAttempt(state: AttemptState): AttemptState {
  return {
    ...state,
    ...state.initial,
    pieces: clonePieces(state.initial.pieces),
    kit: { ...state.initial.kit },
    undo: [],
    hint: null,
    initial: state.initial,
  };
}

export function isSolved(state: AttemptState): boolean {
  const covered: string[] = [];
  for (const piece of state.pieces) {
    if (!piece.placed) return false;
    for (const cell of translateShape(piece.shape, piece.x, piece.y)) covered.push(cellKey(cell));
  }
  if (new Set(covered).size !== covered.length) return false;
  if (covered.length !== state.target.length) return false;
  const have = new Set(covered);
  return state.target.every((cell) => have.has(cellKey(cell)));
}

export function setHint(state: AttemptState, hint: HintGhost | null): AttemptState {
  if (!hint) return state;
  return { ...state, hint, hintsUsed: state.hintsUsed + 1 };
}
