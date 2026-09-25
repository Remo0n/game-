import { mixSeed } from "../engine/rng";
import type { LevelDefinition, Solution } from "../engine/types";

const solutions = new Map<string, Solution>();

export function rememberSolution(level: LevelDefinition): void {
  if (solutions.size >= 100) solutions.delete(solutions.keys().next().value!);
  solutions.set(level.id, level.solution);
}

export function peekSolution(levelId: string): Solution | undefined {
  return solutions.get(levelId);
}

export function createCampaignSeed(): number {
  return mixSeed(["player", Date.now(), 0x9e3779b9]);
}
