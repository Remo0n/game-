import { formatDate } from "../engine/generator/daily";
import type { Variation } from "../engine/types";
import { isDate, VARIATIONS, type ProgressData } from "./progress";

export type GameRoute = {
  source: "campaign" | "variation" | "daily";
  variation: Variation;
  levelNumber: number;
  date: string;
};
export function parseGameRoute(
  params: Record<string, string | string[] | undefined>,
  progress: Pick<ProgressData, "levelNumber" | "variationLevel">,
  today = formatDate(new Date()),
): GameRoute | null {
  if (Object.values(params).some(Array.isArray)) return null;
  const source = params.source || "campaign";
  if (!["campaign", "variation", "daily"].includes(source as string))
    return null;
  const variation = (params.variation || "NORMAL") as Variation;
  if (!VARIATIONS.includes(variation)) return null;
  const levelText = params.level;
  if (levelText && !/^\d+$/.test(levelText as string)) return null;
  const levelNumber =
    source === "daily"
      ? 7
      : Number(
          levelText ||
            (source === "variation"
              ? progress.variationLevel[variation]
              : progress.levelNumber),
        );
  if (
    !Number.isSafeInteger(levelNumber) ||
    levelNumber < 1 ||
    levelNumber > 1000000
  )
    return null;
  const date = (params.date || today) as string;
  if (source === "daily" && (!isDate(date) || date > today)) return null;
  return {
    source: source as GameRoute["source"],
    variation,
    levelNumber,
    date,
  };
}
