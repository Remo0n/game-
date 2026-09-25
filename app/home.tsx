import { Text } from "../src/components/Typography";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { BentoArt } from "../src/components/BentoArt";
import { Icon } from "../src/components/Icon";
import {
  Button,
  Eyebrow,
  IconButton,
  Navigation,
  Screen,
  Stars,
} from "../src/components/ui";
import { formatDate } from "../src/engine/generator/daily";
import { progressKey, useProgress } from "../src/game/progressStore";
import { colors, fonts, WORLDS, worldForLevel } from "../src/theme/theme";

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const desktop = width >= 800;
  const { levelNumber, totalStars, results, dailyCompletedDate } =
    useProgress();
  const world = worldForLevel(levelNumber);
  const currentWorld = WORLDS.indexOf(world) + 1;
  const start = Math.floor((levelNumber - 1) / 30) * 30 + 1;
  const cleared = Array.from(
    { length: 30 },
    (_, i) => results[progressKey("campaign", start + i)],
  ).filter(Boolean).length;
  const dailyDone = dailyCompletedDate === formatDate(new Date());
  const play = () =>
    router.push({
      pathname: "/play",
      params: { source: "campaign", level: String(levelNumber) },
    });
  const nodes = Array.from(
    { length: 5 },
    (_, i) => Math.max(start, levelNumber - 2) + i,
  ).filter((n) => n < start + 30);
  return (
    <Screen wide>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Icon name="grid" size={22} color={colors.cream} />
          </View>
          <Text style={[styles.brandText, width < 380 && { fontSize: 22 }]}>
            bento blocks<Text style={{ color: colors.coral }}>.</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View
            accessibilityLabel={`${totalStars} stars earned`}
            style={styles.starChip}
          >
            <Icon name="star" size={17} color={colors.gold} filled />
            <Text style={styles.starCount}>{totalStars}</Text>
            {desktop && <Text style={styles.starCaption}>stars collected</Text>}
          </View>
          <IconButton
            name="settings"
            label="Settings"
            onPress={() => router.push("/settings")}
          />
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.greeting,
            desktop && {
              marginTop: height < 820 ? 20 : 30,
              marginBottom: height < 820 ? 20 : 30,
            },
          ]}
        >
          <View style={styles.eyebrowRow}>
            <View style={styles.tinyDot} />
            <Eyebrow>A small moment, just for you</Eyebrow>
          </View>
          <Text
            style={[styles.title, desktop && { fontSize: 52, lineHeight: 61 }]}
          >
            A little pause.{desktop ? " " : "\n"}
            <Text style={styles.titleAccent}>A perfect fit.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Slice, arrange, and find your flow.
          </Text>
        </View>
        <View style={[styles.main, desktop && styles.mainWide]}>
          <View
            style={[
              styles.hero,
              desktop && { flex: 1.65, minHeight: height < 820 ? 340 : 420 },
            ]}
          >
            <View style={styles.heroTop}>
              <Eyebrow color={colors.accent}>
                {desktop ? "Your next little challenge" : "Your next bento"}
              </Eyebrow>
              <View style={styles.pill}>
                <View style={styles.tinyDot} />
                <Text style={styles.pillText}>No rush</Text>
              </View>
            </View>
            <View
              style={[
                styles.art,
                {
                  height: desktop
                    ? height < 820
                      ? 200
                      : 260
                    : height < 740
                      ? 180
                      : 225,
                },
              ]}
            >
              <BentoArt />
            </View>
            <View
              style={[
                styles.heroBottom,
                width < 380 && {
                  flexDirection: "column",
                  alignItems: "stretch",
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[styles.worldTitle, !desktop && { fontSize: 20 }]}
                >
                  {world.name}
                </Text>
                <Text style={styles.heroSub}>
                  World {String(currentWorld).padStart(2, "0")} · Level{" "}
                  {levelNumber}
                </Text>
              </View>
              <View style={{ minWidth: desktop ? 180 : 144 }}>
                <Button
                  label={`Play level ${levelNumber}`}
                  icon="arrow"
                  onPress={play}
                  disabled={totalStars < world.unlockStars}
                />
              </View>
            </View>
          </View>
          <View style={[styles.side, desktop && { flex: 1 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                dailyDone
                  ? "View completed daily bento"
                  : "Play the daily bento"
              }
              onPress={() => router.push("/daily")}
              style={({ pressed }) => [
                styles.daily,
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.sunBadge}>
                  <Icon
                    name={dailyDone ? "check" : "sun"}
                    size={25}
                    color="#9D7541"
                  />
                </View>
                <Text style={styles.smallTag}>
                  {dailyDone ? "COMPLETE" : "FRESH TODAY"}
                </Text>
              </View>
              <Text style={styles.cardTitle}>The daily bento</Text>
              <Text style={styles.cardCopy}>
                {dailyDone
                  ? "Beautifully packed. A fresh puzzle arrives tomorrow."
                  : "One fresh puzzle. A delicious little ritual."}
              </Text>
              <View style={styles.textLink}>
                <Text style={styles.linkText}>
                  {dailyDone ? "View your streak" : "Give it a taste"}
                </Text>
                <Icon name="arrow" size={18} />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/skins")}
              style={({ pressed }) => [
                styles.collection,
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.swatches}>
                <View
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: colors.coral,
                      transform: [{ rotate: "-12deg" }],
                    },
                  ]}
                />
                <View
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: "#E8CA78",
                      marginLeft: -12,
                      transform: [{ rotate: "9deg" }],
                    },
                  ]}
                />
                <View
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: "#91A97D",
                      marginLeft: -12,
                      transform: [{ rotate: "-5deg" }],
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.collectionTitle}>Make it yours</Text>
                <Text style={styles.cardCopy}>
                  A little flavor for your bento.
                </Text>
              </View>
              <Icon name="arrow" size={20} />
            </Pressable>
          </View>
        </View>
        <View style={styles.journey}>
          <View style={styles.sectionHeading}>
            <View>
              <Eyebrow>Your journey</Eyebrow>
              <Text style={styles.journeyTitle}>
                One lovely little level at a time.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/worlds")}
              style={styles.allLevels}
            >
              <Text style={styles.linkText}>All levels</Text>
              <Icon name="arrow" size={17} />
            </Pressable>
          </View>
          <View
            style={[
              styles.journeyBody,
              desktop && {
                flexDirection: "row",
                alignItems: "center",
                gap: 42,
              },
            ]}
          >
            <View style={[styles.progressCopy, desktop && { width: 210 }]}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>{world.name}</Text>
                <Text style={styles.progressCount}>{cleared} / 30</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[styles.fill, { width: `${(cleared / 30) * 100}%` }]}
                />
              </View>
            </View>
            <View style={styles.nodes}>
              {nodes.map((n) => {
                const current = n === levelNumber;
                const open =
                  n <= levelNumber && totalStars >= world.unlockStars;
                const stars = results[progressKey("campaign", n)]?.stars ?? 0;
                return (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityLabel={`Level ${n}${!open ? ", locked" : current ? ", current" : `, ${stars} stars`}`}
                    disabled={!open}
                    onPress={() =>
                      router.push({
                        pathname: "/play",
                        params: { source: "campaign", level: String(n) },
                      })
                    }
                    style={[styles.node, current && styles.nodeCurrent]}
                  >
                    <View
                      style={[
                        styles.nodeCircle,
                        current && { backgroundColor: colors.accent },
                        !open && { backgroundColor: "#ECEEE4" },
                      ]}
                    >
                      {open ? (
                        <Text
                          style={[
                            styles.nodeNumber,
                            current && { color: colors.cream },
                          ]}
                        >
                          {n}
                        </Text>
                      ) : (
                        <Icon name="lock" size={17} color="#A2AA98" />
                      )}
                    </View>
                    {current ? (
                      <Text style={styles.nowLabel}>YOU ARE HERE</Text>
                    ) : stars > 0 ? (
                      <Stars value={stars} size={10} />
                    ) : (
                      <Text style={styles.levelLabel}>Level {n}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/how-to")}
          style={styles.footer}
        >
          <Icon name="help" size={16} color={colors.inkSoft} />
          <Text style={styles.footerText}>
            New to the kitchen? Here’s how to play.
          </Text>
        </Pressable>
      </ScrollView>
      <Navigation />
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    backgroundColor: colors.accent,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  brandText: {
    fontFamily: fonts.display,
    fontSize: 25,
    color: colors.ink,
    letterSpacing: -1,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  starChip: { flexDirection: "row", gap: 6, alignItems: "center" },
  starCount: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  starCaption: { color: colors.inkSoft, fontSize: 12 },
  content: { paddingBottom: 12 },
  greeting: { marginTop: 26, marginBottom: 25 },
  eyebrowRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  tinyDot: {
    height: 5,
    width: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 37,
    lineHeight: 44,
    letterSpacing: -1.3,
    color: colors.ink,
    marginTop: 12,
  },
  titleAccent: { color: colors.accent },
  subtitle: { color: colors.inkSoft, fontSize: 14, marginTop: 10 },
  main: { gap: 18 },
  mainWide: { flexDirection: "row" },
  hero: {
    backgroundColor: colors.sage,
    borderRadius: 28,
    padding: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DCE4CF",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    backgroundColor: "#F2F5EA",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  pillText: { fontSize: 10, color: colors.accent },
  art: { width: "100%", height: 225, marginVertical: 4 },
  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: "auto",
  },
  worldTitle: { fontFamily: fonts.display, color: colors.ink, fontSize: 25 },
  heroSub: { fontSize: 12, color: colors.inkSoft, marginTop: 6 },
  side: { gap: 16 },
  daily: {
    flex: 1,
    borderRadius: 26,
    padding: 26,
    backgroundColor: colors.peach,
    borderWidth: 1,
    borderColor: "#ECDAC7",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 19,
  },
  sunBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F4D9B8",
    alignItems: "center",
    justifyContent: "center",
  },
  smallTag: {
    fontSize: 9,
    fontWeight: "600",
    color: "#906D4A",
    letterSpacing: 1.4,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  cardCopy: {
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 6,
  },
  textLink: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 22,
  },
  linkText: { fontSize: 12, color: colors.ink, fontWeight: "600" },
  collection: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 22,
    minHeight: 113,
  },
  swatches: { flexDirection: "row", alignItems: "center", width: 64 },
  swatch: {
    width: 27,
    height: 35,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  collectionTitle: { fontSize: 16, color: colors.ink, fontWeight: "600" },
  journey: {
    marginTop: 28,
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  journeyTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginTop: 8,
    maxWidth: 230,
  },
  allLevels: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
  },
  journeyBody: { marginTop: 20, gap: 20 },
  progressCopy: { gap: 10 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressText: { fontSize: 12, color: colors.ink },
  progressCount: { fontSize: 11, color: colors.inkSoft },
  track: {
    height: 5,
    backgroundColor: colors.sage,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: colors.accent, borderRadius: 3 },
  nodes: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  node: { alignItems: "center", flex: 1, gap: 8 },
  nodeCurrent: {},
  nodeCircle: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeNumber: { color: colors.accent, fontSize: 15, fontWeight: "600" },
  nowLabel: {
    color: colors.accent,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  levelLabel: { color: colors.inkSoft, fontSize: 9 },
  footer: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  footerText: { color: colors.inkSoft, fontSize: 11 },
});
