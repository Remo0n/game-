import { Text } from "../src/components/Typography";
import { router, useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable, ProgressFill } from "../src/components/motion";
import { LaunchReadyContext } from "../src/components/SplashIntro";
import { BackgroundArt } from "../src/components/SceneArt";
import { PuzzleBoard } from "../src/components/PuzzleBoard";
import { Icon, IconName } from "../src/components/Icon";
import { Button, Eyebrow, IconButton, Screen } from "../src/components/ui";
import { difficultyLabel } from "../src/engine/generator/progression";
import { pulse } from "../src/game/haptics";
import {
  loadCampaignLevel,
  loadDailyLevel,
  loadVariationLevel,
  sealLevel,
} from "../src/game/levels";
import { useProgress } from "../src/game/progressStore";
import { useSession } from "../src/game/sessionStore";
import { playSound } from "../src/game/sound";
import type { ToolKit } from "../src/engine/types";
import { getBounds } from "../src/engine/geometry/shape";
import { parseGameRoute, type GameRoute } from "../src/game/routes";
import { GameUnavailable } from "../src/components/GameUnavailable";
import {
  BACKGROUNDS,
  BLOCK_SKINS,
  colors,
  fonts,
  TRAYS,
  worldForLevel,
} from "../src/theme/theme";

export default function PlayScreen() {
  const params = useLocalSearchParams<{
    source?: string;
    level?: string;
    variation?: string;
    date?: string;
  }>();
  const progress = useProgress();
  const fallback = useRef(progress);
  const route = parseGameRoute(params, fallback.current);
  if (!route) return <GameUnavailable />;
  const unlocked =
    route.source === "daily" ||
    (route.source === "variation"
      ? route.levelNumber <= progress.variationLevel[route.variation]
      : route.levelNumber <= progress.levelNumber &&
        progress.totalStars >= worldForLevel(route.levelNumber).unlockStars);
  if (!unlocked)
    return (
      <GameUnavailable message="Finish the earlier levels to unlock this bento." />
    );
  return (
    <ActivePuzzle
      key={`${route.source}:${route.variation}:${route.levelNumber}:${route.date}`}
      route={route}
    />
  );
}

