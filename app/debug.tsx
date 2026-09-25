import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Screen } from "../src/components/ui";
import { cellKey, getBounds } from "../src/engine/geometry/shape";
import { validateLevel } from "../src/engine/generator/generateLevel";
import { solvePuzzle } from "../src/engine/solver/solver";
import type { Difficulty, Variation } from "../src/engine/types";
import { loadDebugLevel } from "../src/game/levels";
import { colors } from "../src/theme/theme";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD", "VERY_HARD"];
const VARIATIONS: Variation[] = ["NORMAL", "ONE_CUT", "NO_ROTATION", "EXACT_FIT", "TIMED", "MULTI_BLOCK"];

export default function DebugScreen() {
  const [seedText, setSeedText] = useState("839201");
  const [levelText, setLevelText] = useState("42");
  const [difficulty, setDifficulty] = useState<Difficulty>("HARD");
  const [variation, setVariation] = useState<Variation>("NORMAL");
  const [showSolution, setShowSolution] = useState(true);
  const [report, setReport] = useState("Generate a puzzle to inspect it.");

  function run() {
    const started = Date.now();
    const level = loadDebugLevel({
      seed: Number(seedText) || 1,
      levelNumber: Number(levelText) || 1,
      variation,
      difficulty,
    });
    const validation = validateLevel(level);
    const solverStarted = Date.now();
    const solved = solvePuzzle(
      level.solution.pieces.map((piece) => piece.shape),
      level.targetShape,
      { rotations: level.rotationsAllowed, nodeCap: 8000 },
    );
    const solverMs = Date.now() - solverStarted;
    setReport(
      [
        `id ${level.id}`,
        `score ${level.difficultyScore} ${level.difficulty} aimed ${level.targetScore}`,
        `pieces ${level.solution.pieces.length} cuts ${level.optimalCuts}/${level.allowedCuts}`,
        `family ${level.primitiveFamily}`,
        `valid ${validation.ok ? "yes" : validation.reasons.join(", ")}`,
        `generation ${Date.now() - started} ms`,
        `rejected ${level.rejectedCandidates}`,
        `solver ${solved.solved ? "solved" : "unsolved"} in ${solverMs} ms, nodes ${solved.moves}`,
        showSolution ? `solution pieces ${level.solution.placements.length}` : "solution hidden",
      ].join("\n"),
    );
    return { level, showSolution };
  }

  const [preview, setPreview] = useState<ReturnType<typeof run> | null>(null);

  return (
    <Screen>
      <Text style={styles.title}>Generator</Text>
      <TextInput style={styles.input} value={seedText} onChangeText={setSeedText} keyboardType="number-pad" placeholder="Seed" />
      <TextInput style={styles.input} value={levelText} onChangeText={setLevelText} keyboardType="number-pad" placeholder="Level" />
      <ScrollView horizontal contentContainerStyle={styles.pills}>
        {DIFFICULTIES.map((item) => (
          <Text key={item} onPress={() => setDifficulty(item)} style={[styles.pill, difficulty === item && styles.pillOn]}>{item}</Text>
        ))}
      </ScrollView>
      <ScrollView horizontal contentContainerStyle={styles.pills}>
        {VARIATIONS.map((item) => (
          <Text key={item} onPress={() => setVariation(item)} style={[styles.pill, variation === item && styles.pillOn]}>{item}</Text>
        ))}
      </ScrollView>
      <Button label="Regenerate" onPress={() => setPreview(run())} />
      <Button label={showSolution ? "Hide solution" : "Show solution"} tone="cream" onPress={() => setShowSolution((value) => !value)} />
      <Text style={styles.report}>{report}</Text>
      {preview ? <MiniGrid levelTarget={preview.level.targetShape} solution={showSolution ? preview.level.solution : null} /> : null}
      <Button label="Back" tone="cream" onPress={() => router.back()} />
    </Screen>
  );
}

function MiniGrid({
  levelTarget,
  solution,
}: {
  levelTarget: { x: number; y: number }[];
  solution: { placements: { x: number; y: number; rotation: 0 | 90 | 180 | 270; pieceId: string }[]; pieces: { id: string; shape: { x: number; y: number }[] }[] } | null;
}) {
  const bounds = getBounds(levelTarget);
  const cell = 16;
  const keys = new Set(levelTarget.map(cellKey));
  return (
    <View style={{ width: bounds.width * cell, height: bounds.height * cell, marginVertical: 8 }}>
      {[...keys].map((key) => {
        const [x, y] = key.split(",").map(Number);
        return <View key={key} style={[styles.mini, { left: (x - bounds.minX) * cell, top: (y - bounds.minY) * cell }]} />;
      })}
      {solution ? <Text style={styles.note}>Solution overlay is on for this inspector only.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "900", color: colors.ink },
  input: { backgroundColor: colors.cream, borderRadius: 12, padding: 10, marginTop: 8, fontWeight: "700" },
  pills: { gap: 8, paddingVertical: 8 },
  pill: { backgroundColor: colors.cream, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: "hidden", fontWeight: "800" },
  pillOn: { backgroundColor: colors.accent },
  report: { color: colors.ink, marginVertical: 8, fontWeight: "600" },
  mini: { position: "absolute", width: 14, height: 14, borderRadius: 3, backgroundColor: colors.wood },
  note: { color: colors.inkSoft, marginTop: 4 },
});
