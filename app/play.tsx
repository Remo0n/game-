import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PuzzleBoard } from "../src/components/PuzzleBoard";
import { Screen } from "../src/components/ui";
import { pulse } from "../src/game/haptics";
import { loadCampaignLevel, loadDailyLevel, loadVariationLevel, sealLevel } from "../src/game/levels";
import { progressKey, useProgress } from "../src/game/progressStore";
import { useSession } from "../src/game/sessionStore";
import { playSound } from "../src/game/sound";
import type { Variation } from "../src/engine/types";
import { getBounds } from "../src/engine/geometry/shape";
import { BLOCK_SKINS, colors, TRAYS, worldForLevel } from "../src/theme/theme";

const playArt = {
  background: require("../assets/ui/play-bg.png"),
  tabi: require("../assets/ui/play-tabi.png"),
  pause: require("../assets/ui/icon-pause.png"),
  settings: require("../assets/ui/icon-settings.png"),
  cut: require("../assets/ui/icon-cut.png"),
  move: require("../assets/ui/icon-move.png"),
  rotate: require("../assets/ui/icon-rotate.png"),
  undo: require("../assets/ui/icon-undo.png"),
  reset: require("../assets/ui/icon-reset.png"),
  hint: require("../assets/ui/icon-hint.png"),
  laser: require("../assets/ui/icon-laser.png"),
  split: require("../assets/ui/icon-split.png"),
  extra: require("../assets/ui/icon-extra.png"),
};

