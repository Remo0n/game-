import {
  campaignVariation,
  generateLevel,
} from "../engine/generator/generateLevel";
import { campaignPlan, variationPlan } from "../engine/generator/progression";
import { dailySeed } from "../engine/generator/daily";
import type {
  Difficulty,
  LevelDefinition,
  PlayableLevel,
  Variation,
} from "../engine/types";
import { rememberSolution } from "./vault";

const cache = new Map<string, LevelDefinition>();

export function sealLevel(level: LevelDefinition): PlayableLevel {
  rememberSolution(level);
  const { solution: _solution, ...playable } = level;
  return playable;
}

export function loadCampaignLevel(
  seed: number,
  levelNumber: number,
  _recentSignatures: string[] = [],
): LevelDefinition {
  const variation =
    levelNumber === 1 ? "NORMAL" : campaignVariation(seed, levelNumber);
  const key = `campaign:${seed}:${levelNumber}:${variation}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const level = generateLevel({
    seed,
    levelNumber,
    variation,
    progression: campaignPlan(levelNumber),
  });
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(key, level);
  return level;
}

export function loadVariationLevel(
  seed: number,
  variation: Variation,
  levelNumber: number,
): LevelDefinition {
  const key = `var:${seed}:${variation}:${levelNumber}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const level = generateLevel({
    seed: seed + variation.length * 17,
    levelNumber,
    variation,
    skipTutorial: true,
    progression: variationPlan(variation, levelNumber),
  });
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(key, level);
  return level;
}

export function loadDailyLevel(
  date: string,
  version?: string,
): LevelDefinition {
  const seed = dailySeed(date, version);
  const key = `daily:${date}:${seed}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const level = generateLevel({
    seed,
    levelNumber: 7,
    variation: "NORMAL",
    skipTutorial: true,
    difficulty: "MEDIUM",
  });
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(key, level);
  return level;
}

export function loadDebugLevel(input: {
  seed: number;
  levelNumber: number;
  variation: Variation;
  difficulty?: Difficulty;
}): LevelDefinition {
  return generateLevel({ ...input, skipTutorial: true });
}
