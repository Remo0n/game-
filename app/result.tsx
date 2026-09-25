import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Tabi } from "../src/components/Tabi";
import { Button, Screen } from "../src/components/ui";
import { weekKey } from "../src/engine/generator/daily";
import { useProgress, progressKey } from "../src/game/progressStore";
import { useSession } from "../src/game/sessionStore";
import { colors, worldForLevel } from "../src/theme/theme";
import type { Variation } from "../src/engine/types";

export default function ResultScreen() {
  const params = useLocalSearchParams<{ source?: string; variation?: string; level?: string; date?: string }>();
  const result = useSession((state) => state.result);
  const level = useSession((state) => state.level);
  const progress = useProgress();
  const shot = useRef<ViewShotRef>(null);
  const source = params.source ?? "campaign";
  const variation = (params.variation as Variation | undefined) ?? "NORMAL";
  const levelNumber = Number(params.level ?? level?.levelNumber ?? 1);
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current || source !== "daily" || !params.date) return;
    if (progress.dailyCompletedDate === params.date) return;
    recorded.current = true;
    progress.completeDaily(params.date, weekKey(new Date(`${params.date}T12:00:00`)));
  }, [params.date, progress, source]);

  const saved = progress.results[progressKey(source === "variation" ? variation : source, levelNumber)];

  async function share() {
    try {
      const uri = await shot.current?.capture?.();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri);
        return;
      }
    } catch {
      // Fall through to the text share sheet.
    }
    await Share.share({
      message: `Bento Blocks · Level ${levelNumber} · ${result?.stars ?? 1} stars · ${result?.cutsUsed ?? 0} cuts`,
    });
  }

  return (
    <Screen>
      <ViewShot ref={shot} options={{ format: "png", quality: 0.9 }}>
        <View style={styles.card}>
          <Text style={styles.perfect}>{result && result.cutsUsed <= result.optimalCuts ? "Perfect!" : "Solved!"}</Text>
          <Tabi size={96} />
          <Text style={styles.stars}>{"★".repeat(result?.stars ?? saved?.stars ?? 1)}{"☆".repeat(3 - (result?.stars ?? saved?.stars ?? 1))}</Text>
          <Text style={styles.line}>Cuts {result?.cutsUsed ?? 0} · best {result?.optimalCuts ?? 0}</Text>
          <Text style={styles.line}>Time {formatTime(result?.elapsedMs ?? 0)}</Text>
          <Text style={styles.line}>Score {result?.score ?? saved?.bestScore ?? 0}</Text>
          <Text style={styles.line}>Best {saved?.bestScore ?? result?.score ?? 0}</Text>
        </View>
      </ViewShot>
      <Button label="Next level" onPress={() => {
        if (source === "daily") {
          router.replace("/home");
          return;
        }
        if (source === "variation") {
          const next = levelNumber + 1;
          progress.setVariationLevel(variation, next);
          router.replace({ pathname: "/intro", params: { source, variation, level: String(next) } });
          return;
        }
        if (levelNumber < progress.levelNumber) {
          router.replace("/worlds");
          return;
        }
        const next = levelNumber + 1;
        if (progress.totalStars < worldForLevel(next).unlockStars) {
          router.replace("/worlds");
          return;
        }
        progress.advanceCampaign();
        router.replace({ pathname: "/intro", params: { source: "campaign", level: String(next) } });
      }} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Button label="Replay" tone="cream" onPress={() => router.replace({ pathname: "/intro", params: { source, variation, level: String(levelNumber), date: params.date ?? "" } })} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Share" tone="cream" onPress={() => void share()} />
        </View>
      </View>
    </Screen>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderRadius: 28,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  perfect: { fontSize: 36, fontWeight: "900", color: colors.ink },
  stars: { fontSize: 28, color: colors.accentDeep, marginVertical: 6 },
  line: { color: colors.inkSoft, fontWeight: "700", marginTop: 4 },
  row: { flexDirection: "row", gap: 10, marginTop: 10 },
});
