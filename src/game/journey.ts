import { WORLDS } from "../theme/theme";

/** Worlds repeat every 90 levels; keep every completed chapter replayable. */
export function journeyPage(
  worldStart: number,
  currentLevel: number,
  requestedPage?: number,
) {
  const span = 30;
  const cycle = span * WORLDS.length;
  const lastPage = Math.max(0, Math.floor((currentLevel - worldStart) / cycle));
  const page = Math.max(0, Math.min(lastPage, requestedPage ?? lastPage));
  const start = worldStart + page * cycle;
  return { page, lastPage, start, end: start + span - 1 };
}
