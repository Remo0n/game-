import { Text } from "../src/components/Typography";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Platform, Share, StyleSheet, View } from "react-native";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { BentoArt } from "../src/components/BentoArt";
import { Icon } from "../src/components/Icon";
import { Button, Page, Stars } from "../src/components/ui";
import { parseGameRoute } from "../src/game/routes";
import { GameUnavailable } from "../src/components/GameUnavailable";
import { useProgress, runKey } from "../src/game/progressStore";
import { colors, fonts, worldForLevel } from "../src/theme/theme";

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    source?: string;
    variation?: string;
    level?: string;
    date?: string;
  }>();
  const progress = useProgress();
  const shot = useRef<ViewShotRef>(null);
  const [shareMessage, setShareMessage] = useState("");
  const route = parseGameRoute(params, progress);
  if (!route) return <GameUnavailable />;
  const { source, variation, levelNumber, date } = route;
  const saved = progress.results[runKey(route)];
  if (!saved)
    return (
      <GameUnavailable message="Complete a puzzle to see your results here." />
    );
  const result = saved.lastRun;

  async function share() {
    const message = `Bento Blocks · ${source === "daily" ? date : `Level ${levelNumber}`} · ${result?.stars ?? saved?.stars ?? 0} stars${result ? ` · ${result.cutsUsed} cuts` : ""}`;
    try {
      if (Platform.OS === "web") {
        if (navigator.share)
          await navigator.share({ title: "My bento", text: message });
        else if (navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          setShareMessage("Result copied. Ready to paste!");
        } else setShareMessage(message);
        return;
      }
      const uri = await shot.current?.capture?.();
      if (uri && (await Sharing.isAvailableAsync()))
        await Sharing.shareAsync(uri);
      else await Share.share({ message });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setShareMessage(
        "Sharing isn’t available right now. Try again in a moment.",
      );
    }
  }

  return (
    <Page title="Your bento" subtitle={`Level ${levelNumber} complete`}>
      <ViewShot ref={shot} options={{ format: "png", quality: 0.9 }}>
        <View style={styles.card}>
          <View style={styles.artStage}>
            <View style={styles.completeBadge}>
              <Icon name="check" size={14} color={colors.accent} />
              <Text style={styles.completeLabel}>Level complete</Text>
            </View>
            <View style={styles.art}>
              <BentoArt />
            </View>
          </View>
          <View style={styles.reward}>
            <Stars
              value={result?.stars ?? saved?.stars ?? 1}
              size={38}
              celebrate
            />
            <Text style={styles.perfect}>
              {result?.stars === 3
                ? "Perfectly packed!"
                : "Beautifully packed!"}
            </Text>
            <Text style={styles.copy}>Every piece found its happy place.</Text>
          </View>
          <View style={styles.stats}>
            <ResultStat
              icon="cut"
              label="Cuts"
              value={result ? String(result.cutsUsed) : "—"}
              color={colors.accent}
              background="#ECF2E5"
            />
            <ResultStat
              icon="clock"
              label="Time"
              value={result ? formatTime(result.elapsedMs) : "—"}
              color="#9B6744"
              background="#F9EBDC"
            />
            <ResultStat
              icon="star"
              label="Points"
              value={String(result?.score ?? saved?.bestScore ?? 0)}
              color="#AA7B28"
              background="#FAF0D6"
            />
          </View>
        </View>
      </ViewShot>
      <Button
        label={
          source === "daily" ? "Back to the kitchen" : "Next little challenge"
        }
        icon="arrow"
        onPress={() => {
          if (source === "daily") {
            router.replace("/home");
            return;
          }
          if (source === "variation") {
            const next = levelNumber + 1;

            router.replace({
              pathname: "/play",
              params: { source, variation, level: String(next) },
            });
            return;
          }
          const next = levelNumber + 1;
          if (progress.totalStars < worldForLevel(next).unlockStars) {
            router.replace("/worlds");
            return;
          }
          if (next > progress.levelNumber) {
            router.replace("/worlds");
            return;
          }
          router.replace({
            pathname: "/play",
            params: { source: "campaign", level: String(next) },
          });
        }}
      />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Button
            label="Replay"
            icon="reset"
            tone="cream"
            onPress={() =>
              router.replace({
                pathname: "/play",
                params: {
                  source,
                  variation,
                  level: String(levelNumber),
                  date,
                },
              })
            }
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Share"
            icon="share"
            tone="cream"
            onPress={() => void share()}
          />
        </View>
      </View>
      {shareMessage ? (
        <Text accessibilityLiveRegion="polite" style={styles.copy}>
          {shareMessage}
        </Text>
      ) : null}
      <Button
        label="Back to the kitchen"
        tone="cream"
        onPress={() => router.replace("/home")}
      />
    </Page>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function ResultStat({
  icon,
  label,
  value,
  color,
  background,
}: {
  icon: "cut" | "clock" | "star";
  label: string;
  value: string;
  color: string;
  background: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: background }]}>
        <Icon name={icon} size={20} color={color} filled={icon === "star"} />
      </View>
      <Text
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  artStage: {
    alignItems: "center",
    backgroundColor: "#EDF2E5",
    paddingTop: 18,
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFFCC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completeLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.accent },
  art: { height: 162, width: "100%", maxWidth: 300 },
  reward: {
    alignItems: "center",
    gap: 10,
    paddingTop: 18,
    paddingHorizontal: 12,
  },
  perfect: {
    fontFamily: fonts.display,
    fontSize: 27,
    lineHeight: 34,
    letterSpacing: -0.7,
    color: colors.ink,
    textAlign: "center",
  },
  copy: {
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginTop: 22,
    paddingTop: 18,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  stat: { flex: 1, alignItems: "center", gap: 5 },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  value: {
    fontSize: 25,
    lineHeight: 32,
    color: colors.ink,
    fontFamily: fonts.display,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
  },
  row: { flexDirection: "row", gap: 12 },
});