export default function PlayScreen() {
  const params = useLocalSearchParams<{ source?: string; level?: string; variation?: string; date?: string }>();
  const progress = useProgress();
  const source = params.source ?? "campaign";
  const variation = (params.variation as Variation | undefined) ?? "NORMAL";
  const levelNumber = Number(params.level ?? (source === "variation" ? progress.variationLevel[variation] : progress.levelNumber));

  const playable = useMemo(() => {
    if (source === "daily") return sealLevel(loadDailyLevel(params.date ?? "2026-09-23"));
    if (source === "variation") return sealLevel(loadVariationLevel(progress.campaignSeed, variation, levelNumber));
    return sealLevel(loadCampaignLevel(progress.campaignSeed, levelNumber, progress.recentSignatures));
  }, [source, params.date, progress.campaignSeed, progress.recentSignatures, variation, levelNumber]);

  if (useSession.getState().level?.id !== playable.id) {
    useSession.getState().start(playable);
  }
  const session = useSession();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const playHeight = Math.max(160, height - insets.top - insets.bottom - 350);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!session.level?.timeLimitSec || session.result) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [session.level?.timeLimitSec, session.result]);

  useEffect(() => {
    if (!session.level?.timeLimitSec || !session.attempt || session.result) return;
    const elapsed = (now - session.startedAt) / 1000;
    if (elapsed >= session.level.timeLimitSec) session.expire();
  }, [now, session]);

  useEffect(() => {
    progress.rememberSignature(playable.signature);
    // Record each puzzle once. The store function identity is stable enough for this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playable.id, playable.signature]);

  useEffect(() => {
    if (!session.result || session.level?.id !== playable.id) return;
    const mode = source === "campaign" ? "campaign" : source === "daily" ? "daily" : variation;
    const key = progressKey(mode, session.level.levelNumber);
    const perfect = progress.recordResult(key, session.result.stars, session.result.score);
    if (perfect) progress.grantTool();
    playSound("complete", progress.soundEnabled);
    void pulse("complete", progress.hapticsEnabled);
    router.replace({
      pathname: "/result",
      params: {
        source,
        variation,
        level: String(session.level.levelNumber),
        date: params.date ?? "",
      },
    });
  }, [session.result, session.level?.id, playable.id]);

  const skin = BLOCK_SKINS.find((item) => item.id === progress.selectedSkin) ?? BLOCK_SKINS[0];
  const tray = TRAYS.find((item) => item.id === progress.selectedTray) ?? TRAYS[0];
  const attempt = session.attempt;
  const level = session.level;
  if (!attempt || !level) {
    return (
      <Screen>
        <Text style={styles.plaqueTitle}>Preparing the bento…</Text>
      </Screen>
    );
  }
  const remaining = Math.max(0, (level.timeLimitSec ?? 0) - (now - session.startedAt) / 1000);
  const world = worldForLevel(level.levelNumber);
  const laserCount = attempt.kit.laser + progress.wallet.laser;
  const splitCount = attempt.kit.lineSplit + progress.wallet.lineSplit;
  const extraCount = attempt.kit.extraCut + progress.wallet.extraCut;
  const cutRatio = attempt.allowedCuts === 0 ? 0 : attempt.cutsUsed / attempt.allowedCuts;

  return (
    <View style={styles.root}>
      <Image source={playArt.background} style={styles.background} resizeMode="cover" />
      <Screen style={styles.screen}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} style={styles.round}>
            <Image source={playArt.pause} style={styles.roundIcon} />
          </Pressable>
          <View style={styles.plaque}>
            <Text style={styles.plaqueTitle}>Level {level.levelNumber}</Text>
            <Text style={styles.plaqueSub}>{level.difficulty.replace("_", " ")} · {world.name}</Text>
          </View>
          <Pressable onPress={() => router.push("/settings")} style={styles.round}>
            <Image source={playArt.settings} style={styles.roundIcon} />
          </Pressable>
        </View>
        {level.timeLimitSec ? <Text style={styles.timer}>{session.timedOut ? "Time's up — try again" : formatClock(remaining)}</Text> : null}
        <View style={styles.field}>
          <PuzzleBoard
              target={level.targetShape}
              pieces={attempt.pieces}
              hint={attempt.hint}
              palette={skin.colors}
              tray={tray.colors[0]}
              playHeight={playHeight}
              mascot={playArt.tabi}
              cutMode={session.cutMode}
              selectedId={session.selectedId}
              onSelect={session.select}
              onCut={(pieceId, orientation, position) => {
                const ok = session.cut(pieceId, orientation, position);
                playSound(ok ? "cut" : "invalid", progress.soundEnabled);
                void pulse(ok ? "cut" : "invalid", progress.hapticsEnabled);
              }}
              onDrop={(pieceId, x, y) => {
                const ok = session.drop(pieceId, x, y);
                playSound(ok ? "snap" : "invalid", progress.soundEnabled);
                void pulse(ok ? "snap" : "invalid", progress.hapticsEnabled);
              }}
              onInvalid={() => {
                playSound("invalid", progress.soundEnabled);
                void pulse("invalid", progress.hapticsEnabled);
              }}
            />
        </View>
          <View style={styles.modes}>
            <ModeButton label="Cutting" source={playArt.cut} active={session.cutMode} onPress={() => session.setCutMode(true)} />
            <ModeButton label="Move" source={playArt.move} active={!session.cutMode} onPress={() => session.setCutMode(false)} />
            <ModeButton
              label="Rotate"
              source={playArt.rotate}
              disabled={!level.rotationsAllowed && attempt.kit.rotate + progress.wallet.rotate <= 0}
              onPress={() => {
                if (!session.selectedId) return;
                if (!level.rotationsAllowed && attempt.kit.rotate <= 0) {
                  if (progress.wallet.rotate <= 0) return;
                  progress.spendWallet("rotate");
                  session.boost("rotate");
                }
                session.rotate(session.selectedId);
              }}
            />
          </View>
          <Text style={styles.cuts}>Cuts {attempt.cutsUsed}/{attempt.allowedCuts}</Text>
          <View style={styles.slider}>
            <View style={[styles.sliderFill, { width: `${Math.round(cutRatio * 100)}%` }]} />
            <View style={[styles.sliderThumb, { left: `${Math.round(cutRatio * 100)}%` }]} />
          </View>
          <View style={styles.tools}>
            <ToolButton label="Undo" source={playArt.undo} onPress={session.undoMove} />
            <ToolButton label="Reset" source={playArt.reset} onPress={session.reset} />
            <ToolButton label="Hint" source={playArt.hint} onPress={session.hint} />
          </View>
          <View style={styles.tools}>
            <ToolButton label={`Laser ${laserCount}`} source={playArt.laser} badge={laserCount} onPress={() => {
              const piece = attempt.pieces.find((item) => item.id === session.selectedId && !item.placed);
              if (!piece) return;
              if (attempt.kit.laser <= 0) {
                if (progress.wallet.laser <= 0) return;
                progress.spendWallet("laser");
                session.boost("laser");
              }
              const bounds = getBounds(piece.shape);
              const ok = session.laser(piece.id, { x1: 0, y1: 0.2, x2: Math.max(1.2, bounds.width), y2: Math.max(0.8, bounds.height - 0.15) });
              playSound(ok ? "cut" : "invalid", progress.soundEnabled);
              void pulse(ok ? "cut" : "invalid", progress.hapticsEnabled);
            }} />
            <ToolButton label={`Split ${splitCount}`} source={playArt.split} badge={splitCount} onPress={() => {
              if (!session.selectedId) return;
              if (attempt.kit.lineSplit <= 0) {
                if (progress.wallet.lineSplit <= 0) return;
                progress.spendWallet("lineSplit");
                session.boost("lineSplit");
              }
              const ok = session.lineSplit(session.selectedId);
              playSound(ok ? "cut" : "invalid", progress.soundEnabled);
              void pulse(ok ? "cut" : "invalid", progress.hapticsEnabled);
            }} />
            <ToolButton label={`Extra ${extraCount}`} source={playArt.extra} badge={extraCount} onPress={() => {
              if (attempt.kit.extraCut <= 0) {
                if (progress.wallet.extraCut <= 0) return;
                progress.spendWallet("extraCut");
                session.boost("extraCut");
              }
              session.extraCut();
            }} />
          </View>
      </Screen>
    </View>
  );
}

