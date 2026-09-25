import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button, Screen } from "../src/components/ui";
import { useProgress } from "../src/game/progressStore";
import { colors } from "../src/theme/theme";

const TOOLS = [
  { name: "Laser Cut", key: "laser" as const, copy: "Cut in any direction. One charge splits cells on either side of the line." },
  { name: "Line Split", key: "lineSplit" as const, copy: "Auto split a selected piece along a straight seam." },
  { name: "Rotate Piece", key: "rotate" as const, copy: "Turn a piece when the puzzle has locked rotation." },
  { name: "Extra Cut", key: "extraCut" as const, copy: "Add one more cut to this attempt." },
];

export default function ToolsScreen() {
  const wallet = useProgress((state) => state.wallet);
  return (
    <Screen>
      <Text style={styles.title}>Special Tools</Text>
      <Text style={styles.sub}>Charges are never required. Three-star clears and the weekly reward fill a wallet of 3.</Text>
      {TOOLS.map((tool) => (
        <View key={tool.key} style={styles.card}>
          <Text style={styles.name}>{tool.name}</Text>
          <Text style={styles.count}>{wallet[tool.key]} stored</Text>
          <Text style={styles.sub}>{tool.copy}</Text>
        </View>
      ))}
      <Button label="Back" tone="cream" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: colors.ink },
  sub: { color: colors.inkSoft, marginTop: 4, marginBottom: 8 },
  card: { backgroundColor: colors.cream, borderRadius: 18, padding: 12, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "800", color: colors.ink },
  count: { color: colors.accentDeep, fontWeight: "800" },
});
