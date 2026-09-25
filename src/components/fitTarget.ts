/** Padding and border around the target grid, matching the tray style. */
export const TARGET_TRAY_CHROME = 34;
const MASCOT_WIDTH = 84;
const MASCOT_GAP = 8;
const SCREEN_PADDING = 24;
const MAX_CELL = 46;

export function fitPlayCell(input: {
  screenWidth: number;
  playHeight: number;
  columns: number;
  rows: number;
  mascot: boolean;
}): number {
  const mascotWidth = input.mascot ? MASCOT_WIDTH + MASCOT_GAP : 0;
  const maxGridWidth = Math.max(96, input.screenWidth - SCREEN_PADDING - mascotWidth - TARGET_TRAY_CHROME);
  const targetBand = Math.max(72, Math.round(input.playHeight * 0.5));
  const fitted = Math.min(MAX_CELL, maxGridWidth / Math.max(1, input.columns), targetBand / Math.max(1, input.rows));
  return Math.max(12, Math.floor(fitted));
}

export function cellCornerRadius(cell: number): number {
  return Math.max(2, Math.round(cell / 6));
}
