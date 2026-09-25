export const GENERATOR_VERSION = "1.0.0";
export const BOARD_SIZE = 8;

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";

export type Variation =
  | "NORMAL"
  | "ONE_CUT"
  | "NO_ROTATION"
  | "EXACT_FIT"
  | "TIMED"
  | "MULTI_BLOCK";

export type Rotation = 0 | 90 | 180 | 270;

export interface Cell {
  x: number;
  y: number;
}

export type Shape = Cell[];

export type CutOrientation = "horizontal" | "vertical";

export interface AxisCut {
  pieceId: string;
  orientation: CutOrientation;
  position: number;
}

export interface Piece {
  id: string;
  shape: Shape;
  rotation: Rotation;
}

export interface Placement {
  pieceId: string;
  x: number;
  y: number;
  rotation: Rotation;
}

export interface ToolKit {
  laser: number;
  lineSplit: number;
  rotate: number;
  extraCut: number;
}

export type CutNode =
  | { type: "leaf"; id: string; cells: Shape }
  | {
      type: "cut";
      orientation: CutOrientation;
      position: number;
      left: CutNode;
      right: CutNode;
    };

export interface Solution {
  cuts: AxisCut[];
  placements: Placement[];
  pieces: Piece[];
  tree: CutNode;
  stock: Shape;
}

export interface LevelDefinition {
  id: string;
  seed: number;
  levelNumber: number;
  generatorVersion: string;
  difficulty: Difficulty;
  difficultyScore: number;
  targetScore: number;
  variation: Variation;
  targetShape: Shape;
  startingPieces: Piece[];
  allowedCuts: number;
  rotationsAllowed: boolean;
  optimalCuts: number;
  timeLimitSec: number | null;
  primitiveFamily: string;
  signature: string;
  rejectedCandidates: number;
  kit: ToolKit;
  solution: Solution;
}

export type PlayableLevel = Omit<LevelDefinition, "solution">;

export interface GenerateInput {
  seed: number;
  levelNumber: number;
  variation?: Variation;
  generatorVersion?: string;
  difficulty?: Difficulty;
  recentSignatures?: string[];
  skipTutorial?: boolean;
}

export interface LaserLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
