import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button, Screen } from "../src/components/ui";
import { colors } from "../src/theme/theme";

const STEPS = [
  { title: "Cut a block", copy: "Drag across a piece to split it." },
  { title: "Move the pieces", copy: "Switch to Move and drag each piece." },
  { title: "Fill the target", copy: "Snap every piece into the tray." },
];

export default function HowToScreen() {
  return (
    <Screen>
      <Text style={styles.kicker}>How to play</Text>
      <Text style={styles.title}>Three moves</Text>
      <View style={styles.list}>
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.row}>
            <Text style={styles.index}>{index + 1}</Text>
            <View style={styles.copy}>
              <Text style={styles.step}>{step.title}</Text>
              <Text style={styles.detail}>{step.copy}</Text>
            </View>
          </View>
        ))}
      </View>
      <Button label="Continue" onPress={() => router.replace("/home")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.inkSoft, fontWeight: "800", letterSpacing: 0.4 },
  title: { fontSize: 36, fontWeight: "900", color: colors.ink, marginBottom: 16 },
  list: { flex: 1, gap: 12 },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: 20,
    padding: 14,
  },
  index: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    textAlign: "center",
    lineHeight: 36,
    backgroundColor: colors.accent,
    color: colors.cream,
    fontWeight: "900",
    fontSize: 18,
  },
  copy: { flex: 1 },
  step: { fontSize: 18, fontWeight: "800", color: colors.ink },
  detail: { color: colors.inkSoft, marginTop: 2, fontWeight: "600" },
});
