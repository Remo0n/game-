import { GENERATOR_VERSION } from "../types";
import { mixSeed } from "../rng";

export function dailySeed(date: string, version = GENERATOR_VERSION): number {
  return mixSeed(["daily", date, version]);
}

export function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function weekKey(date: Date): string {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + 3 - ((copy.getDay() + 6) % 7));
  const firstThursday = new Date(copy.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((copy.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7,
    );
  return `${copy.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function secondsUntilMidnight(date: Date): number {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return Math.max(0, Math.floor((next.getTime() - date.getTime()) / 1000));
}
