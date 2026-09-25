import { listBinaryCuts } from "../geometry/cuts";
import { identityLayout, packLeaves } from "../geometry/pack";
import {
  canPlaceShape,
  cellKey,
  density,
  getBounds,
  hasHole,
  isConnected,
  normalizeShape,
  rotateShape,
  shapeEquals,
  translateShape,
} from "../geometry/shape";
import { mixSeed, SeededRandom } from "../rng";
import type {
  AxisCut,
  CutNode,
  Difficulty,
  GenerateInput,
  LevelDefinition,
  Piece,
  Placement,
  Rotation,
  Shape,
  Solution,
  Variation,
} from "../types";
import { GENERATOR_VERSION } from "../types";
import {
  bandMidpoint,
  campaignTargetScore,
  classifyScore,
  irregularityScore,
  kitForScore,
  measureDifficulty,
  timeLimitForScore,
} from "./difficulty";
import { buildStock, factorPairs, rectangle } from "./primitives";
import { levelSignature } from "./signature";

export interface ValidationResult {
  ok: boolean;
  reasons: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function countCuts(node: CutNode): number {
  if (node.type === "leaf") return 0;
  return 1 + countCuts(node.left) + countCuts(node.right);
}

function assignIds(node: CutNode, counter = { n: 0 }): CutNode {
  if (node.type === "leaf") {
    const id = `s${counter.n}`;
    counter.n += 1;
    return { ...node, id };
  }
  return {
    ...node,
    left: assignIds(node.left, counter),
    right: assignIds(node.right, counter),
  };
}

function leavesOf(node: CutNode): Array<{ id: string; cells: Shape }> {
  if (node.type === "leaf") return [{ id: node.id, cells: node.cells }];
  return [...leavesOf(node.left), ...leavesOf(node.right)];
}

function nodeCells(node: CutNode): Shape {
  if (node.type === "leaf") return node.cells;
  return [...nodeCells(node.left), ...nodeCells(node.right)];
}

function openTree(node: CutNode, budget: { n: number }): CutNode[] {
  if (node.type === "leaf" || budget.n <= 0) return [node];
  budget.n -= 1;
  return [...openTree(node.left, budget), ...openTree(node.right, budget)];
}

function recordCuts(node: CutNode, pieceId: string, acc: AxisCut[]): void {
  if (node.type === "leaf") return;
  acc.push({ pieceId, orientation: node.orientation, position: node.position });
  recordCuts(node.left, `${pieceId}L`, acc);
  recordCuts(node.right, `${pieceId}R`, acc);
}

function columnTree(width: number, height: number, x0 = 0): CutNode {
  const column = (x: number): Shape => Array.from({ length: height }, (_, y) => ({ x, y }));
  if (width <= 1) return { type: "leaf", id: "", cells: column(x0) };
  return {
    type: "cut",
    orientation: "vertical",
    position: x0 + 1,
    left: { type: "leaf", id: "", cells: column(x0) },
    right: columnTree(width - 1, height, x0 + 1),
  };
}

function packIntoBox(shapes: Shape[], width: number, height: number): { target: Shape; placements: Array<{ index: number; x: number; y: number; rotation: Rotation }> } | null {
  if (width < 1 || height < 1 || width > 8 || height > 8) return null;
  const target = rectangle(width, height);
  const placements: Array<{ index: number; x: number; y: number; rotation: Rotation }> = [];
  const occupied = new Set<string>();
  for (let index = 0; index < shapes.length; index += 1) {
    const shape = normalizeShape(shapes[index]);
    let placed = false;
    for (let y = 0; y < height && !placed; y += 1) {
      for (let x = 0; x < width && !placed; x += 1) {
        if (!canPlaceShape(shape, x, y, target, occupied)) continue;
        for (const cell of translateShape(shape, x, y)) occupied.add(cellKey(cell));
        placements.push({ index, x, y, rotation: 0 });
        placed = true;
      }
    }
    if (!placed) return null;
  }
  if (occupied.size !== width * height) return null;
  return { target, placements };
}

function startAlreadyFits(start: Shape, target: Shape, rotationsAllowed: boolean): boolean {
  const turns: Rotation[] = rotationsAllowed ? [0, 90, 180, 270] : [0];
  return turns.some((turn) => shapeEquals(rotateShape(start, turn), target));
}

function replay(node: CutNode, cells: Shape): boolean {
  if (node.type === "leaf") return shapeEquals(cells, node.cells);
  const low = cells.filter((cell) => (node.orientation === "vertical" ? cell.x : cell.y) < node.position);
  const high = cells.filter((cell) => (node.orientation === "vertical" ? cell.x : cell.y) >= node.position);
  if (low.length === 0 || high.length === 0) return false;
  return replay(node.left, low) && replay(node.right, high);
}

function dissect(cells: Shape, pieces: number, rng: SeededRandom, explore = true): CutNode | null {
  if (pieces <= 1) return { type: "leaf", id: "", cells };
  if (cells.length < pieces) return null;
  const options = listBinaryCuts(cells);
  if (options.length === 0) return null;
  const ranked = options
    .slice()
    .sort((a, b) => Math.abs(a.low.length - a.high.length) - Math.abs(b.low.length - b.high.length));
  const picks = rng.shuffle(ranked).slice(0, explore ? Math.min(4, ranked.length) : 1);
  for (const choice of picks) {
    const ideal = clamp(Math.round((pieces * choice.low.length) / cells.length), 1, pieces - 1);
    const shares = explore
      ? [ideal, Math.max(1, ideal - 1), Math.min(pieces - 1, ideal + 1)]
      : [ideal];
    for (const share of shares) {
      if (share < 1 || pieces - share < 1) continue;
      if (share > choice.low.length || pieces - share > choice.high.length) continue;
      const left = dissect(choice.low, share, rng, false);
      if (!left) continue;
      const right = dissect(choice.high, pieces - share, rng, false);
      if (!right) continue;
      return {
        type: "cut",
        orientation: choice.orientation,
        position: choice.position,
        left,
        right,
      };
    }
  }
  return null;
}

function estimatePlacements(shape: Shape, target: Shape, allowRotation: boolean): number {
  const bounds = getBounds(target);
  const piece = getBounds(shape);
  const spots = Math.max(1, (bounds.width - piece.width + 3) * (bounds.height - piece.height + 3));
  const turns = allowRotation && !shapeEquals(shape, rotateShape(shape, 90)) ? 2 : 1;
  return Math.min(20, spots * turns);
}

function nearestWideRectangle(area: number): number | null {
  for (let delta = 0; delta <= 16; delta += 1) {
    const candidates = delta === 0 ? [area] : [area - delta, area + delta];
    for (const candidate of candidates) {
      if (candidate < 4 || candidate > 36) continue;
      if (factorPairs(candidate).some(([width, height]) => width > height)) return candidate;
    }
  }
  return null;
}

function buildTutorial(seed: number, version: string): LevelDefinition {
  const stock: Shape = [0, 1, 2, 3, 4, 5].map((x) => ({ x, y: 0 }));
  const left: Shape = [0, 1, 2].map((x) => ({ x, y: 0 }));
  const right: Shape = [3, 4, 5].map((x) => ({ x, y: 0 }));
  const tree: CutNode = {
    type: "cut",
    orientation: "vertical",
    position: 3,
    left: { type: "leaf", id: "s0", cells: left },
    right: { type: "leaf", id: "s1", cells: right },
  };
  const bar: Shape = [0, 1, 2].map((x) => ({ x, y: 0 }));
  const target: Shape = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 3; x += 1) target.push({ x, y });
  }
  const pieces: Piece[] = [
    { id: "s0", shape: bar, rotation: 0 },
    { id: "s1", shape: bar, rotation: 0 },
  ];
  const placements: Placement[] = [
    { pieceId: "s0", x: 0, y: 0, rotation: 0 },
    { pieceId: "s1", x: 0, y: 1, rotation: 0 },
  ];
  const solution: Solution = {
    cuts: [{ pieceId: "p0", orientation: "vertical", position: 3 }],
    placements,
    pieces,
    tree,
    stock,
  };
  const signature = levelSignature({
    family: "rectangle",
    pieceCount: 2,
    cuts: 1,
    variation: "NORMAL",
    rotationsAllowed: false,
    target,
  });
  return {
    id: `${version}:${seed}:1:NORMAL`,
    seed,
    levelNumber: 1,
    generatorVersion: version,
    difficulty: "EASY",
    difficultyScore: 5,
    targetScore: 5,
    variation: "NORMAL",
    targetShape: target,
    startingPieces: [{ id: "p0", shape: stock, rotation: 0 }],
    allowedCuts: 2,
    rotationsAllowed: false,
    optimalCuts: 1,
    timeLimitSec: null,
    primitiveFamily: "rectangle",
    signature,
    rejectedCandidates: 0,
    kit: kitForScore(5),
    solution,
  };
}

