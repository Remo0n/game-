import { formatDate, weekKey } from "../engine/generator/daily";
import {
  GENERATOR_VERSION,
  type ToolKit,
  type Variation,
} from "../engine/types";
import type { RunResult } from "./sessionStore";

export const VARIATIONS: Variation[] = [
  "NORMAL",
  "ONE_CUT",
  "NO_ROTATION",
  "EXACT_FIT",
  "TIMED",
  "MULTI_BLOCK",
];
export interface LevelResult {
  stars: number;
  bestScore: number;
  lastRun?: RunResult;
}
export interface ProgressData {
  campaignSeed: number;
  levelNumber: number;
  variationLevel: Record<Variation, number>;
  results: Record<string, LevelResult>;
  totalStars: number;
  streak: number;
  lastDailyDate: string | null;
  dailyCompletedDate: string | null;
  weekKey: string;
  weeklyDailyCount: number;
  weeklyRewardClaimed: boolean;
  wallet: ToolKit;
  selectedSkin: string;
  selectedTray: string;
  selectedBackground: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  recentSignatures: string[];
}
export interface CompletedRun {
  source: "campaign" | "daily" | "variation";
  variation: Variation;
  levelNumber: number;
  date: string;
  result: RunResult;
  nextWorldStars: number;
}
export function progressKey(mode: string, level: number | string): string {
  return `${GENERATOR_VERSION}:${mode}:${level}`;
}
export function runKey(
  run: Pick<CompletedRun, "source" | "variation" | "levelNumber" | "date">,
): string {
  return progressKey(
    run.source === "variation" ? run.variation : run.source,
    run.source === "daily" ? run.date : run.levelNumber,
  );
}
export function initialProgress(seed: number): ProgressData {
  return {
    campaignSeed: seed,
    levelNumber: 1,
    variationLevel: Object.fromEntries(VARIATIONS.map((v) => [v, 1])) as Record<
      Variation,
      number
    >,
    results: {},
    totalStars: 0,
    streak: 0,
    lastDailyDate: null,
    dailyCompletedDate: null,
    weekKey: "",
    weeklyDailyCount: 0,
    weeklyRewardClaimed: false,
    wallet: { laser: 0, lineSplit: 0, rotate: 0, extraCut: 0 },
    selectedSkin: "classic",
    selectedTray: "wood",
    selectedBackground: "kitchen",
    soundEnabled: true,
    hapticsEnabled: true,
    recentSignatures: [],
  };
}
/** Completion is one transaction: a reload cannot separate rewards from progress. */
export function finishRun(
  state: ProgressData,
  run: CompletedRun,
): ProgressData {
  const key = runKey(run);
  const previous = state.results[key];
  const stars = Math.max(previous?.stars ?? 0, run.result.stars);
  const next = {
    ...state,
    results: {
      ...state.results,
      [key]: {
        stars,
        bestScore: Math.max(previous?.bestScore ?? 0, run.result.score),
        lastRun: run.result,
      },
    },
    totalStars: state.totalStars + stars - (previous?.stars ?? 0),
    wallet: { ...state.wallet },
  };
  if (run.result.stars === 3 && (previous?.stars ?? 0) < 3) {
    const tool = (["lineSplit", "extraCut", "laser", "rotate"] as const).find(
      (name) => next.wallet[name] < 3,
    );
    if (tool) next.wallet[tool] += 1;
  }
  if (
    run.source === "campaign" &&
    run.levelNumber === state.levelNumber &&
    next.totalStars >= run.nextWorldStars
  )
    next.levelNumber += 1;
  if (run.source === "variation")
    next.variationLevel = {
      ...state.variationLevel,
      [run.variation]: Math.max(
        state.variationLevel[run.variation],
        run.levelNumber + 1,
      ),
    };
  // Replaying an earlier date never rewinds the streak or increments weekly rewards.
  if (
    run.source === "daily" &&
    (!state.lastDailyDate || run.date > state.lastDailyDate)
  ) {
    const day = new Date(`${run.date}T12:00:00`);
    const week = weekKey(day);
    day.setDate(day.getDate() - 1);
    next.streak =
      state.lastDailyDate === formatDate(day) ? state.streak + 1 : 1;
    next.weeklyDailyCount =
      (week === state.weekKey ? state.weeklyDailyCount : 0) + 1;
    next.weekKey = week;
    next.weeklyRewardClaimed =
      state.weeklyRewardClaimed || next.weeklyDailyCount >= 3;
    next.dailyCompletedDate = next.lastDailyDate = run.date;
  }
  return next;
}
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const integer = (
  value: unknown,
  fallback: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
) =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= min &&
  value <= max
    ? value
    : fallback;
