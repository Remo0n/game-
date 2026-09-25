import type { Difficulty, Shape } from "../types";
import { density, getBounds, perimeter } from "../geometry/shape";

const ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [1, 5],
  [10, 12],
  [30, 27],
  [75, 48],
  [150, 69],
  [300, 84],
  [1000, 92],
  [100000, 96],
];

export function campaignTargetScore(levelNumber: number): number {
  const level = Math.max(1, Math.floor(levelNumber));
  for (let index = 1; index < ANCHORS.length; index += 1) {
    const [previousLevel, previousScore] = ANCHORS[index - 1];
    const [nextLevel, nextScore] = ANCHORS[index];
    if (level <= nextLevel) {
      const span = Math.log(nextLevel / previousLevel);
      const t = span === 0 ? 0 : Math.log(level / previousLevel) / span;
      return Math.round(previousScore + (nextScore - previousScore) * t);
    }
  }
  return 96;
}

export function classifyScore(score: number): Difficulty {
  if (score <= 24) return "EASY";
  if (score <= 49) return "MEDIUM";
  if (score <= 74) return "HARD";
  return "VERY_HARD";
}

export function bandMidpoint(difficulty: Difficulty): number {
  if (difficulty === "EASY") return 12;
  if (difficulty === "MEDIUM") return 37;
  if (difficulty === "HARD") return 62;
  return 88;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function unit(value: number, low: number, high: number): number {
  if (high <= low) return 0;
  return clamp((value - low) / (high - low), 0, 1) * 100;
}

export function irregularityScore(shape: Shape): number {
  if (shape.length === 0) return 0;
  const bounds = getBounds(shape);
  const box = bounds.width * bounds.height;
  const empty = Math.max(0, box - shape.length);
  const extra = Math.max(0, perimeter(shape) - 2 * (bounds.width + bounds.height));
  if (extra === 0 && empty === 0) return 0;
  const sparse = (1 - density(shape)) * 100;
  return clamp(extra * 10 + empty * 6 + sparse * 0.25, 0, 100);
}

export interface MetricInput {
  area: number;
  pieceCount: number;
  cuts: number;
  target: Shape;
  rotatedPieces: number;
  rotationsAllowed: boolean;
  cutOptions: number;
  placementChoices: number[];
}

export function measureDifficulty(input: MetricInput): number {
  const areaScore = unit(input.area, 2, 40);
  const pieceScore = unit(input.pieceCount, 2, 9);
  const cutScore = unit(input.cuts, 1, 8);
  const irregular = irregularityScore(input.target);
  const rotationScore = input.rotationsAllowed
    ? unit(input.rotatedPieces / Math.max(1, input.pieceCount), 0, 0.7)
    : 0;
  const branchingScore = unit(input.cutOptions, 1, 12);
  const capped = input.placementChoices.map((count) => Math.min(20, Math.max(1, count)));
  const logProduct = capped.reduce((sum, count) => sum + Math.log2(count), 0);
  const searchScore = unit(logProduct, 1, 18);
  const score =
    areaScore * 0.1 +
    pieceScore * 0.15 +
    cutScore * 0.2 +
    irregular * 0.15 +
    rotationScore * 0.1 +
    branchingScore * 0.15 +
    searchScore * 0.15;
  return Math.round(clamp(score, 0, 100));
}

export function timeLimitForScore(score: number): number {
  const t = clamp(score, 0, 100) / 100;
  return Math.round(180 - t * 90);
}

export function kitForScore(score: number): { laser: number; lineSplit: number; rotate: number; extraCut: number } {
  if (score < 25) return { laser: 1, lineSplit: 1, rotate: 1, extraCut: 1 };
  if (score < 50) return { laser: 1, lineSplit: 1, rotate: 0, extraCut: 1 };
  if (score < 75) return { laser: 0, lineSplit: 1, rotate: 0, extraCut: 0 };
  return { laser: 0, lineSplit: 0, rotate: 0, extraCut: 0 };
}