function covers(target: Shape, pieces: Piece[], placements: Placement[]): boolean {
  const keys: string[] = [];
  for (const piece of pieces) {
    const placement = placements.find((item) => item.pieceId === piece.id);
    if (!placement) return false;
    const cells = translateShape(rotateShape(piece.shape, placement.rotation), placement.x, placement.y);
    for (const cell of cells) keys.push(cellKey(cell));
  }
  if (new Set(keys).size !== keys.length) return false;
  if (keys.length !== target.length) return false;
  const targetKeys = new Set(target.map(cellKey));
  return keys.every((key) => targetKeys.has(key));
}

export function validateLevel(level: LevelDefinition): ValidationResult {
  const reasons: string[] = [];
  const target = level.targetShape;
  if (!isConnected(target)) reasons.push("target disconnected");
  if (hasHole(target)) reasons.push("target has a hole");
  if (!replay(level.solution.tree, level.solution.stock)) reasons.push("cut replay failed");
  const leafArea = level.solution.pieces.reduce((sum, piece) => sum + piece.shape.length, 0);
  const startArea = level.startingPieces.reduce((sum, piece) => sum + piece.shape.length, 0);
  if (leafArea !== target.length || startArea !== target.length) reasons.push("area mismatch");
  for (const piece of level.solution.pieces) {
    if (!isConnected(piece.shape) || hasHole(piece.shape)) reasons.push(`piece ${piece.id} invalid`);
  }
  for (const piece of level.startingPieces) {
    if (!isConnected(piece.shape) || hasHole(piece.shape)) reasons.push(`start ${piece.id} invalid`);
  }
  if (!covers(target, level.solution.pieces, level.solution.placements)) reasons.push("placements do not cover");
  if (level.allowedCuts < level.optimalCuts) reasons.push("cut budget below optimal");
  if (level.optimalCuts < 1) reasons.push("puzzle requires no cut");
  if (
    level.startingPieces.length === 1 &&
    startAlreadyFits(level.startingPieces[0].shape, target, level.rotationsAllowed)
  ) {
    reasons.push("uncut block already fills the target");
  }
  if (classifyScore(level.difficultyScore) !== level.difficulty) reasons.push("difficulty class mismatch");
  if (level.variation === "ONE_CUT" && (level.optimalCuts !== 1 || level.allowedCuts !== 1)) {
    reasons.push("one-cut rule broken");
  }
  if (level.variation === "NO_ROTATION") {
    if (level.rotationsAllowed) reasons.push("rotation should be locked");
    if (level.solution.placements.some((placement) => placement.rotation !== 0)) reasons.push("solution rotates");
  }
  if (level.variation === "EXACT_FIT") {
    if (density(target) !== 1) reasons.push("exact fit is not solid");
    if (level.allowedCuts !== level.optimalCuts) reasons.push("exact fit allows spare cuts");
  }
  if (level.variation === "MULTI_BLOCK" && level.startingPieces.length < 2) reasons.push("multi-block starts with one piece");
  if (level.variation === "TIMED" && (level.timeLimitSec === null || level.timeLimitSec < 60)) {
    reasons.push("timed puzzle missing a countdown");
  }
  if (level.generatorVersion.length === 0) reasons.push("missing generator version");
  return { ok: reasons.length === 0, reasons };
}

