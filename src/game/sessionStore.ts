import { create } from "zustand";
import { nearestAxisCut } from "../engine/geometry/cuts";
import {
  commitCut,
  commitLaser,
  commitLineSplit,
  createAttempt,
  findSnap,
  isSolved,
  occupiedKeys,
  placePiece,
  resetAttempt,
  rotatePiece,
  setHint,
  undo,
  useExtraCut,
  type AttemptState,
  type HintGhost,
} from "../engine/play/attempt";
import { suggestHint, suggestLineSplit } from "../engine/play/hint";
import { scoreAttempt, type ScoreResult } from "../engine/scoring/score";
import type {
  CutOrientation,
  LaserLine,
  PlayableLevel,
  ToolKit,
} from "../engine/types";
import { peekSolution } from "./vault";

export interface RunResult extends ScoreResult {
  elapsedMs: number;
  cutsUsed: number;
  optimalCuts: number;
  hintsUsed: number;
}

interface SessionState {
  level: PlayableLevel | null;
  attempt: AttemptState | null;
  startedAt: number;
  pausedAt: number | null;
  pause: () => void;
  resume: () => void;
  selectedId: string | null;
  cutMode: boolean;
  result: RunResult | null;
  timedOut: boolean;
  start: (level: PlayableLevel) => void;
  select: (pieceId: string | null) => void;
  setCutMode: (cutMode: boolean) => void;
  cut: (
    pieceId: string,
    orientation: CutOrientation,
    position: number,
  ) => boolean;
  laser: (pieceId: string, line: LaserLine) => boolean;
  lineSplit: (pieceId: string) => boolean;
  drop: (pieceId: string, x: number, y: number) => boolean;
  rotate: (pieceId: string) => boolean;
  extraCut: () => boolean;
  hint: () => void;
  undoMove: () => void;
  reset: () => void;
  expire: () => void;
  boost: (tool: keyof ToolKit) => void;
  withTool: (
    tool: keyof ToolKit,
    borrow: boolean,
    action: () => boolean,
    resumeFromDialog?: boolean,
  ) => boolean;
}

function finishIfSolved(
  attempt: AttemptState,
  level: PlayableLevel,
  startedAt: number,
): RunResult | null {
  if (!isSolved(attempt)) return null;
  const scored = scoreAttempt({
    difficultyScore: level.difficultyScore,
    area: level.targetShape.length,
    optimalCuts: level.optimalCuts,
    cutsUsed: attempt.cutsUsed,
    allowedCuts: level.allowedCuts,
    hintsUsed: attempt.hintsUsed,
    powerUpsUsed: attempt.powerUpsUsed,
    wastedMoves: attempt.wastedMoves,
    elapsedMs: Date.now() - startedAt,
  });
  return {
    ...scored,
    elapsedMs: Date.now() - startedAt,
    cutsUsed: attempt.cutsUsed,
    optimalCuts: level.optimalCuts,
    hintsUsed: attempt.hintsUsed,
  };
}

