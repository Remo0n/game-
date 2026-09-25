import type { Variation } from "../types";
import { shapeHash } from "../geometry/shape";
import type { Shape } from "../types";

export function levelSignature(input: {
  family: string;
  pieceCount: number;
  cuts: number;
  variation: Variation;
  rotationsAllowed: boolean;
  target: Shape;
}): string {
  return [
    input.family,
    input.pieceCount,
    input.cuts,
    input.variation,
    input.rotationsAllowed ? "rot" : "fixed",
    shapeHash(input.target),
  ].join(":");
}