function tryBuild(
  rng: SeededRandom,
  aimedScore: number,
  variation: Variation,
  input: GenerateInput,
  version: string,
  salt: number,
): LevelDefinition | null {
  const rotationsAllowed = variation !== "NO_ROTATION" && variation !== "EXACT_FIT" && aimedScore >= 22;
  let area = clamp(Math.round(lerp(4, 36, aimedScore / 100)) + ((salt % 5) - 2), 4, 36);
  let cuts = clamp(Math.round(lerp(1, 7, aimedScore / 100)), 1, 7);
  if (variation === "ONE_CUT") cuts = 1;
  if (variation === "MULTI_BLOCK") cuts = Math.max(2, cuts);
  if (variation === "EXACT_FIT") {
    const shaped = nearestWideRectangle(area);
    if (shaped === null) return null;
    area = shaped;
  }
  if (area < cuts + 1) area = Math.min(36, cuts + 1);
  const irregular = variation !== "EXACT_FIT" && (aimedScore >= 18 || salt % 3 === 2);
  let stockResult: { shape: Shape; family: string };
  if (variation === "EXACT_FIT") {
    const pairs = factorPairs(area).filter(([width, height]) => width > height);
    if (pairs.length === 0) return null;
    const [width, height] = rng.pick(pairs);
    stockResult = { shape: rectangle(width, height), family: "rectangle" };
  } else {
    stockResult = buildStock(area, irregular, rng);
  }
  if (stockResult.shape.length < 2) return null;
  const stock = normalizeShape(stockResult.shape);
  if (hasHole(stock) || !isConnected(stock)) return null;
  const exactBounds = getBounds(stock);
  const pieceTarget = Math.min(cuts + 1, stock.length);
  const rawTree = variation === "EXACT_FIT" ? columnTree(exactBounds.width, exactBounds.height) : dissect(stock, pieceTarget, rng);
  if (!rawTree) return null;
  const tree = assignIds(rawTree);
  const leaves = leavesOf(tree);
  if (leaves.length < 2) return null;
  const leafShapes = leaves.map((leaf) => normalizeShape(leaf.cells));
  let rotations: Rotation[] = leafShapes.map(() => 0);
  if (rotationsAllowed) {
    rotations = leafShapes.map((shape) => {
      if (shapeEquals(shape, rotateShape(shape, 90))) return 0;
      return rng.chance(Math.min(0.8, aimedScore / 110)) ? rng.pick([90, 180, 270] as Rotation[]) : 0;
    });
  }
  let layout = variation === "EXACT_FIT" ? packIntoBox(leafShapes, exactBounds.height, exactBounds.width) : packLeaves(leafShapes, rotations, 8);
  if (variation === "EXACT_FIT" && !layout) return null;
  if (!layout) {
    layout = identityLayout(leaves.map((leaf) => leaf.cells));
    rotations = rotations.map(() => 0);
  }
  if (density(layout.target) < 0.55 || hasHole(layout.target) || !isConnected(layout.target)) return null;
  if (variation === "EXACT_FIT" && density(layout.target) !== 1) return null;

  const pieces: Piece[] = leaves.map((leaf, index) => ({
    id: leaf.id,
    shape: leafShapes[index],
    rotation: layout?.placements[index]?.rotation ?? 0,
  }));
  const placements: Placement[] = layout.placements.map((placement) => ({
    pieceId: leaves[placement.index].id,
    x: placement.x,
    y: placement.y,
    rotation: placement.rotation,
  }));
  const totalCuts = countCuts(tree);
  let preapplied = 0;
  if (variation === "MULTI_BLOCK") {
    if (totalCuts < 2) return null;
    preapplied = Math.min(totalCuts - 1, Math.max(1, Math.floor(totalCuts / 2)));
  }
  const opened = openTree(tree, { n: preapplied });
  const startingPieces: Piece[] = opened.map((node, index) => ({
    id: `p${index}`,
    shape: normalizeShape(nodeCells(node)),
    rotation: 0,
  }));
  const optimalCuts = totalCuts - preapplied;
  if (optimalCuts < 1) return null;
  if (startingPieces.length === 1 && startAlreadyFits(startingPieces[0].shape, layout.target, rotationsAllowed)) {
    return null;
  }
  const slack = variation === "ONE_CUT" || variation === "EXACT_FIT" ? 0 : 1;
  const allowedCuts = optimalCuts + slack;
  const rotatedPieces = placements.filter((placement) => placement.rotation !== 0).length;
  const placementChoices = pieces.map((piece) => estimatePlacements(piece.shape, layout.target, rotationsAllowed));
  const difficultyScore = measureDifficulty({
    area: layout.target.length,
    pieceCount: pieces.length,
    cuts: totalCuts,
    target: layout.target,
    rotatedPieces,
    rotationsAllowed,
    cutOptions: listBinaryCuts(stock).length,
    placementChoices,
  });
  const solutionCuts: AxisCut[] = [];
  recordCuts(tree, "p0", solutionCuts);
  const solution: Solution = { cuts: solutionCuts, placements, pieces, tree, stock };
  const signature = levelSignature({
    family: stockResult.family,
    pieceCount: pieces.length,
    cuts: totalCuts,
    variation,
    rotationsAllowed,
    target: layout.target,
  });
  return {
    id: `${version}:${input.seed}:${input.levelNumber}:${variation}`,
    seed: input.seed,
    levelNumber: input.levelNumber,
    generatorVersion: version,
    difficulty: classifyScore(difficultyScore),
    difficultyScore,
    targetScore: aimedScore,
    variation,
    targetShape: layout.target,
    startingPieces,
    allowedCuts,
    rotationsAllowed,
    optimalCuts,
    timeLimitSec: variation === "TIMED" ? timeLimitForScore(difficultyScore) : null,
    primitiveFamily: stockResult.family,
    signature,
    rejectedCandidates: 0,
    kit: kitForScore(difficultyScore),
    solution,
  };
}