export const useSession = create<SessionState>((set, get) => ({
  level: null,
  attempt: null,
  startedAt: 0,
  pausedAt: null,
  selectedId: null,
  cutMode: true,
  result: null,
  timedOut: false,
  start: (level) =>
    set({
      level,
      attempt: createAttempt(level),
      startedAt: Date.now(),
      pausedAt: null,
      selectedId: level.startingPieces[0]?.id ?? null,
      cutMode: level.allowedCuts > 0,
      result: null,
      timedOut: false,
    }),
  pause: () => {
    const state = get();
    if (state.level && !state.result && state.pausedAt === null)
      set({ pausedAt: Date.now() });
  },
  resume: () => {
    const state = get();
    if (state.pausedAt !== null)
      set({
        startedAt: state.startedAt + Date.now() - state.pausedAt,
        pausedAt: null,
      });
  },
  select: (selectedId) => set({ selectedId }),
  setCutMode: (cutMode) => set({ cutMode }),
  cut: (pieceId, orientation, position) => {
    const { attempt, level, startedAt } = get();
    if (
      !attempt ||
      !level ||
      get().result ||
      get().timedOut ||
      get().pausedAt !== null
    )
      return false;
    const piece = attempt.pieces.find((item) => item.id === pieceId);
    const snapped = piece
      ? nearestAxisCut(piece.shape, orientation, position)
      : null;
    if (!snapped) {
      set({ attempt: { ...attempt, wastedMoves: attempt.wastedMoves + 1 } });
      return false;
    }
    const next = commitCut(
      attempt,
      pieceId,
      snapped.orientation,
      snapped.position,
    );
    const solved = finishIfSolved(next, level, startedAt);
    set({
      attempt: next,
      result: solved,
      cutMode: next.cutsUsed < next.allowedCuts,
      selectedId: next.pieces.find((piece) => !piece.placed)?.id ?? null,
    });
    return next.cutsUsed > attempt.cutsUsed;
  },
  laser: (pieceId, line) => {
    const { attempt, level, startedAt } = get();
    if (
      !attempt ||
      !level ||
      get().result ||
      get().timedOut ||
      get().pausedAt !== null
    )
      return false;
    const next = commitLaser(attempt, pieceId, line);
    set({
      attempt: next,
      result: finishIfSolved(next, level, startedAt),
      cutMode: next.cutsUsed < next.allowedCuts,
      selectedId: next.pieces.find((piece) => !piece.placed)?.id ?? null,
    });
    return next.cutsUsed > attempt.cutsUsed;
  },
  lineSplit: (pieceId) => {
    const { attempt, level, startedAt } = get();
    if (
      !attempt ||
      !level ||
      get().result ||
      get().timedOut ||
      get().pausedAt !== null
    )
      return false;
    const solution = peekSolution(level.id);
    const piece = attempt.pieces.find((item) => item.id === pieceId);
    if (!solution || !piece) return false;
    const split = suggestLineSplit(piece, solution);
    if (!split) return false;
    const next = commitLineSplit(
      attempt,
      pieceId,
      split.orientation,
      split.position,
    );
    set({
      attempt: next,
      result: finishIfSolved(next, level, startedAt),
      cutMode: next.cutsUsed < next.allowedCuts,
      selectedId: next.pieces.find((piece) => !piece.placed)?.id ?? null,
    });
    return next.powerUpsUsed > attempt.powerUpsUsed;
  },
  drop: (pieceId, x, y) => {
    const { attempt, level, startedAt } = get();
    if (
      !attempt ||
      !level ||
      get().result ||
      get().timedOut ||
      get().pausedAt !== null
    )
      return false;
    const piece = attempt.pieces.find((item) => item.id === pieceId);
    const snap = piece
      ? findSnap(
          piece.shape,
          attempt.target,
          occupiedKeys(attempt, pieceId),
          x,
          y,
        )
      : null;
    if (!snap) {
      set({ attempt: { ...attempt, wastedMoves: attempt.wastedMoves + 1 } });
      return false;
    }
    const dropped = placePiece(attempt, pieceId, snap.x, snap.y);
    set({
      attempt: dropped.state,
      result: finishIfSolved(dropped.state, level, startedAt),
      selectedId: dropped.state.pieces.find((item) => !item.placed)?.id ?? null,
    });
    return dropped.placed;
  },
  rotate: (pieceId) => {
    const { attempt } = get();
    if (!attempt || get().result || get().timedOut || get().pausedAt !== null)
      return false;
    const next = rotatePiece(attempt, pieceId);
    set({ attempt: next });
    return next !== attempt;
  },
  extraCut: () => {
    const { attempt } = get();
    if (!attempt || get().result || get().timedOut || get().pausedAt !== null)
      return false;
    const next = useExtraCut(attempt);
    set({ attempt: next, cutMode: true });
    return next !== attempt;
  },
  hint: () => {
    const { attempt, level } = get();
    if (!attempt || !level) return;
    const solution = peekSolution(level.id);
    if (!solution) return;
    const hint: HintGhost | null = suggestHint(attempt.pieces, solution);
    set({ attempt: setHint(attempt, hint) });
  },
  undoMove: () => {
    const { attempt } = get();
    if (!attempt) return;
    const previous = undo(attempt);
    set({
      attempt: previous,
      result: null,
      cutMode: previous.cutsUsed < previous.allowedCuts,
      selectedId: previous.pieces.find((piece) => !piece.placed)?.id ?? null,
    });
  },
  reset: () => {
    const { attempt } = get();
    if (!attempt) return;
    set({
      attempt: resetAttempt(attempt),
      result: null,
      timedOut: false,
      startedAt: Date.now(),
      pausedAt: null,
      cutMode: attempt.initial.allowedCuts > 0,
      selectedId: attempt.initial.pieces[0]?.id ?? null,
    });
  },
  expire: () => {
    const { attempt } = get();
    if (!attempt || get().result) return;
    set({
      attempt: resetAttempt(attempt),
      timedOut: true,
      startedAt: Date.now(),
      pausedAt: null,
      result: null,
    });
  },
  withTool: (tool, borrow, action, resumeFromDialog = false) => {
    const before = get();
    if (!before.attempt || before.result || before.timedOut) return false;
    if (before.pausedAt !== null) {
      if (!resumeFromDialog) return false;
      // An explicit tool choice closes the dialog and resumes play. Exclude the
      // time spent choosing from both the countdown and the completion score.
      before.resume();
    }
    if (borrow) before.boost(tool);
    const ok = action();
    if (!ok && borrow)
      set({
        attempt: before.attempt,
        cutMode: before.cutMode,
        selectedId: before.selectedId,
      });
    return ok;
  },
  boost: (tool) => {
    const { attempt } = get();
    if (!attempt || attempt.kit[tool] >= 6) return;
    set({
      attempt: {
        ...attempt,
        kit: { ...attempt.kit, [tool]: attempt.kit[tool] + 1 },
      },
    });
  },
}));