function ActivePuzzle({ route }: { route: GameRoute }) {
  const launchReady = useContext(LaunchReadyContext);
  const progress = useProgress();
  const { source, variation, levelNumber, date } = route;
  const playable = useMemo(() => {
    if (source === "daily") return sealLevel(loadDailyLevel(date));
    if (source === "variation")
      return sealLevel(
        loadVariationLevel(progress.campaignSeed, variation, levelNumber),
      );
    return sealLevel(
      loadCampaignLevel(
        progress.campaignSeed,
        levelNumber,
        progress.recentSignatures,
      ),
    );
  }, [source, date, progress.campaignSeed, variation, levelNumber]);
  const session = useSession();
  const recorded = useRef(false);
  const [now, setNow] = useState(Date.now());
  const [sheet, setSheet] = useState<
    "help" | "tools" | "reset" | "leave" | null
  >(null);
  const [lastSheet, setLastSheet] = useState("help");
  const displayedSheet = sheet ?? lastSheet;
  const [feedback, setFeedback] = useState("");
  const [gestureActive, setGestureActive] = useState(false);
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const fieldHeight = Math.max(
    330,
    Math.min(640, height - insets.top - insets.bottom - 355),
  );
  useEffect(() => {
    if (sheet) setLastSheet(sheet);
  }, [sheet]);

  useEffect(() => {
    if (!launchReady) return;
    recorded.current = false;
    useSession.getState().start(playable);
    progress.rememberSignature(playable.signature);
  }, [playable.id, launchReady]);
  useEffect(() => {
    if (
      !session.level?.timeLimitSec ||
      session.result ||
      session.pausedAt !== null
    )
      return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [session.level?.timeLimitSec, session.result, session.pausedAt]);
  useEffect(() => {
    if (
      session.level?.timeLimitSec &&
      !session.result &&
      !session.timedOut &&
      session.pausedAt === null &&
      (now - session.startedAt) / 1000 >= session.level.timeLimitSec
    )
      session.expire();
  }, [
    now,
    session.startedAt,
    session.timedOut,
    session.pausedAt,
    session.level?.timeLimitSec,
    session.result,
  ]);
  useEffect(() => {
    const syncPause = () => {
      if (sheet || AppState.currentState !== "active")
        useSession.getState().pause();
      else useSession.getState().resume();
      setNow(Date.now());
    };
    syncPause();
    const subscription = AppState.addEventListener("change", syncPause);
    return () => subscription.remove();
  }, [sheet, playable.id, launchReady]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setSheet("leave");
        return true;
      },
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(""), 2600);
    return () => clearTimeout(timer);
  }, [feedback]);
  useEffect(() => {
    if (
      !session.result ||
      useSession.getState().result !== session.result ||
      session.level?.id !== playable.id ||
      recorded.current
    )
      return;
    const completedResult = session.result;
    const completedLevel = session.level;
    // Allow the final snap to settle. Undo/unmount cancels both saving and navigation.
    const timer = setTimeout(() => {
      if (useSession.getState().result !== completedResult) return;
      recorded.current = true;
      useProgress.getState().completeRun({
        ...route,
        result: completedResult,
        nextWorldStars: worldForLevel(levelNumber + 1).unlockStars,
      });
      playSound("complete", progress.soundEnabled);
      void pulse("complete", progress.hapticsEnabled);
      router.replace({
        pathname: "/result",
        params: {
          source,
          variation,
          level: String(completedLevel.levelNumber),
          date: date || "",
        },
      });
    }, 850);
    return () => clearTimeout(timer);
  }, [session.result, session.level?.id, playable.id, source, variation, date]);

  const attempt = session.attempt;
  const level = session.level;
  if (!attempt || !level || level.id !== playable.id)
    return (
      <Screen>
        <Text style={styles.title}>Preparing your bento…</Text>
      </Screen>
    );
  const skin =
    BLOCK_SKINS.find((item) => item.id === progress.selectedSkin) ??
    BLOCK_SKINS[0];
  const tray =
    TRAYS.find((item) => item.id === progress.selectedTray) ?? TRAYS[0];
  const background =
    BACKGROUNDS.find((item) => item.id === progress.selectedBackground) ??
    BACKGROUNDS[0];
  const remainingCuts = attempt.allowedCuts - attempt.cutsUsed;
  const selected = attempt.pieces.find(
    (item) => item.id === session.selectedId && !item.placed,
  );
  const canRotate =
    Boolean(selected) &&
    (level.rotationsAllowed || attempt.kit.rotate + progress.wallet.rotate > 0);
  const filled = attempt.pieces
    .filter((p) => p.placed)
    .reduce((sum, p) => sum + p.shape.length, 0);
  const fillPercent = Math.round((filled / level.targetShape.length) * 100);
  const remaining = Math.max(
    0,
    Math.ceil(
      (level.timeLimitSec ?? 0) -
        ((session.pausedAt ?? now) - session.startedAt) / 1000,
    ),
  );
  function respond(ok: boolean, action: "cut" | "snap") {
    playSound(ok ? action : "invalid", progress.soundEnabled);
    void pulse(ok ? action : "invalid", progress.hapticsEnabled);
    setFeedback(
      ok
        ? action === "cut"
          ? "Lovely cut. Now find their place."
          : "A perfect fit."
        : action === "cut"
          ? "Swipe along a seam between the squares."
          : "Try an empty space that matches the piece.",
    );
  }
  function applyTool(
    tool: keyof ToolKit,
    action: () => boolean,
    fromDialog = false,
  ) {
    if (AppState.currentState !== "active") return false;
    const current = useSession.getState();
    const needsWallet = (current.attempt?.kit[tool] ?? 0) <= 0;
    if (needsWallet && useProgress.getState().wallet[tool] <= 0) return false;
    const ok = current.withTool(tool, needsWallet, action, fromDialog);
    if (ok && needsWallet) useProgress.getState().spendWallet(tool);
    return ok;
  }
  function rotate() {
    if (!selected) return;
    if (level!.rotationsAllowed) session.rotate(selected.id);
    else applyTool("rotate", () => useSession.getState().rotate(selected.id));
  }
  return (
    <Screen style={{ maxWidth: 860 }}>
      <View style={styles.top}>
        <IconButton
          name="back"
          label="Leave puzzle"
          onPress={() => setSheet("leave")}
        />
        <View style={styles.heading}>
          <Eyebrow>
            {source === "daily"
              ? "The daily bento"
              : level.progression?.beat === "learn" ||
                  level.progression?.beat === "breather"
                ? level.progression.label
                : worldForLevel(levelNumber).name}
          </Eyebrow>
          <Text style={styles.title}>Level {levelNumber}</Text>
        </View>
        <IconButton
          name="help"
          label="How to play"
          onPress={() => setSheet("help")}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        scrollEnabled={!gestureActive}
      >
        <View style={styles.status}>
          <View style={styles.statusItem}>
            <Icon name="cut" size={17} color={colors.accent} />
            <Text style={styles.statusText}>
              {remainingCuts} {remainingCuts === 1 ? "cut" : "cuts"} left
            </Text>
          </View>
          <View style={styles.statusItem}>
            <View style={styles.progressTrack}>
              <ProgressFill value={fillPercent} style={styles.progressFill} />
            </View>
            <Text style={styles.statusText}>{fillPercent}% packed</Text>
          </View>
          {level.timeLimitSec ? (
            <Text style={styles.statusText}>
              {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </Text>
          ) : level.progression ? (
            <Text style={styles.difficultyBadge}>
              {level.progression.beat === "learn"
                ? "New idea"
                : level.progression.beat === "breather"
                  ? "Breather"
                  : difficultyLabel(level.difficulty)}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.field,
            {
              minHeight: fieldHeight,
              backgroundColor:
                progress.selectedBackground === "kitchen"
                  ? "#EFF0E5"
                  : background.colors[0],
            },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 28, overflow: "hidden" },
            ]}
          >
            <BackgroundArt id={background.id} />
          </View>
          <PuzzleBoard
            key={playable.id}
            target={level.targetShape}
            pieces={attempt.pieces}
            hint={attempt.hint}
            palette={skin.colors}
            skinId={skin.id}
            trayId={tray.id}
            tray={tray.colors[0]}
            playHeight={fieldHeight - 34}
            boardWidth={Math.min(width, 860) - 80}
            cutMode={session.cutMode}
            selectedId={session.selectedId}
            onSelect={session.select}
            onGestureActive={setGestureActive}
            onCut={(id, orientation, position) => {
              const ok = session.cut(id, orientation, position);
              respond(ok, "cut");
              return ok;
            }}
            onDrop={(id, x, y) => {
              const ok = session.drop(id, x, y);
              respond(ok, "snap");
              return ok;
            }}
            onInvalid={() =>
              setFeedback(
                "Swipe across a piece along a seam between its squares.",
              )
            }
          />
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.instruction}>
          {feedback ||
            (level.progression?.beat === "learn"
              ? level.progression.tip
              : null) ||
            (session.cutMode
              ? "Start anywhere on the board. Swipe across a seam to slice."
              : "Drag each piece into the tray. Make every square fit.")}
        </Text>
        <View style={styles.controls}>
          <View style={styles.segment}>
            <Control
              label="Cut"
              icon="cut"
              active={session.cutMode}
              disabled={remainingCuts <= 0}
              onPress={() => session.setCutMode(true)}
            />
            <Control
              label="Move"
              icon="move"
              active={!session.cutMode}
              onPress={() => session.setCutMode(false)}
            />
          </View>
          <Control
            label="Rotate"
            icon="rotate"
            disabled={!canRotate}
            onPress={rotate}
          />
        </View>
        <View style={styles.utility}>
          <Utility
            label="Undo"
            icon="undo"
            disabled={!attempt.undo.length}
            onPress={() => {
              session.undoMove();
              setFeedback("Last move undone.");
            }}
          />
          <Utility
            label="Hint"
            icon="hint"
            onPress={() => {
              session.hint();
              setFeedback("Follow the highlighted guide.");
            }}
          />
          <Utility
            label="Restart"
            icon="reset"
            onPress={() => setSheet("reset")}
          />
          <Utility
            label="Tools"
            icon="tools"
            onPress={() => setSheet("tools")}
          />
        </View>
      </ScrollView>
      <Modal
        transparent
        visible={sheet !== null || session.timedOut}
        animationType="fade"
        onRequestClose={() => !session.timedOut && setSheet(null)}
      >
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={styles.sheet}>
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sheetTop}>
                <Text style={styles.sheetTitle}>
                  {session.timedOut
                    ? "A fresh start?"
                    : displayedSheet === "help"
                      ? "A recipe for a perfect fit"
                      : displayedSheet === "tools"
                        ? "A little helping hand"
                        : displayedSheet === "reset"
                          ? "Start this bento again?"
                          : "Leave this bento?"}
                </Text>
                {!session.timedOut && (
                  <IconButton
                    name="close"
                    label="Close dialog"
                    onPress={() => setSheet(null)}
                  />
                )}
              </View>
              {session.timedOut ? (
                <>
                  <Text style={styles.sheetCopy}>
                    Time is up. Try again with a fresh timer.
                  </Text>
                  <Button
                    label="Try again"
                    onPress={() => {
                      session.reset();
                      setSheet(null);
                    }}
                  />
                  <Button
                    label="Back to the kitchen"
                    tone="cream"
                    onPress={() => router.replace("/home")}
                  />
                </>
              ) : displayedSheet === "help" ? (
                <>
                  {level.progression && (
                    <Text style={styles.sheetCopy}>
                      {level.progression.tip}
                    </Text>
                  )}
                  <Text style={styles.sheetCopy}>
                    {
                      "1. Cut: start anywhere on the cutting board and swipe across a piece along a grid seam.\n\n2. Move: drag the pieces into the empty tray.\n\n3. Fill every square. Use fewer cuts and hints to earn more stars."
                    }
                  </Text>
                  <Button
                    label="Let’s do this"
                    onPress={() => setSheet(null)}
                  />
                </>
              ) : displayedSheet === "tools" ? (
                <>
                  <Text style={styles.sheetCopy}>
                    Optional extras, earned from three-star solves. Select a
                    loose piece before using a tool.
                  </Text>
                  {(
                    [
                      { key: "lineSplit", label: "Guided split", icon: "cut" },
                      {
                        key: "extraCut",
                        label: "One extra cut",
                        icon: "spark",
                      },
                      { key: "laser", label: "Laser slice", icon: "tools" },
                    ] as const
                  ).map((tool) => {
                    const count =
                      attempt.kit[tool.key] + progress.wallet[tool.key];
                    return (
                      <Button
                        key={tool.key}
                        label={`${tool.label} · ${count} available`}
                        tone="cream"
                        icon={tool.icon}
                        disabled={
                          count <= 0 ||
                          (tool.key !== "extraCut" &&
                            (!selected || remainingCuts <= 0))
                        }
                        onPress={() => {
                          if (tool.key === "extraCut")
                            applyTool(
                              "extraCut",
                              () => useSession.getState().extraCut(),
                              true,
                            );
                          else if (selected && tool.key === "lineSplit")
                            respond(
                              applyTool(
                                "lineSplit",
                                () =>
                                  useSession.getState().lineSplit(selected.id),
                                true,
                              ),
                              "cut",
                            );
                          else if (selected) {
                            const bounds = getBounds(selected.shape);
                            respond(
                              applyTool(
                                "laser",
                                () =>
                                  useSession.getState().laser(selected.id, {
                                    x1: 0,
                                    y1: 0.2,
                                    x2: Math.max(1.2, bounds.width),
                                    y2: Math.max(0.8, bounds.height - 0.15),
                                  }),
                                true,
                              ),
                              "cut",
                            );
                          }
                          setSheet(null);
                        }}
                      />
                    );
                  })}
                </>
              ) : (
                <>
                  <Text style={styles.sheetCopy}>
                    {displayedSheet === "reset"
                      ? "Your cuts and placements on this attempt will reset."
                      : "This attempt will reset. Your completed levels and stars are saved."}
                  </Text>
                  <Button
                    label={
                      displayedSheet === "reset"
                        ? "Restart level"
                        : "Back to the kitchen"
                    }
                    onPress={() => {
                      if (sheet === "reset") {
                        session.reset();
                        setFeedback("");
                        setSheet(null);
                      } else router.replace("/home");
                    }}
                  />
                  <Button
                    label="Keep playing"
                    tone="cream"
                    onPress={() => setSheet(null)}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
function Control({
  label,
  icon,
  active,
  disabled,
  onPress,
}: {
  label: string;
  icon: IconName;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        active && styles.controlActive,
        disabled && { opacity: 0.35 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icon name={icon} size={19} color={active ? colors.cream : colors.ink} />
      <Text style={[styles.controlLabel, active && { color: colors.cream }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}
function Utility({
  label,
  icon,
  disabled,
  onPress,
}: {
  label: string;
  icon: IconName;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.utilityButton, disabled && { opacity: 0.35 }]}
    >
      <Icon name={icon} size={19} color={colors.inkSoft} />
      <Text style={styles.utilityLabel}>{label}</Text>
    </AnimatedPressable>
  );
}
const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  heading: { flex: 1, alignItems: "center", gap: 5 },
  title: { fontFamily: fonts.display, fontSize: 29, color: colors.ink },
  difficultyBadge: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.accent,
    backgroundColor: colors.sage,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  status: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  statusItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusText: { color: colors.inkSoft, fontSize: 12 },
  progressTrack: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  field: {
    flex: 1,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "visible",
  },
  instruction: {
    minHeight: 40,
    textAlign: "center",
    color: colors.inkSoft,
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  controls: { flexDirection: "row", gap: 12 },
  segment: {
    flex: 2,
    flexDirection: "row",
    padding: 4,
    backgroundColor: "#E7EADF",
    borderRadius: 18,
    gap: 4,
  },
  control: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  controlActive: { backgroundColor: colors.accent },
  controlLabel: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  utility: { flexDirection: "row", marginTop: 10, justifyContent: "center" },
  utilityButton: {
    flex: 1,
    minHeight: 50,
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  utilityLabel: { fontSize: 10, color: colors.inkSoft },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(31,46,35,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "100%",
    borderRadius: 28,
    backgroundColor: colors.paper,
    overflow: "hidden",
  },
  sheetContent: {
    padding: 24,
    gap: 18,
  },
  sheetTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  sheetTitle: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 26,
    flex: 1,
  },
  sheetCopy: { fontSize: 14, lineHeight: 23, color: colors.inkSoft },
});
