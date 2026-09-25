import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Screen } from "../src/components/ui";
import { loadCampaignLevel, loadDailyLevel, loadVariationLevel, sealLevel } from "../src/game/levels";
import { useProgress } from "../src/game/progressStore";
import type { Variation } from "../src/engine/types";
import { colors, worldForLevel } from "../src/theme/theme";

const VARIATION_LABEL: Record<Variation, string> = {
  NORMAL: "Normal",
  ONE_CUT: "One Cut",
  NO_ROTATION: "No Rotation",
  EXACT_FIT: "Exact Fit",
  TIMED: "Timed",
  MULTI_BLOCK: "Multi Block",
};

export default function IntroScreen() {
  const params = useLocalSearchParams<{ source?: string; level?: string; variation?: string; date?: string }>();
  const campaignSeed = useProgress((state) => state.campaignSeed);
  const recentSignatures = useProgress((state) => state.recentSignatures);
  const storedLevel = useProgress((state) => state.levelNumber);
  const variationLevels = useProgress((state) => state.variationLevel);
  const source = params.source ?? "campaign";
  const variation = (params.variation as Variation | undefined) ?? "NORMAL";
  const levelNumber = Number(params.level ?? (source === "variation" ? variationLevels[variation] : storedLevel));

  const playable = useMemo(() => {
    if (source === "daily") return sealLevel(loadDailyLevel(params.date ?? "2026-09-23"));
    if (source === "variation") return sealLevel(loadVariationLevel(campaignSeed, variation, levelNumber));
    return sealLevel(loadCampaignLevel(campaignSeed, levelNumber, recentSignatures));
  }, [source, params.date, campaignSeed, recentSignatures, variation, levelNumber]);

  const world = worldForLevel(playable.levelNumber);
  const difficulty = playable.difficulty.replace("_", " ");

  return (
    <Screen>
      <View style={styles.body}>
        <Text style={styles.kicker}>{source === "daily" ? "Daily challenge" : world.name}</Text>
        <Text style={styles.title}>Level {playable.levelNumber}</Text>
        <View style={styles.card}>
          <Text style={styles.line}>{difficulty}</Text>
          <Text style={styles.line}>{VARIATION_LABEL[playable.variation]}</Text>
        </View>
      </View>
      <Button
        label="Start"
        onPress={() =>
          router.replace({
            pathname: "/play",
            params: {
              source,
              variation,
              level: String(playable.levelNumber),
              date: params.date ?? "",
            },
          })
        }
      />
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>Back</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center" },
  kicker: { color: colors.inkSoft, fontWeight: "800", textAlign: "center" },
  title: { fontSize: 42, fontWeight: "900", color: colors.ink, textAlign: "center", marginTop: 6 },
  card: {
    backgroundColor: colors.cream,
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
    alignItems: "center",
  },
  line: { fontSize: 18, fontWeight: "800", color: colors.ink, marginVertical: 4 },
  back: { textAlign: "center", color: colors.ink, fontWeight: "800", marginTop: 16 },
});
