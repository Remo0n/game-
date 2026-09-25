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
import { campaignPlan, fitsPlan } from "./progression";
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

function recordCuts(
  node: CutNode,
  pieceId: string,
  acc: AxisCut[],
  local = false,
): void {
  if (node.type === "leaf") return;
  const bounds = getBounds(nodeCells(node));
  const position =
    node.position -
    (local ? (node.orientation === "vertical" ? bounds.minX : bounds.minY) : 0);
  acc.push({ pieceId, orientation: node.orientation, position });
  recordCuts(node.left, `${pieceId}L`, acc, local);
  recordCuts(node.right, `${pieceId}R`, acc, local);
}

function columnTree(width: number, height: number, x0 = 0): CutNode {
  const column = (x: number): Shape =>
    Array.from({ length: height }, (_, y) => ({ x, y }));
  if (width <= 1) return { type: "leaf", id: "", cells: column(x0) };
  return {
    type: "cut",
    orientation: "vertical",
    position: x0 + 1,
    left: { type: "leaf", id: "", cells: column(x0) },
    right: columnTree(width - 1, height, x0 + 1),
  };
}

function packIntoBox(
  shapes: Shape[],
  width: number,
  height: number,
): {
  target: Shape;
  placements: Array<{
    index: number;
    x: number;
    y: number;
    rotation: Rotation;
  }>;
} | null {
  if (width < 1 || height < 1 || width > 8 || height > 8) return null;
  const target = rectangle(width, height);
  const placements: Array<{
    index: number;
    x: number;
    y: number;
    rotation: Rotation;
  }> = [];
  const occupied = new Set<string>();
  for (let index = 0; index < shapes.length; index += 1) {
    const shape = normalizeShape(shapes[index]);
    let placed = false;
    for (let y = 0; y < height && !placed; y += 1) {
      for (let x = 0; x < width && !placed; x += 1) {
        if (!canPlaceShape(shape, x, y, target, occupied)) continue;
        for (const cell of translateShape(shape, x, y))
          occupied.add(cellKey(cell));
        placements.push({ index, x, y, rotation: 0 });
        placed = true;
      }
    }
    if (!placed) return null;
  }
  if (occupied.size !== width * height) return null;
  return { target, placements };
}

function startAlreadyFits(
  start: Shape,
  target: Shape,
  rotationsAllowed: boolean,
): boolean {
  const turns: Rotation[] = rotationsAllowed ? [0, 90, 180, 270] : [0];
  return turns.some((turn) => shapeEquals(rotateShape(start, turn), target));
}

function replay(node: CutNode, cells: Shape): boolean {
  if (node.type === "leaf") return shapeEquals(cells, node.cells);
  const low = cells.filter(
    (cell) =>
      (node.orientation === "vertical" ? cell.x : cell.y) < node.position,
  );
  const high = cells.filter(
    (cell) =>
      (node.orientation === "vertical" ? cell.x : cell.y) >= node.position,
  );
  if (low.length === 0 || high.length === 0) return false;
  return replay(node.left, low) && replay(node.right, high);
}