export function isDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    formatDate(new Date(`${value}T12:00:00`)) === value
  );
}
/** Salvage valid data from older saves without allowing malformed fields into gameplay. */
export function restoreProgress(value: unknown, seed: number): ProgressData {
  const raw = object(value);
  const next = initialProgress(seed);
  next.campaignSeed = integer(raw.campaignSeed, seed, 0, 0xffffffff);
  next.levelNumber = integer(raw.levelNumber, 1, 1, 1000000);
  for (const variation of VARIATIONS)
    next.variationLevel[variation] = integer(
      object(raw.variationLevel)[variation],
      1,
      1,
      1000000,
    );
  for (const [key, value] of Object.entries(object(raw.results))) {
    const saved = object(value);
    const stars = integer(saved.stars, 0, 1, 3);
    if (
      !stars ||
      !/^\d+\.\d+\.\d+:(campaign|daily|NORMAL|ONE_CUT|NO_ROTATION|EXACT_FIT|TIMED|MULTI_BLOCK):[\d-]+$/.test(
        key,
      )
    )
      continue;
    const result: LevelResult = {
      stars,
      bestScore: integer(saved.bestScore, 0),
    };
    const last = object(saved.lastRun);
    if (
      [1, 2, 3].includes(Number(last.stars)) &&
      ["score", "elapsedMs", "cutsUsed", "optimalCuts", "hintsUsed"].every(
        (field) => integer(last[field], -1) >= 0,
      )
    )
      result.lastRun = last as unknown as RunResult;
    next.results[key] = result;
  }
  for (const key of ["lastDailyDate", "dailyCompletedDate"] as const)
    next[key] = isDate(raw[key]) ? raw[key] : null;
  // Version 0 used one result for every daily. Preserve its stars on the most recent day.
  const legacyKey = progressKey("daily", 7);
  if (next.dailyCompletedDate && next.results[legacyKey]) {
    next.results[progressKey("daily", next.dailyCompletedDate)] ??=
      next.results[legacyKey];
    delete next.results[legacyKey];
  }
  next.totalStars = Object.values(next.results).reduce(
    (sum, result) => sum + result.stars,
    0,
  );
  next.streak = integer(raw.streak, 0);
  next.weekKey =
    typeof raw.weekKey === "string" && /^\d{4}-W\d{2}$/.test(raw.weekKey)
      ? raw.weekKey
      : "";
  next.weeklyDailyCount = integer(raw.weeklyDailyCount, 0, 0, 7);
  for (const key of [
    "weeklyRewardClaimed",
    "soundEnabled",
    "hapticsEnabled",
  ] as const)
    if (typeof raw[key] === "boolean") next[key] = raw[key];
  for (const key of [
    "selectedSkin",
    "selectedTray",
    "selectedBackground",
  ] as const)
    if (typeof raw[key] === "string" && /^[a-z-]{1,40}$/.test(raw[key]))
      next[key] = raw[key];
  for (const key of Object.keys(next.wallet) as (keyof ToolKit)[])
    next.wallet[key] = integer(object(raw.wallet)[key], 0, 0, 6);
  next.recentSignatures = Array.isArray(raw.recentSignatures)
    ? raw.recentSignatures
        .filter((v: unknown): v is string => typeof v === "string")
        .slice(-80)
    : [];
  return next;
}
