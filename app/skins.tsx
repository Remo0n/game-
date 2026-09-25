import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/components/ui";
import { useProgress } from "../src/game/progressStore";
import { BACKGROUNDS, BLOCK_SKINS, colors, isUnlocked, TRAYS, type Look } from "../src/theme/theme";

export default function SkinsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const requested = params.tab === "Trays" || params.tab === "Backgrounds" ? params.tab : "Blocks";
  const [tab, setTab] = useState<"Blocks" | "Trays" | "Backgrounds">(requested);
  useEffect(() => {
    setTab(requested);
  }, [requested]);
  const progress = useProgress();
  const looks = tab === "Blocks" ? BLOCK_SKINS : tab === "Trays" ? TRAYS : BACKGROUNDS;
  const selected = tab === "Blocks" ? progress.selectedSkin : tab === "Trays" ? progress.selectedTray : progress.selectedBackground;

  return (
    <Screen>
      <Text style={styles.title}>Skins / Themes</Text>
      <View style={styles.tabs}>
        {(["Blocks", "Trays", "Backgrounds"] as const).map((name) => (
          <Pressable key={name} onPress={() => setTab(name)} style={[styles.tab, tab === name && styles.tabOn]}>
            <Text style={styles.tabText}>{name}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {looks.map((look) => {
          const open = isUnlocked(look, progress.totalStars, progress.weeklyRewardClaimed);
          return (
            <Pressable
              key={look.id}
              disabled={!open}
              onPress={() => progress.setLook(tab === "Blocks" ? "skin" : tab === "Trays" ? "tray" : "background", look.id)}
              style={[styles.swatch, { backgroundColor: look.colors[0] }, selected === look.id && styles.selected, !open && styles.locked]}
            >
              <Text style={styles.name}>{open ? look.name : `${look.name} locked`}</Text>
              <View style={[styles.dot, { backgroundColor: look.colors[1] }]} />
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>Back</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: colors.ink },
  tabs: { flexDirection: "row", gap: 8, marginVertical: 12 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.cream },
  tabOn: { backgroundColor: colors.accent },
  tabText: { fontWeight: "800", color: colors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 20 },
  swatch: { width: "47%", borderRadius: 18, padding: 12, minHeight: 84 },
  selected: { borderWidth: 3, borderColor: colors.ink },
  locked: { opacity: 0.45 },
  name: { fontWeight: "800", color: colors.ink },
  dot: { width: 28, height: 28, borderRadius: 8, marginTop: 8 },
  back: { textAlign: "center", color: colors.inkSoft, fontWeight: "800", marginBottom: 8 },
});
