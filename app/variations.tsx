import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button, Screen } from "../src/components/ui";
import type { Variation } from "../src/engine/types";
import { useProgress } from "../src/game/progressStore";
import { colors } from "../src/theme/theme";

const MODES: Array<{ id: Variation; name: string; copy: string }> = [
  { id: "NORMAL", name: "Normal", copy: "Standard rules" },
  { id: "ONE_CUT", name: "One Cut", copy: "Solve using only 1 cut" },
  { id: "NO_ROTATION", name: "No Rotation", copy: "Pieces cannot be rotated" },
  { id: "EXACT_FIT", name: "Exact Fit", copy: "No empty cells" },
  { id: "TIMED", name: "Timed", copy: "Solve before time runs out" },
  { id: "MULTI_BLOCK", name: "Multi Block", copy: "Start with multiple blocks" },
];

export default function VariationsScreen() {
  const levels = useProgress((state) => state.variationLevel);
  return (
    <Screen>
      <Text style={styles.title}>Level Variations</Text>
      {MODES.map((mode) => (
        <View key={mode.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{mode.name}</Text>
            <Text style={styles.copy}>{mode.copy} · level {levels[mode.id]}</Text>
          </View>
          <Button
            label="Play"
            onPress={() => router.push({ pathname: "/intro", params: { source: "variation", variation: mode.id, level: String(levels[mode.id]) } })}
          />
        </View>
      ))}
      <Button label="Back" tone="cream" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: colors.ink, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  name: { fontWeight: "800", color: colors.ink, fontSize: 16 },
  copy: { color: colors.inkSoft },
});
