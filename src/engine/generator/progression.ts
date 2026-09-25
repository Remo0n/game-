import type { Difficulty, LevelDefinition, Variation } from "../types";

/** Revision changes puzzle IDs/seeds, not the saved level/star namespace. */
export const PROGRESSION_REVISION = "curriculum-2";
export type LevelBeat =
  | "learn"
  | "practice"
  | "build"
  | "challenge"
  | "breather";
export interface ProgressionPlan {
  revision: string;
  beat: LevelBeat;
  concept:
    | "slice"
    | "sequence"
    | "rotation"
    | "one-cut"
    | "multi-block"
    | "exact-fit"
    | "no-rotation"
    | "mix";
  label: string;
  tip: string;
  variation: Variation;
  targetScore: number;
  minArea: number;
  maxArea: number;
  minCuts: number;
  maxCuts: number;
  rotationsAllowed: boolean;
  maxRotatedPieces: number;
  irregularStock: boolean;
  maxIrregularity: number;
  extraCuts: number;
}
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const anchors = [
  [1, 7],
  [5, 11],
  [10, 17],
  [15, 21],
  [25, 27],
  [35, 32],
  [60, 40],
  [120, 50],
  [240, 61],
  [480, 70],
  [1000, 76],
] as const;
export function progressionBaseline(level: number): number {
  for (let i = 1; i < anchors.length; i++) {
    const [from, a] = anchors[i - 1],
      [to, b] = anchors[i];
    if (level <= to)
      return Math.round(
        a + (b - a) * clamp((level - from) / (to - from), 0, 1),
      );
  }
  return 76;
}
const lessons: Array<
  Pick<ProgressionPlan, "concept" | "variation" | "label" | "tip">
> = [
  {
    concept: "slice",
    variation: "NORMAL",
    label: "A first little slice",
    tip: "One slice makes two pieces. Cut along a seam, then move them into the tray.",
  },
  {
    concept: "sequence",
    variation: "NORMAL",
    label: "One slice, then another",
    tip: "Plan two slices. You can cut a loose piece again before packing it.",
  },
  {
    concept: "rotation",
    variation: "NORMAL",
    label: "A new way to turn",
    tip: "Cut first, then select a piece and tap Rotate. Turning is free in this bento.",
  },
  {
    concept: "one-cut",
    variation: "ONE_CUT",
    label: "One thoughtful slice",
    tip: "You have exactly one cut. Look at the tray before choosing your seam.",
  },
  {
    concept: "multi-block",
    variation: "MULTI_BLOCK",
    label: "A little more to arrange",
    tip: "Start with more than one block. Some pieces may already fit without a cut.",
  },
  {
    concept: "exact-fit",
    variation: "EXACT_FIT",
    label: "Every cut counts",
    tip: "Fill the rectangular tray using the cut budget. Undo is always free.",
  },
  {
    concept: "no-rotation",
    variation: "NO_ROTATION",
    label: "A fresh perspective",
    tip: "Pack these pieces as they face. Find the right cuts without rotating.",
  },
];

