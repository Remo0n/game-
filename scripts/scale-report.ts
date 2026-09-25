import { classifyScore, generateLevel, validateLevel } from "../src/engine/generator/generateLevel";
import { solvePuzzle } from "../src/engine/solver/solver";
import type { Difficulty, Variation } from "../src/engine/types";

const VARIATIONS: Variation[] = ["NORMAL", "ONE_CUT", "NO_ROTATION", "EXACT_FIT", "TIMED", "MULTI_BLOCK"];
const TOTAL = 10000;

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

const counts: Record<Difficulty, number> = { EASY: 0, MEDIUM: 0, HARD: 0, VERY_HARD: 0 };
let valid = 0;
let rejected = 0;
let generationMs = 0;
let solverMs = 0;
let solverSamples = 0;
const times: number[] = [];
const recent: string[] = [];

for (let index = 0; index < TOTAL; index += 1) {
  const levelNumber = (index % 400) + 1;
  const variation = VARIATIONS[index % VARIATIONS.length];
  const history = recent.slice(-80);
  const input = {
    seed: 1000 + (index % 250),
    levelNumber,
    variation,
    skipTutorial: true,
    recentSignatures: history,
  };
  const started = performance.now();
  const level = generateLevel(input);
  const elapsed = performance.now() - started;
  generationMs += elapsed;
  times.push(elapsed);
  const validation = validateLevel(level);
  if (!validation.ok) {
    console.error("Invalid level", level.id, validation.reasons.join(", "));
    process.exitCode = 1;
    break;
  }
  if (index % 25 === 0) {
    const again = generateLevel(input);
    if (again.signature !== level.signature || again.targetShape.length !== level.targetShape.length || again.optimalCuts !== level.optimalCuts) {
      console.error("Seed mismatch", level.id);
      process.exitCode = 1;
      break;
    }
  }
  valid += 1;
  rejected += level.rejectedCandidates;
  counts[classifyScore(level.difficultyScore)] += 1;
  recent.push(level.signature);
  if (recent.length > 80) recent.shift();
  if (index % 100 === 0) {
    const solverStarted = performance.now();
    solvePuzzle(
      level.solution.pieces.map((piece) => piece.shape),
      level.targetShape,
      { rotations: level.rotationsAllowed, nodeCap: 1500 },
    );
    solverMs += performance.now() - solverStarted;
    solverSamples += 1;
  }
}

const averageGeneration = generationMs / Math.max(1, valid);
const median = percentile(times, 50);
const percent = (count: number) => ((count / Math.max(1, valid)) * 100).toFixed(1);

console.log(`Generated: ${valid}`);
console.log(`Valid: ${valid}`);
console.log(`Rejected: ${rejected}`);
console.log(`Average generation time: ${averageGeneration.toFixed(2)} ms`);
console.log(`Average solver time: ${(solverMs / Math.max(1, solverSamples)).toFixed(2)} ms`);
console.log(`Easy: ${percent(counts.EASY)}%`);
console.log(`Medium: ${percent(counts.MEDIUM)}%`);
console.log(`Hard: ${percent(counts.HARD)}%`);
console.log(`Very Hard: ${percent(counts.VERY_HARD)}%`);

if (median > 500) {
  console.error(`Median generation ${median} ms exceeds 500 ms`);
  process.exitCode = 1;
}
