import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/components/ui";
import { formatDate } from "../src/engine/generator/daily";
import { progressKey, useProgress } from "../src/game/progressStore";
import { colors, WORLDS, worldForLevel } from "../src/theme/theme";

const art = {
  background: require("../assets/ui/home-bg.png"),
  logo: require("../assets/ui/logo.png"),
  diorama: require("../assets/ui/diorama.png"),
  tabi: require("../assets/ui/tabi.png"),
  avatar: require("../assets/ui/avatar.png"),
  daily: require("../assets/ui/icon-daily.png"),
  rewards: require("../assets/ui/icon-rewards.png"),
  leaderboard: require("../assets/ui/icon-leaderboard.png"),
  skins: require("../assets/ui/icon-skins.png"),
  trays: require("../assets/ui/icon-trays.png"),
  worlds: require("../assets/ui/icon-worlds.png"),
  shop: require("../assets/ui/icon-shop.png"),
  settings: require("../assets/ui/icon-settings.png"),
  coin: require("../assets/ui/icon-coin.png"),
  gem: require("../assets/ui/icon-gem.png"),
};

export default function HomeScreen() {
  const levelNumber = useProgress((state) => state.levelNumber);
  const totalStars = useProgress((state) => state.totalStars);
  const results = useProgress((state) => state.results);
  const dailyCompletedDate = useProgress((state) => state.dailyCompletedDate);
  const wallet = useProgress((state) => state.wallet);
  const currentWorldIndex = Math.max(0, WORLDS.findIndex((world) => world.id === worldForLevel(levelNumber).id));
  const [worldIndex, setWorldIndex] = useState(currentWorldIndex);
  const world = WORLDS[worldIndex] ?? WORLDS[0];
  const locked = totalStars < world.unlockStars;
  const dailyOpen = dailyCompletedDate !== formatDate(new Date());
  const rewardReady = wallet.laser + wallet.lineSplit + wallet.rotate + wallet.extraCut > 0;
  const nodes = levelWindow(levelNumber);
  const worldProgress = (((levelNumber - 1) % 30) + 1) / 30;

  return (
    <View style={styles.root}>
      <Image source={art.background} style={styles.background} resizeMode="cover" />
      <Screen style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.top}>
            <View style={styles.profile}>
              <Image source={art.avatar} style={styles.avatar} />
              <View style={styles.profileCopy}>
                <Text style={styles.player}>Player</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.round(worldProgress * 100)}%` }]} />
                </View>
              </View>
              <Text style={styles.level}>Lv. {levelNumber}</Text>
            </View>
            <View style={styles.currencies}>
              <CurrencyChip source={art.coin} />
              <CurrencyChip source={art.gem} />
            </View>
            <Pressable onPress={() => router.push("/settings")} style={styles.gear}>
              <Image source={art.settings} style={styles.gearIcon} />
            </Pressable>
          </View>

          <Image source={art.logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tag}>Cut. Fit. Satisfy.</Text>

          <View style={styles.stage}>
            <View style={styles.rail}>
              <RailButton label="Daily Challenge" source={art.daily} badge={dailyOpen} onPress={() => router.push("/daily")} />
              <RailButton label="Rewards" source={art.rewards} badge={rewardReady} onPress={() => router.push("/tools")} />
              <RailButton label="Leaderboard" source={art.leaderboard} />
            </View>
            <View style={styles.scene}>
              <Image source={art.diorama} style={styles.diorama} resizeMode="contain" />
              <View style={styles.mascot}>
                <View style={styles.bubble}>
                  <Text style={styles.bubbleText}>Small cuts create big joys!</Text>
                </View>
                <Image source={art.tabi} style={styles.tabi} resizeMode="contain" />
              </View>
            </View>
          </View>

          <View style={styles.worldCard}>
            <Pressable onPress={() => setWorldIndex((index) => (index + WORLDS.length - 1) % WORLDS.length)} style={styles.arrow}>
              <Text style={styles.arrowText}>‹</Text>
            </Pressable>
            <View style={styles.worldCopy}>
              <Text style={styles.worldKicker}>World {worldIndex + 1}</Text>
              <Text style={styles.worldName}>{world.name}</Text>
              <Text style={styles.worldSub}>{locked ? `Needs ${world.unlockStars} stars` : world.subtitle}</Text>
            </View>
            <Pressable onPress={() => setWorldIndex((index) => (index + 1) % WORLDS.length)} style={styles.arrow}>
              <Text style={styles.arrowText}>›</Text>
            </Pressable>
          </View>
          <View style={styles.dots}>
            {WORLDS.map((item, index) => (
              <View key={item.id} style={[styles.dot, index === worldIndex && styles.dotOn]} />
            ))}
          </View>

          <Pressable
            onPress={() => router.push({ pathname: "/intro", params: { source: "campaign", level: String(levelNumber) } })}
            style={styles.play}
          >
            <Text style={styles.playLabel}>▶  Play</Text>
            <Text style={styles.playLevel}>Level {levelNumber}</Text>
          </Pressable>

          <View style={styles.nodes}>
            {nodes.map((level) => {
              const stars = results[progressKey("campaign", level)]?.stars ?? 0;
              const current = level === levelNumber;
              const open = level <= levelNumber;
              return (
                <Pressable
                  key={level}
                  disabled={!open}
                  onPress={() => router.push({ pathname: "/intro", params: { source: "campaign", level: String(level) } })}
                  style={[styles.node, current && styles.nodeNow, !open && styles.nodeLocked]}
                >
                  <Text style={[styles.nodeText, current && styles.nodeTextNow]}>{open ? level : "🔒"}</Text>
                  {open ? <Text style={styles.stars}>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</Text> : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.dock}>
            <DockButton label="Skins" source={art.skins} onPress={() => router.push({ pathname: "/skins", params: { tab: "Blocks" } })} />
            <DockButton label="Trays" source={art.trays} onPress={() => router.push({ pathname: "/skins", params: { tab: "Trays" } })} />
            <DockButton label="Worlds" source={art.worlds} onPress={() => router.push("/worlds")} />
            <DockButton label="Shop" source={art.shop} />
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}

function levelWindow(levelNumber: number): number[] {
  const start = Math.max(1, levelNumber - 3);
  return Array.from({ length: 6 }, (_, index) => start + index);
}

function CurrencyChip({ source }: { source: number }) {
  return (
    <View style={styles.chip}>
      <Image source={source} style={styles.chipIcon} />
      <Text style={styles.chipValue}>0</Text>
      <View style={styles.plus}>
        <Text style={styles.plusText}>+</Text>
      </View>
    </View>
  );
}

function RailButton({
  label,
  source,
  badge = false,
  onPress,
}: {
  label: string;
  source: number;
  badge?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.railButton}>
      <Image source={source} style={styles.railIcon} />
      <Text style={styles.railLabel}>{label}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>1</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function DockButton({ label, source, onPress }: { label: string; source: number; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.dockButton}>
      <Image source={source} style={styles.dockIcon} />
      <Text style={styles.dockLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#E7C49A" },
  background: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  screen: { flex: 1, backgroundColor: "transparent", paddingHorizontal: 12 },
  scroll: { paddingBottom: 12 },
  top: { flexDirection: "row", alignItems: "center", gap: 6 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF8EF",
    borderRadius: 22,
    paddingRight: 8,
    paddingVertical: 4,
    paddingLeft: 4,
    flexShrink: 1,
  },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  profileCopy: { width: 72 },
  player: { fontWeight: "900", color: colors.ink, fontSize: 12 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: "#E7D3BC", marginTop: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: "#F6C445" },
  level: { fontWeight: "900", color: colors.inkSoft, fontSize: 11 },
  currencies: { flexDirection: "row", gap: 4, marginLeft: "auto" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EF",
    borderRadius: 16,
    paddingLeft: 4,
    paddingRight: 3,
    paddingVertical: 3,
    gap: 3,
  },
  chipIcon: { width: 18, height: 18 },
  chipValue: { fontWeight: "900", color: colors.ink, fontSize: 12 },
  plus: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#F6C445", alignItems: "center", justifyContent: "center" },
  plusText: { color: "#FFF8EF", fontWeight: "900", fontSize: 12, lineHeight: 14 },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#5C4033",
    alignItems: "center",
    justifyContent: "center",
  },
  gearIcon: { width: 24, height: 24 },
  logo: { width: "78%", height: 72, alignSelf: "center", marginTop: 4 },
  tag: { textAlign: "center", color: colors.ink, fontWeight: "800", marginBottom: 4 },
  stage: { flexDirection: "row", alignItems: "flex-end", minHeight: 230 },
  rail: { width: 74, gap: 8, marginBottom: 28 },
  railButton: {
    backgroundColor: "#5C4033",
    borderRadius: 16,
    padding: 6,
    alignItems: "center",
    minHeight: 68,
  },
  railIcon: { width: 30, height: 30, borderRadius: 8 },
  railLabel: { color: "#FFF8EF", fontSize: 9, fontWeight: "800", textAlign: "center", marginTop: 3 },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#E15B4A",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#FFF8EF", fontSize: 11, fontWeight: "900" },
  scene: { flex: 1, height: 230 },
  diorama: { width: "100%", height: 210 },
  mascot: { position: "absolute", right: 0, bottom: 18, alignItems: "flex-end" },
  bubble: {
    backgroundColor: "#FFF8EF",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    maxWidth: 108,
    marginBottom: 2,
  },
  bubbleText: { color: colors.ink, fontSize: 11, fontWeight: "800", textAlign: "center" },
  tabi: { width: 108, height: 132 },
  worldCard: {
    marginTop: -36,
    backgroundColor: "#FFF6E8",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#C48A4A",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  arrow: { width: 36, alignItems: "center" },
  arrowText: { fontSize: 28, color: colors.ink, fontWeight: "700" },
  worldCopy: { flex: 1, alignItems: "center" },
  worldKicker: { color: colors.inkSoft, fontWeight: "800", fontSize: 12 },
  worldName: { fontSize: 22, fontWeight: "900", color: colors.ink },
  worldSub: { color: colors.inkSoft, fontWeight: "700", textAlign: "center", fontSize: 12 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#C9A27A" },
  dotOn: { backgroundColor: "#F6C445", width: 16 },
  play: {
    marginTop: 10,
    backgroundColor: "#F6C445",
    borderRadius: 32,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 4,
    borderBottomColor: "#D89A22",
  },
  playLabel: { fontSize: 28, fontWeight: "900", color: "#FFF8EF" },
  playLevel: { color: "#FFF8EF", fontWeight: "800", marginTop: -2 },
  nodes: { flexDirection: "row", gap: 6, marginTop: 12 },
  node: {
    flex: 1,
    backgroundColor: "#FFF8EF",
    borderRadius: 14,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  nodeNow: { backgroundColor: "#3C2A22" },
  nodeLocked: { backgroundColor: "#E4D3C0" },
  nodeText: { fontWeight: "900", color: colors.ink, fontSize: 16 },
  nodeTextNow: { color: "#F6C445" },
  stars: { color: "#E0A106", fontSize: 8, marginTop: 2 },
  dock: {
    marginTop: 14,
    backgroundColor: "#5C4033",
    borderRadius: 22,
    flexDirection: "row",
    padding: 8,
  },
  dockButton: { flex: 1, alignItems: "center", paddingVertical: 6 },
  dockIcon: { width: 36, height: 36, borderRadius: 10 },
  dockLabel: { color: "#FFF8EF", fontWeight: "800", marginTop: 4, fontSize: 11 },
});