export function campaignPlan(levelNumber: number): ProgressionPlan {
  const n = Math.max(1, Math.floor(levelNumber));
  const early = n <= 35;
  const slot = early ? (n - 1) % 5 : (n - 1) % 10;
  const beat: LevelBeat = early
    ? (["learn", "practice", "build", "challenge", "breather"] as const)[slot]
    : (
        [
          "breather",
          "practice",
          "build",
          "build",
          "challenge",
          "breather",
          "practice",
          "build",
          "build",
          "challenge",
        ] as const
      )[slot];
  const lesson = lessons[Math.min(6, Math.floor((n - 1) / 5))];
  const variation: Variation = early
    ? beat === "breather"
      ? "NORMAL"
      : lesson.variation
    : (
        [
          "NORMAL",
          "NORMAL",
          "NO_ROTATION",
          "NORMAL",
          "MULTI_BLOCK",
          "ONE_CUT",
          "NORMAL",
          "EXACT_FIT",
          "NORMAL",
          "NORMAL",
        ] as const
      )[slot];
  const base = progressionBaseline(n);
  const offset = {
    learn: -4,
    practice: -2,
    build: 0,
    challenge: 3,
    breather: -6,
  }[beat];
  const maxArea =
    n <= 5
      ? 8
      : n <= 15
        ? 10
        : n <= 25
          ? 12
          : n <= 35
            ? 16
            : n <= 60
              ? 18
              : n <= 120
                ? 24
                : n <= 240
                  ? 30
                  : 36;
  let maxCuts =
    n <= 5
      ? 1
      : n <= 25
        ? 2
        : n <= 60
          ? 3
          : n <= 120
            ? 4
            : n <= 240
              ? 5
              : n <= 480
                ? 6
                : 7;
  if (beat === "breather" || beat === "learn")
    maxCuts = Math.max(1, maxCuts - (n > 5 ? 1 : 0));
  if (variation === "EXACT_FIT") maxCuts = Math.max(3, maxCuts);
  if (n === 6) maxCuts = 2;
  if (variation === "ONE_CUT") maxCuts = 1;
  const rotationsAllowed =
    n >= 11 && variation !== "NO_ROTATION" && variation !== "EXACT_FIT";
  return {
    revision: PROGRESSION_REVISION,
    beat,
    concept: early ? (beat === "breather" ? "mix" : lesson.concept) : "mix",
    label:
      beat === "breather"
        ? "A little breather"
        : beat === "challenge"
          ? "Put it all together"
          : early
            ? lesson.label
            : "A familiar idea, a new fit",
    tip:
      beat === "breather"
        ? "An easier bento between challenges. Take your time and enjoy the fit."
        : early
          ? lesson.tip
          : variation === "EXACT_FIT"
            ? lessons[5].tip
            : variation === "MULTI_BLOCK"
              ? lessons[4].tip
              : variation === "NO_ROTATION"
                ? lessons[6].tip
                : "Plan your slices, then try the larger pieces in the tray first.",
    variation,
    targetScore:
      n === 6
        ? 15
        : n === 11
          ? 21
          : n === 16
            ? 7
            : clamp(
                variation === "ONE_CUT"
                  ? Math.min(30, base + offset)
                  : base + offset,
                5,
                82,
              ),
    minArea:
      variation === "ONE_CUT"
        ? 6
        : n <= 35
          ? 4
          : Math.max(8, maxArea - 10 - (beat === "breather" ? 4 : 0)),
    maxArea: Math.min(
      variation === "ONE_CUT" ? 24 : 36,
      Math.max(6, maxArea - (beat === "breather" && n > 10 ? 4 : 0)),
    ),
    minCuts:
      n >= 6 && n <= 9
        ? 2
        : variation === "ONE_CUT" ||
            n <= 5 ||
            beat === "learn" ||
            beat === "breather"
          ? 1
          : Math.max(1, maxCuts - 1),
    maxCuts,
    rotationsAllowed,
    maxRotatedPieces: !rotationsAllowed
      ? 0
      : beat === "learn" && n !== 11
        ? 0
        : n <= 25
          ? 2
          : n <= 60
            ? 3
            : 8,
    irregularStock: n > 7 && beat !== "learn",
    maxIrregularity: n <= 5 ? 45 : n <= 10 ? 65 : 100,
    extraCuts:
      variation === "ONE_CUT" || variation === "EXACT_FIT"
        ? 0
        : n <= 15 || beat === "learn" || beat === "breather"
          ? 2
          : 1,
  };
}

export function fitsPlan(
  level: LevelDefinition,
  plan: ProgressionPlan,
): boolean {
  return (
    level.variation === plan.variation &&
    level.targetShape.length >= plan.minArea &&
    level.targetShape.length <= plan.maxArea &&
    level.optimalCuts >= plan.minCuts &&
    level.optimalCuts <= plan.maxCuts &&
    level.rotationsAllowed === plan.rotationsAllowed &&
    level.solution.placements.filter((p) => p.rotation !== 0).length <=
      plan.maxRotatedPieces
  );
}
export function difficultyLabel(difficulty: Difficulty): string {
  return {
    EASY: "Gentle",
    MEDIUM: "Thoughtful",
    HARD: "Tricky",
    VERY_HARD: "Expert",
  }[difficulty];
}

/** Optional modes use their own gentle ramp; the daily remains a fixed shared challenge. */
export function variationPlan(
  variation: Variation,
  levelNumber: number,
): ProgressionPlan {
  const plan = campaignPlan(levelNumber);
  const n = Math.max(1, levelNumber);
  const beat =
    n === 1 ? "learn" : plan.beat === "learn" ? "practice" : plan.beat;
  const lesson =
    lessons.find((item) => item.variation === variation) ?? lessons[0];
  const maxCuts =
    variation === "ONE_CUT"
      ? 1
      : variation === "EXACT_FIT"
        ? Math.max(3, plan.maxCuts)
        : plan.maxCuts;
  const rotationsAllowed =
    variation !== "NO_ROTATION" && variation !== "EXACT_FIT" && n >= 11;
  return {
    ...plan,
    revision: "variation-2",
    concept: lesson.concept,
    variation,
    beat,
    label:
      beat === "breather"
        ? "A little breather"
        : variation === "TIMED"
          ? "Lunch rush"
          : lesson.label,
    tip:
      variation === "TIMED"
        ? "Find your fit before the timer ends. The clock pauses while you take a break."
        : lesson.tip,
    targetScore: Math.min(
      variation === "ONE_CUT" ? 35 : 82,
      Math.max(
        variation === "EXACT_FIT" ? 22 : 5,
        progressionBaseline(n) +
          (beat === "challenge" ? 3 : beat === "breather" ? -6 : 0),
      ),
    ),
    minArea:
      variation === "EXACT_FIT" ? Math.max(6, plan.minArea) : plan.minArea,
    maxArea:
      variation === "EXACT_FIT" ? Math.max(10, plan.maxArea) : plan.maxArea,
    minCuts:
      variation === "ONE_CUT"
        ? 1
        : variation === "EXACT_FIT"
          ? Math.max(2, Math.min(plan.minCuts, maxCuts))
          : plan.minCuts,
    maxCuts,
    rotationsAllowed,
    maxRotatedPieces: rotationsAllowed ? plan.maxRotatedPieces : 0,
    extraCuts:
      variation === "ONE_CUT" || variation === "EXACT_FIT" ? 0 : plan.extraCuts,
  };
}