function ModeButton({
  label,
  source,
  active = false,
  disabled = false,
  onPress,
}: {
  label: string;
  source: number;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.mode, active && styles.modeOn, disabled && styles.disabled]}>
      <Image source={source} style={styles.modeIcon} />
      <Text style={[styles.modeLabel, active && styles.modeLabelOn]}>{label}</Text>
    </Pressable>
  );
}

function ToolButton({
  label,
  source,
  badge = 0,
  onPress,
}: {
  label: string;
  source: number;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tool}>
      <Image source={source} style={styles.toolIcon} />
      <Text style={styles.toolLabel}>{label}</Text>
      {badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = String(safe % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#E7C49A" },
  background: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  screen: { flex: 1, backgroundColor: "transparent", paddingHorizontal: 12 },
  field: { flex: 1, minHeight: 0, overflow: "visible" },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#5C4033",
    alignItems: "center",
    justifyContent: "center",
  },
  roundIcon: { width: 24, height: 24 },
  plaque: {
    flex: 1,
    backgroundColor: "#F4E1C1",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#C48A4A",
    paddingVertical: 6,
    alignItems: "center",
  },
  plaqueTitle: { fontSize: 22, fontWeight: "900", color: colors.ink },
  plaqueSub: { color: colors.inkSoft, fontWeight: "800", fontSize: 12 },
  timer: { textAlign: "center", fontWeight: "800", color: colors.accentDeep, marginTop: 6 },
  modes: { flexDirection: "row", gap: 8, marginTop: 12 },
  mode: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: "#FFF6E8",
    borderWidth: 2,
    borderColor: "#E7D3BC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modeOn: { borderColor: "#F2A03D", backgroundColor: "#FFF1D2" },
  modeIcon: { width: 22, height: 22 },
  modeLabel: { fontWeight: "800", color: colors.ink },
  modeLabelOn: { color: "#E08A22" },
  disabled: { opacity: 0.45 },
  cuts: { textAlign: "center", marginTop: 12, fontWeight: "800", color: colors.inkSoft },
  slider: { position: "relative", height: 8, borderRadius: 4, backgroundColor: "#E7D3BC", marginTop: 8, marginHorizontal: 28 },
  sliderFill: { height: 8, borderRadius: 4, backgroundColor: "#F2A03D" },
  sliderThumb: {
    position: "absolute",
    top: -4,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    backgroundColor: "#FFF8EF",
    borderWidth: 2,
    borderColor: "#E7D3BC",
  },
  tools: { flexDirection: "row", gap: 8, marginTop: 8 },
  tool: {
    flex: 1,
    backgroundColor: "#FFF6E8",
    borderRadius: 16,
    minHeight: 74,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  toolIcon: { width: 28, height: 28 },
  toolLabel: { marginTop: 4, fontWeight: "800", color: colors.ink, fontSize: 12 },
  badge: {
    position: "absolute",
    top: 6,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E15B4A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#FFF8EF", fontSize: 11, fontWeight: "900" },
});