export function generateLevel(input: GenerateInput): LevelDefinition {
  const variation = input.variation ?? "NORMAL";
  const version = input.generatorVersion ?? GENERATOR_VERSION;
  if (input.levelNumber === 1 && variation === "NORMAL" && !input.skipTutorial && !input.difficulty) {
    return buildTutorial(input.seed, version);
  }
  const aimed = input.difficulty ? bandMidpoint(input.difficulty) : campaignTargetScore(input.levelNumber);
  const recent = new Set(input.recentSignatures ?? []);
  const rng = new SeededRandom(mixSeed([version, input.seed, input.levelNumber, variation, aimed]));
  let best: LevelDefinition | null = null;
  let lastValid: LevelDefinition | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let rejected = 0;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const relaxScore = attempt >= 26;
    const aimedScore = input.difficulty && attempt >= 24 ? bandMidpoint(input.difficulty) : aimed;
    const candidate = tryBuild(rng, aimedScore, variation, input, version, attempt);
    if (!candidate) {
      rejected += 1;
      continue;
    }
    const validation = validateLevel(candidate);
    if (!validation.ok) {
      rejected += 1;
      continue;
    }
    lastValid = candidate;
    const distance = Math.abs(candidate.difficultyScore - aimed);
    const tierOk = !input.difficulty || candidate.difficulty === input.difficulty;
    const similar = recent.has(candidate.signature);
    if (tierOk && !similar && distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
    if (similar) {
      rejected += 1;
      continue;
    }
    if (!tierOk) {
      rejected += 1;
      continue;
    }
    if (!relaxScore && distance > 14) {
      rejected += 1;
      continue;
    }
    return { ...candidate, rejectedCandidates: rejected };
  }

  if (best && (!input.difficulty || best.difficulty === input.difficulty)) {
    return { ...best, rejectedCandidates: rejected };
  }
  if (lastValid && (!input.difficulty || lastValid.difficulty === input.difficulty)) {
    return { ...lastValid, rejectedCandidates: rejected };
  }
  const fallback = buildTutorial(input.seed, version);
  return {
    ...fallback,
    id: `${version}:${input.seed}:${input.levelNumber}:${variation}`,
    levelNumber: input.levelNumber,
    variation: "NORMAL",
    seed: input.seed,
    rejectedCandidates: rejected + 1,
    targetScore: aimed,
  };
}

export function campaignVariation(seed: number, levelNumber: number): Variation {
  if (levelNumber < 8) return "NORMAL";
  const rng = new SeededRandom(mixSeed(["campaign-variation", seed, levelNumber]));
  if (rng.next() < 0.62) return "NORMAL";
  const options: Variation[] = ["ONE_CUT", "NO_ROTATION", "EXACT_FIT", "TIMED", "MULTI_BLOCK"];
  return options[rng.nextInt(options.length)];
}

export { campaignTargetScore, classifyScore };
