import { router } from "expo-router";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Button, Screen } from "../src/components/ui";
import { useProgress } from "../src/game/progressStore";
import { colors } from "../src/theme/theme";

export default function SettingsScreen() {
  const sound = useProgress((state) => state.soundEnabled);
  const haptics = useProgress((state) => state.hapticsEnabled);
  const setSound = useProgress((state) => state.setSound);
  const setHaptics = useProgress((state) => state.setHaptics);
  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Sound</Text>
        <Switch value={sound} onValueChange={setSound} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Haptics</Text>
        <Switch value={haptics} onValueChange={setHaptics} />
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>How to play</Text>
        <Text style={styles.copy}>Drag across a block to cut it. Switch to Move, then drag each piece onto the matching target cells. It snaps when the fit is real.</Text>
      </View>
      <Button label="Variations" tone="cream" onPress={() => router.push("/variations")} />
      {__DEV__ ? <Button label="Generator inspector" tone="cream" onPress={() => router.push("/debug")} /> : null}
      <Button label="Back" tone="cream" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: colors.ink, marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  label: { fontWeight: "800", color: colors.ink, fontSize: 16 },
  card: { backgroundColor: colors.cream, borderRadius: 16, padding: 14, marginBottom: 12 },
  copy: { color: colors.inkSoft, marginTop: 6 },
});
