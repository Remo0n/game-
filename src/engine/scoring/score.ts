export interface ScoreInput {
  difficultyScore: number;
  area: number;
  optimalCuts: number;
  cutsUsed: number;
  allowedCuts: number;
  hintsUsed: number;
  powerUpsUsed: number;
  wastedMoves: number;
  elapsedMs: number;
}

export interface ScoreResult {
  score: number;
  stars: 1 | 2 | 3;
}

export function scoreAttempt(input: ScoreInput): ScoreResult {
  const base = Math.max(1, input.difficultyScore) * Math.max(1, input.area);
  const extraCuts = Math.max(0, input.cutsUsed - input.optimalCuts);
  const room = Math.max(1, input.allowedCuts - input.optimalCuts + 1);
  const cutBonus = input.cutsUsed <= input.optimalCuts ? base * 0.5 : base * 0.5 * Math.max(0, 1 - extraCuts / room);
  const noHintBonus = input.hintsUsed === 0 ? base * 0.15 : 0;
  const perfectBonus =
    input.cutsUsed <= input.optimalCuts && input.hintsUsed === 0 && input.powerUpsUsed === 0 && input.wastedMoves <= 1
      ? base * 0.3
      : 0;
  const targetMs = 45000 + input.area * 1500;
  const speedRatio = Math.min(1, targetMs / Math.max(1000, input.elapsedMs));
  const speedBonus = base * 0.15 * speedRatio;
  const penalties = input.wastedMoves * base * 0.01 + input.powerUpsUsed * base * 0.04;
  const score = Math.max(1, Math.round(base + cutBonus + noHintBonus + perfectBonus + speedBonus - penalties));
  const slack = input.difficultyScore >= 75 ? 2 : input.difficultyScore >= 50 ? 1 : 0;
  let stars: 1 | 2 | 3 = 1;
  if (input.cutsUsed <= input.optimalCuts && input.hintsUsed === 0 && input.powerUpsUsed === 0) stars = 3;
  else if (input.cutsUsed <= input.optimalCuts + slack && input.hintsUsed <= 1) stars = 2;
  return { score, stars };
}