function dissect(
  cells: Shape,
  pieces: number,
  rng: SeededRandom,
  explore = true,
): CutNode | null {
  if (pieces <= 1) return { type: "leaf", id: "", cells };
  if (cells.length < pieces) return null;
  const options = listBinaryCuts(cells);
  if (options.length === 0) return null;
  const ranked = options
    .slice()
    .sort(
      (a, b) =>
        Math.abs(a.low.length - a.high.length) -
        Math.abs(b.low.length - b.high.length),
    );
  const picks = rng
    .shuffle(ranked)
    .slice(0, explore ? Math.min(4, ranked.length) : 1);
  for (const choice of picks) {
    const ideal = clamp(
      Math.round((pieces * choice.low.length) / cells.length),
      1,
      pieces - 1,
    );
    const shares = explore
      ? [ideal, Math.max(1, ideal - 1), Math.min(pieces - 1, ideal + 1)]
      : [ideal];
    for (const share of shares) {
      if (share < 1 || pieces - share < 1) continue;
      if (share > choice.low.length || pieces - share > choice.high.length)
        continue;
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

function estimatePlacements(
  shape: Shape,
  target: Shape,
  allowRotation: boolean,
): number {
  const bounds = getBounds(target);
  const piece = getBounds(shape);
  const spots = Math.max(
    1,
    (bounds.width - piece.width + 3) * (bounds.height - piece.height + 3),
  );
  const turns =
    allowRotation && !shapeEquals(shape, rotateShape(shape, 90)) ? 2 : 1;
  return Math.min(20, spots * turns);
}

function nearestWideRectangle(area: number): number | null {
  for (let delta = 0; delta <= 16; delta += 1) {
    const candidates = delta === 0 ? [area] : [area - delta, area + delta];
    for (const candidate of candidates) {
      if (candidate < 4 || candidate > 36) continue;
      if (factorPairs(candidate).some(([width, height]) => width > height))
        return candidate;
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

function covers(
  target: Shape,
  pieces: Piece[],
  placements: Placement[],
): boolean {
  const keys: string[] = [];
  for (const piece of pieces) {
    const placement = placements.find((item) => item.pieceId === piece.id);
    if (!placement) return false;
    const cells = translateShape(
      rotateShape(piece.shape, placement.rotation),
      placement.x,
      placement.y,
    );
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
  if (!replay(level.solution.tree, level.solution.stock))
    reasons.push("cut replay failed");
  const leafArea = level.solution.pieces.reduce(
    (sum, piece) => sum + piece.shape.length,
    0,
  );
  const startArea = level.startingPieces.reduce(
    (sum, piece) => sum + piece.shape.length,
    0,
  );
  if (leafArea !== target.length || startArea !== target.length)
    reasons.push("area mismatch");
  for (const piece of level.solution.pieces) {
    if (!isConnected(piece.shape) || hasHole(piece.shape))
      reasons.push(`piece ${piece.id} invalid`);
  }
  for (const piece of level.startingPieces) {
    if (!isConnected(piece.shape) || hasHole(piece.shape))
      reasons.push(`start ${piece.id} invalid`);
  }
  if (!covers(target, level.solution.pieces, level.solution.placements))
    reasons.push("placements do not cover");
  if (level.allowedCuts < level.optimalCuts)
    reasons.push("cut budget below optimal");
  if (level.optimalCuts < 1) reasons.push("puzzle requires no cut");
  if (
    level.startingPieces.length === 1 &&
    startAlreadyFits(
      level.startingPieces[0].shape,
      target,
      level.rotationsAllowed,
    )
  ) {
    reasons.push("uncut block already fills the target");
  }
  if (classifyScore(level.difficultyScore) !== level.difficulty)
    reasons.push("difficulty class mismatch");
  if (
    level.variation === "ONE_CUT" &&
    (level.optimalCuts !== 1 || level.allowedCuts !== 1)
  ) {
    reasons.push("one-cut rule broken");
  }
  if (level.variation === "NO_ROTATION") {
    if (level.rotationsAllowed) reasons.push("rotation should be locked");
    if (level.solution.placements.some((placement) => placement.rotation !== 0))
      reasons.push("solution rotates");
  }
  if (level.variation === "EXACT_FIT") {
    if (density(target) !== 1) reasons.push("exact fit is not solid");
    if (level.allowedCuts !== level.optimalCuts)
      reasons.push("exact fit allows spare cuts");
  }
  if (level.variation === "MULTI_BLOCK" && level.startingPieces.length < 2)
    reasons.push("multi-block starts with one piece");
  if (
    level.variation === "TIMED" &&
    (level.timeLimitSec === null || level.timeLimitSec < 60)
  ) {
    reasons.push("timed puzzle missing a countdown");
  }
  if (level.generatorVersion.length === 0)
    reasons.push("missing generator version");
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
  const plan = input.progression;
  if (plan && variation === "EXACT_FIT")
    return buildExactFit(rng, input, version);
  const rotationsAllowed = plan
    ? plan.rotationsAllowed
    : variation !== "NO_ROTATION" &&
      variation !== "EXACT_FIT" &&
      aimedScore >= 22;
  let area = clamp(
    Math.round(lerp(4, 36, aimedScore / 100)) + ((salt % 5) - 2),
    4,
    36,
  );
  let cuts = clamp(Math.round(lerp(1, 7, aimedScore / 100)), 1, 7);
  if (plan) {
    area = rng.int(plan.minArea, plan.maxArea);
    cuts = rng.int(plan.minCuts, plan.maxCuts);
    if (variation === "MULTI_BLOCK") cuts += 1;
  }
  if (variation === "ONE_CUT") cuts = 1;
  if (variation === "MULTI_BLOCK") cuts = Math.max(2, cuts);
  if (variation === "EXACT_FIT") {
    const shaped = nearestWideRectangle(area);
    if (shaped === null) return null;
    area = shaped;
  }
  if (area < cuts + 1) area = Math.min(36, cuts + 1);
  const irregular =
    variation !== "EXACT_FIT" &&
    (plan ? plan.irregularStock : aimedScore >= 18 || salt % 3 === 2);
  let stockResult: { shape: Shape; family: string };
  if (variation === "EXACT_FIT") {
    const pairs = factorPairs(area).filter(
      ([width, height]) =>
        width > height &&
        (!plan || (width - 1 >= plan.minCuts && width - 1 <= plan.maxCuts)),
    );
    if (pairs.length === 0) return null;
    const [width, height] = rng.pick(pairs);
    stockResult = { shape: rectangle(width, height), family: "rectangle" };
  } else if (plan && !irregular) {
    const pairs = factorPairs(area);
    if (!pairs.length) return null;
    const [width, height] = rng.pick(pairs);
    stockResult = { shape: rectangle(width, height), family: "rectangle" };
  } else {
    stockResult = buildStock(area, irregular, rng);
  }
  if (stockResult.shape.length < 2) return null;
  if (
    plan &&
    (stockResult.shape.length < plan.minArea ||
      stockResult.shape.length > plan.maxArea ||
      (!plan.irregularStock && density(stockResult.shape) < 1))
  )
    return null;
  const stock = normalizeShape(stockResult.shape);
  if (hasHole(stock) || !isConnected(stock)) return null;
  const exactBounds = getBounds(stock);
  const pieceTarget = Math.min(cuts + 1, stock.length);
  const rawTree =
    variation === "EXACT_FIT"
      ? columnTree(exactBounds.width, exactBounds.height)
      : dissect(stock, pieceTarget, rng);
  if (!rawTree) return null;
  const tree = assignIds(rawTree);
  const leaves = leavesOf(tree);
  if (leaves.length < 2) return null;
  const leafShapes = leaves.map((leaf) => normalizeShape(leaf.cells));
  let rotations: Rotation[] = leafShapes.map(() => 0);
  if (rotationsAllowed) {
    let rotated = 0;
    rotations = leafShapes.map((shape) => {
      if (plan && rotated >= plan.maxRotatedPieces) return 0;
      if (shapeEquals(shape, rotateShape(shape, 90))) return 0;
      if (!rng.chance(Math.min(0.8, aimedScore / 110))) return 0;
      rotated += 1;
      return rng.pick([90, 180, 270] as Rotation[]);
    });
  }
  let layout =
    variation === "EXACT_FIT"
      ? packIntoBox(leafShapes, exactBounds.height, exactBounds.width)
      : packLeaves(leafShapes, rotations, 8);
  if (variation === "EXACT_FIT" && !layout) return null;
  if (!layout) {
    layout = identityLayout(leaves.map((leaf) => leaf.cells));
    rotations = rotations.map(() => 0);
  }
  if (plan && irregularityScore(layout.target) > plan.maxIrregularity)
    return null;
  if (
    density(layout.target) < 0.55 ||
    hasHole(layout.target) ||
    !isConnected(layout.target)
  )
    return null;
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
    preapplied = plan
      ? 1
      : Math.min(totalCuts - 1, Math.max(1, Math.floor(totalCuts / 2)));
  }
  const opened = openTree(tree, { n: preapplied });
  const startingPieces: Piece[] = opened.map((node, index) => ({
    id: `p${index}`,
    shape: normalizeShape(nodeCells(node)),
    rotation: 0,
  }));
  const optimalCuts = totalCuts - preapplied;
  if (optimalCuts < 1) return null;
  if (
    startingPieces.length === 1 &&
    startAlreadyFits(startingPieces[0].shape, layout.target, rotationsAllowed)
  ) {
    return null;
  }
  const slack = plan
    ? plan.extraCuts
    : variation === "ONE_CUT" || variation === "EXACT_FIT"
      ? 0
      : 1;
  const allowedCuts = optimalCuts + slack;
  const rotatedPieces = placements.filter(
    (placement) => placement.rotation !== 0,
  ).length;
  const placementChoices = pieces.map((piece) =>
    (plan ? countLegalPlacements : estimatePlacements)(
      piece.shape,
      layout.target,
      rotationsAllowed,
    ),
  );
  const difficultyScore = measureDifficulty({
    area: layout.target.length,
    pieceCount: pieces.length,
    cuts: plan ? optimalCuts : totalCuts,
    target: layout.target,
    rotatedPieces,
    rotationsAllowed,
    cutOptions: listBinaryCuts(stock).length,
    placementChoices,
  });
  const solutionCuts: AxisCut[] = [];
  if (plan)
    opened.forEach((node, i) => recordCuts(node, `p${i}`, solutionCuts, true));
  else recordCuts(tree, "p0", solutionCuts);
  const solution: Solution = {
    cuts: solutionCuts,
    placements,
    pieces,
    tree,
    stock,
  };
  const signature = levelSignature({
    family: stockResult.family,
    pieceCount: pieces.length,
    cuts: totalCuts,
    variation,
    rotationsAllowed,
    target: layout.target,
  });
  return {
    id: `${version}${plan ? `:${plan.revision}` : ""}:${input.seed}:${input.levelNumber}:${variation}`,
    seed: input.seed,
    levelNumber: input.levelNumber,
    generatorVersion: version,
    difficulty: classifyScore(difficultyScore),
    difficultyScore,
    targetScore: aimedScore,
    ...(plan ? { progression: plan } : {}),
    variation,
    targetShape: layout.target,
    startingPieces,
    allowedCuts,
    rotationsAllowed,
    optimalCuts,
    timeLimitSec:
      variation === "TIMED" ? timeLimitForScore(difficultyScore) : null,
    primitiveFamily: stockResult.family,
    signature,
    rejectedCandidates: 0,
    kit: kitForScore(difficultyScore),
    solution,
  };
}

export function generateLevel(input: GenerateInput): LevelDefinition {
  const plan = input.progression;
  if (plan) return generateProgressionLevel(input);
  const variation = input.variation ?? "NORMAL";
  const version = input.generatorVersion ?? GENERATOR_VERSION;
  if (
    input.levelNumber === 1 &&
    variation === "NORMAL" &&
    !input.skipTutorial &&
    !input.difficulty
  ) {
    return buildTutorial(input.seed, version);
  }
  const aimed = input.difficulty
    ? bandMidpoint(input.difficulty)
    : campaignTargetScore(input.levelNumber);
  const recent = new Set(input.recentSignatures ?? []);
  const rng = new SeededRandom(
    mixSeed([version, input.seed, input.levelNumber, variation, aimed]),
  );
  let best: LevelDefinition | null = null;
  let lastValid: LevelDefinition | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let rejected = 0;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const relaxScore = attempt >= 26;
    const aimedScore =
      input.difficulty && attempt >= 24
        ? bandMidpoint(input.difficulty)
        : aimed;
    const candidate = tryBuild(
      rng,
      aimedScore,
      variation,
      input,
      version,
      attempt,
    );
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
    const tierOk =
      !input.difficulty || candidate.difficulty === input.difficulty;
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
  if (
    lastValid &&
    (!input.difficulty || lastValid.difficulty === input.difficulty)
  ) {
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

export function campaignVariation(
  _seed: number,
  levelNumber: number,
): Variation {
  return campaignPlan(levelNumber).variation;
}

/** Actual legal positions in the empty tray, including only distinct orientations. */
export function countLegalPlacements(
  shape: Shape,
  target: Shape,
  allowRotation: boolean,
): number {
  const targetKeys = new Set(target.map(cellKey));
  const bounds = getBounds(target);
  const seen = new Set<string>();
  let count = 0;
  for (const turn of (allowRotation ? [0, 90, 180, 270] : [0]) as Rotation[]) {
    const oriented = normalizeShape(rotateShape(shape, turn));
    const key = oriented.map(cellKey).join(";");
    if (seen.has(key)) continue;
    seen.add(key);
    const piece = getBounds(oriented);
    for (let y = bounds.minY; y <= bounds.maxY - piece.height + 1; y++) {
      for (let x = bounds.minX; x <= bounds.maxX - piece.width + 1; x++) {
        if (
          oriented.every((cell) =>
            targetKeys.has(`${cell.x + x},${cell.y + y}`),
          )
        )
          count++;
      }
    }
  }
  return count;
}

/** Exact two-piece packing check, used to reject obvious difficulty shortcuts. */
export function canPackPair(
  left: Shape,
  right: Shape,
  target: Shape,
  rotations: boolean,
): boolean {
  const turns = (rotations ? [0, 90, 180, 270] : [0]) as Rotation[];
  const key = (shape: Shape) => normalizeShape(shape).map(cellKey).join(";");
  const rightKeys = new Set(turns.map((turn) => key(rotateShape(right, turn))));
  const seen = new Set<string>();
  const targetKeys = new Set(target.map(cellKey));
  const bounds = getBounds(target);
  for (const turn of turns) {
    const shape = normalizeShape(rotateShape(left, turn)),
      signature = key(shape);
    if (seen.has(signature)) continue;
    seen.add(signature);
    const box = getBounds(shape);
    for (let y = bounds.minY; y <= bounds.maxY - box.height + 1; y++)
      for (let x = bounds.minX; x <= bounds.maxX - box.width + 1; x++) {
        const occupied = new Set(
          shape.map((cell) => `${cell.x + x},${cell.y + y}`),
        );
        if ([...occupied].some((cell) => !targetKeys.has(cell))) continue;
        const rest = target.filter((cell) => !occupied.has(cellKey(cell)));
        if (rest.length === right.length && rightKeys.has(key(rest)))
          return true;
      }
  }
  return false;
}
export function hasOneBinaryCutSolution(
  stock: Shape,
  target: Shape,
  rotations: boolean,
): boolean {
  return listBinaryCuts(stock).some((cut) =>
    canPackPair(
      normalizeShape(cut.low),
      normalizeShape(cut.high),
      target,
      rotations,
    ),
  );
}
function hasObviousShortcut(level: LevelDefinition): boolean {
  const plan = level.progression!;
  if (level.startingPieces.length === 2)
    return canPackPair(
      level.startingPieces[0].shape,
      level.startingPieces[1].shape,
      level.targetShape,
      level.rotationsAllowed,
    );
  return (
    plan.minCuts >= 2 &&
    hasOneBinaryCutSolution(
      level.startingPieces[0].shape,
      level.targetShape,
      level.rotationsAllowed,
    )
  );
}

function guillotineTree(
  nodes: Array<{ id: string; cells: Shape }>,
): CutNode | null {
  if (nodes.length === 1) return { type: "leaf", ...nodes[0] };
  const stock = nodes.flatMap((n) => n.cells);
  for (const cut of listBinaryCuts(stock)) {
    const low: typeof nodes = [],
      high: typeof nodes = [];
    let crossing = false;
    for (const node of nodes) {
      const sides = node.cells.map(
        (c) => (cut.orientation === "vertical" ? c.x : c.y) < cut.position,
      );
      if (sides.every(Boolean)) low.push(node);
      else if (sides.every((v) => !v)) high.push(node);
      else {
        crossing = true;
        break;
      }
    }
    if (crossing || !low.length || !high.length) continue;
    const left = guillotineTree(low),
      right = guillotineTree(high);
    if (left && right)
      return {
        type: "cut",
        orientation: cut.orientation,
        position: cut.position,
        left,
        right,
      };
  }
  return null;
}

function buildExactFit(
  rng: SeededRandom,
  input: GenerateInput,
  version: string,
): LevelDefinition | null {
  const plan = input.progression!;
  const areas: Array<[number, number]> = [];
  for (let area = plan.minArea; area <= plan.maxArea; area++) {
    areas.push(
      ...factorPairs(area).filter(
        ([w, h]) => w >= 2 && h >= 2 && w >= h && w / h <= 2,
      ),
    );
  }
  if (!areas.length) return null;
  const [width, height] = rng.pick(areas);
  const target = rectangle(width, height);
  const count = rng.int(plan.minCuts, plan.maxCuts) + 1;
  const targetTree = dissect(target, count, rng);
  if (!targetTree) return null;
  const leaves = rng.shuffle(leavesOf(assignIds(targetTree)));
  const shapes = leaves.map((leaf) => normalizeShape(leaf.cells));
  const layout = packLeaves(
    shapes,
    shapes.map(() => 0),
  );
  if (!layout || shapeEquals(layout.target, target)) return null;
  const stock = layout.target;
  const nodes = shapes.map((shape, i) => ({
    id: `s${i}`,
    cells: translateShape(
      shape,
      layout.placements[i].x,
      layout.placements[i].y,
    ),
  }));
  const tree = guillotineTree(nodes);
  if (!tree) return null;
  const pieces: Piece[] = shapes.map((shape, i) => ({
    id: `s${i}`,
    shape,
    rotation: 0,
  }));
  const placements: Placement[] = leaves.map((leaf, i) => {
    const bounds = getBounds(leaf.cells);
    return { pieceId: `s${i}`, x: bounds.minX, y: bounds.minY, rotation: 0 };
  });
  const cuts: AxisCut[] = [];
  recordCuts(tree, "p0", cuts, true);
  const difficultyScore = measureDifficulty({
    area: target.length,
    pieceCount: count,
    cuts: count - 1,
    target: stock,
    rotatedPieces: 0,
    rotationsAllowed: false,
    cutOptions: listBinaryCuts(stock).length,
    placementChoices: shapes.map((shape) =>
      countLegalPlacements(shape, target, false),
    ),
  });
  return {
    id: `${version}:${plan.revision}:${input.seed}:${input.levelNumber}:EXACT_FIT`,
    seed: input.seed,
    levelNumber: input.levelNumber,
    generatorVersion: version,
    difficulty: classifyScore(difficultyScore),
    difficultyScore,
    targetScore: plan.targetScore,
    variation: "EXACT_FIT",
    targetShape: target,
    startingPieces: [{ id: "p0", shape: stock, rotation: 0 }],
    allowedCuts: count - 1,
    rotationsAllowed: false,
    optimalCuts: count - 1,
    timeLimitSec: null,
    primitiveFamily: "repacked-rectangle",
    signature: levelSignature({
      family: "repacked-rectangle",
      pieceCount: count,
      cuts: count - 1,
      variation: "EXACT_FIT",
      rotationsAllowed: false,
      target: stock,
    }),
    rejectedCandidates: 0,
    progression: plan,
    kit: kitForScore(difficultyScore),
    solution: { cuts, placements, pieces, tree, stock },
  };
}

function buildOpeningLesson(
  input: GenerateInput,
  version: string,
): LevelDefinition | null {
  const n = input.levelNumber,
    plan = input.progression!;
  if (
    plan.revision !== "curriculum-2" ||
    ![1, 2, 3, 4, 5, 6, 11, 16].includes(n)
  )
    return null;
  const verticalStock = n === 2;
  const length =
    n === 3 || n === 4 || n === 11 ? 8 : n === 2 || n === 5 ? 4 : 6;
  const first = n === 4 ? 3 : n === 6 ? 2 : length / 2;
  const stock = rectangle(
    verticalStock ? 1 : length,
    verticalStock ? length : 1,
  );
  const coordinate = (c: { x: number; y: number }) =>
    verticalStock ? c.y : c.x;
  const left = stock.filter((c) => coordinate(c) < first),
    right = stock.filter((c) => coordinate(c) >= first);
  let tree: CutNode = {
    type: "cut",
    orientation: verticalStock ? "horizontal" : "vertical",
    position: first,
    left: { type: "leaf", id: "s0", cells: left },
    right: { type: "leaf", id: "s1", cells: right },
  };
  if (n === 6)
    tree.right = {
      type: "cut",
      orientation: "vertical",
      position: 4,
      left: { type: "leaf", id: "s1", cells: right.filter((c) => c.x < 4) },
      right: { type: "leaf", id: "s2", cells: right.filter((c) => c.x >= 4) },
    };
  const leaves = leavesOf(tree);
  const pieces: Piece[] = leaves.map((leaf) => ({
    id: leaf.id,
    shape: normalizeShape(leaf.cells),
    rotation: 0,
  }));
  const placements: Placement[] = pieces.map((piece, i) => ({
    pieceId: piece.id,
    x: verticalStock || n === 11 ? i : 0,
    y: verticalStock || n === 11 ? 0 : i,
    rotation: n === 11 ? 90 : 0,
  }));
  const target = normalizeShape(
    pieces.flatMap((piece, i) =>
      translateShape(
        rotateShape(piece.shape, placements[i].rotation),
        placements[i].x,
        placements[i].y,
      ),
    ),
  );
  const cuts: AxisCut[] = [];
  recordCuts(tree, "p0", cuts, true);
  const difficultyScore = measureDifficulty({
    area: target.length,
    pieceCount: pieces.length,
    cuts: cuts.length,
    target,
    rotatedPieces: n === 11 ? 2 : 0,
    rotationsAllowed: plan.rotationsAllowed,
    cutOptions: listBinaryCuts(stock).length,
    placementChoices: pieces.map((p) =>
      countLegalPlacements(p.shape, target, plan.rotationsAllowed),
    ),
  });
  return {
    id: `${version}:${plan.revision}:${input.seed}:${n}:${plan.variation}`,
    seed: input.seed,
    levelNumber: n,
    generatorVersion: version,
    difficulty: classifyScore(difficultyScore),
    difficultyScore,
    targetScore: plan.targetScore,
    variation: plan.variation,
    targetShape: target,
    startingPieces: [{ id: "p0", shape: stock, rotation: 0 }],
    allowedCuts: cuts.length + plan.extraCuts,
    rotationsAllowed: plan.rotationsAllowed,
    optimalCuts: cuts.length,
    timeLimitSec: null,
    primitiveFamily: "lesson",
    signature: levelSignature({
      family: "lesson",
      pieceCount: pieces.length,
      cuts: cuts.length,
      variation: plan.variation,
      rotationsAllowed: plan.rotationsAllowed,
      target,
    }),
    rejectedCandidates: 0,
    progression: plan,
    kit: kitForScore(difficultyScore),
    solution: { cuts, placements, pieces, tree, stock },
  };
}

function generateProgressionLevel(input: GenerateInput): LevelDefinition {
  const plan = input.progression!;
  const version = input.generatorVersion ?? GENERATOR_VERSION;
  const lesson = buildOpeningLesson(input, version);
  if (lesson) return lesson;
  const rng = new SeededRandom(
    mixSeed([
      version,
      plan.revision,
      input.seed,
      input.levelNumber,
      plan.variation,
    ]),
  );
  let best: LevelDefinition | null = null;
  let distance = Infinity;
  let rejected = 0;
  // A bounded pool chooses the closest fit, rather than the first loose match.
  for (let attempt = 0; attempt < 192; attempt++) {
    if (attempt >= 96 && distance <= 6) break;
    const candidate = tryBuild(
      rng,
      plan.targetScore,
      plan.variation,
      input,
      version,
      attempt,
    );
    if (
      !candidate ||
      !fitsPlan(candidate, plan) ||
      !validateLevel(candidate).ok
    ) {
      rejected++;
      continue;
    }
    const gap = Math.abs(candidate.difficultyScore - plan.targetScore);
    if (gap < distance) {
      if (hasObviousShortcut(candidate)) {
        rejected++;
        continue;
      }
      best = candidate;
      distance = gap;
    }
    if (gap <= 2 && attempt >= 15) break;
  }
  if (!best)
    throw new Error(
      `No valid curriculum puzzle for level ${input.levelNumber} (${plan.variation}).`,
    );
  return { ...best, rejectedCandidates: rejected };
}

export { campaignTargetScore, classifyScore };
