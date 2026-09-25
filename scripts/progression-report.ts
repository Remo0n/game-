import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { loadCampaignLevel } from "../src/game/levels";
import { validateLevel } from "../src/engine/generator/generateLevel";
import { campaignPlan, fitsPlan } from "../src/engine/generator/progression";
const count = Number(process.env.BENTO_PROGRESSION_SAMPLES ?? 10000);
const rows: Array<{
  seed: number;
  level: number;
  beat: string;
  variation: string;
  target: number;
  measured: number;
  area: number;
  cuts: number;
  ms: number;
}> = [];
const errors: string[] = [];
for (let i = 0; i < count; i++) {
  const n = (i % 400) + 1,
    seed = 7001 + Math.floor(i / 400) * 7919;
  const started = performance.now();
  try {
    const level = loadCampaignLevel(seed, n);
    const validation = validateLevel(level);
    if (!validation.ok || !fitsPlan(level, campaignPlan(n)))
      errors.push(
        `${seed}:${n}: ${validation.reasons.join(",") || "outside lesson limits"}`,
      );
    rows.push({
      seed,
      level: n,
      beat: level.progression!.beat,
      variation: level.variation,
      target: level.targetScore,
      measured: level.difficultyScore,
      area: level.targetShape.length,
      cuts: level.optimalCuts,
      ms: performance.now() - started,
    });
  } catch (error) {
    errors.push(`${seed}:${n}: ${String(error)}`);
  }
  if ((i + 1) % 1000 === 0) console.log(`Checked ${i + 1}/${count}`);
}
const bands = [
  [1, 5],
  [6, 10],
  [11, 20],
  [21, 35],
  [36, 60],
  [61, 120],
  [121, 240],
  [241, 400],
];
const average = (values: number[]) =>
  +(values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)).toFixed(2);
const summary = bands.map(([from, to]) => {
  const group = rows.filter((r) => r.level >= from && r.level <= to);
  return {
    levels: `${from}-${to}`,
    count: group.length,
    mean: average(group.map((r) => r.measured)),
    cuts: average(group.map((r) => r.cuts)),
    area: average(group.map((r) => r.area)),
    maxGap: Math.max(...group.map((r) => r.measured - r.target)),
  };
});
const report = {
  count: rows.length,
  errors: errors.length,
  meanMs: average(rows.map((r) => r.ms)),
  maxMs: Math.max(...rows.map((r) => r.ms)),
  withinSix: rows.filter((r) => Math.abs(r.measured - r.target) <= 6).length,
  summary,
  failures: errors.slice(0, 20),
};
console.log(JSON.stringify(report, null, 2));
if (process.env.BENTO_PROGRESSION_REPORT)
  writeFileSync(
    process.env.BENTO_PROGRESSION_REPORT,
    JSON.stringify({ ...report, rows }, null, 2),
  );
if (errors.length) process.exitCode = 1;
