import { Text } from "../src/components/Typography";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "../src/components/Icon";
import {
  Eyebrow,
  IconButton,
  Page,
  Panel,
  Stars,
  textStyles,
} from "../src/components/ui";
import { journeyPage } from "../src/game/journey";
import { progressKey, useProgress } from "../src/game/progressStore";
import { colors, fonts, WORLDS, worldForLevel } from "../src/theme/theme";
export default function WorldsScreen() {
  const { levelNumber, totalStars, results } = useProgress();
  const [selected, setSelected] = useState<string>(
    worldForLevel(levelNumber).id,
  );
  const [pages, setPages] = useState<Record<string, number>>({});
  const world = WORLDS.find((item) => item.id === selected) ?? WORLDS[0];
  const { start, end, page, lastPage } = journeyPage(
    world.start,
    levelNumber,
    pages[world.id],
  );
  const unlocked = totalStars >= world.unlockStars;
  return (
    <Page
      title="Your little journey"
      subtitle={`${totalStars} stars collected · A whole world of good fits`}
      icon="grid"
    >
      <Text style={textStyles.title}>Every bento is a new beginning.</Text>
      <View style={styles.worlds}>
        {WORLDS.map((item, i) => {
          const open = totalStars >= item.unlockStars;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === item.id }}
              onPress={() => setSelected(item.id)}
              style={[
                styles.world,
                selected === item.id && styles.worldSelected,
              ]}
            >
              <View style={styles.worldTop}>
                <Text style={styles.number}>0{i + 1}</Text>
                <Icon
                  name={open ? "grid" : "lock"}
                  size={18}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>
                {open ? item.subtitle : `Unlock with ${item.unlockStars} stars`}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Panel>
        <View style={styles.section}>
          <View style={{ flex: 1 }}>
            <Eyebrow>
              {unlocked
                ? "Pick a little challenge"
                : "Something to look forward to"}
            </Eyebrow>
            <Text style={styles.heading}>{world.name}</Text>
          </View>
          <Icon name={unlocked ? "spark" : "lock"} color={colors.accent} />
        </View>
        {!unlocked && (
          <Text style={textStyles.body}>
            Collect {world.unlockStars - totalStars} more stars by replaying
            earlier levels.
          </Text>
        )}
        {lastPage > 0 && (
          <View style={styles.pagination}>
            <IconButton
              name="back"
              label="Earlier levels in this world"
              disabled={page === 0}
              onPress={() =>
                setPages((current) => ({ ...current, [world.id]: page - 1 }))
              }
            />
            <Text accessibilityLiveRegion="polite" style={styles.sub}>
              Levels {start}–{end}
            </Text>
            <IconButton
              name="arrow"
              label="Later levels in this world"
              disabled={page === lastPage}
              onPress={() =>
                setPages((current) => ({ ...current, [world.id]: page + 1 }))
              }
            />
          </View>
        )}
        <View style={styles.path}>
          {Array.from({ length: 30 }, (_, i) => {
            const n = start + i,
              result = results[progressKey("campaign", n)],
              open = unlocked && n <= levelNumber,
              current = n === levelNumber;
            return (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={`Level ${n}${open ? (result ? `, ${result.stars} stars` : "") : ", locked"}`}
                disabled={!open}
                onPress={() =>
                  router.push({
                    pathname: "/play",
                    params: { source: "campaign", level: String(n) },
                  })
                }
                style={[
                  styles.node,
                  current && styles.current,
                  !open && { opacity: 0.5 },
                ]}
              >
                {open ? (
                  <Text
                    style={[styles.level, current && { color: colors.cream }]}
                  >
                    {n}
                  </Text>
                ) : (
                  <Icon name="lock" size={17} color={colors.inkSoft} />
                )}
                {result ? (
                  <Stars value={result.stars} size={9} />
                ) : (
                  <Text
                    style={[
                      styles.levelCaption,
                      current && { color: "#DFE8D6" },
                    ]}
                  >
                    {current ? "PLAY" : String(n).padStart(2, "0")}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </Panel>
    </Page>
  );
}
const styles = StyleSheet.create({
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  worlds: { gap: 12 },
  world: {
    padding: 20,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    gap: 6,
  },
  worldSelected: { backgroundColor: colors.sage, borderColor: "#A4B68E" },
  worldTop: { flexDirection: "row", justifyContent: "space-between" },
  number: { color: colors.accent, fontSize: 11, letterSpacing: 2 },
  name: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  sub: { fontSize: 13, color: colors.inkSoft },
  section: { flexDirection: "row", alignItems: "center" },
  heading: {
    fontFamily: fonts.display,
    fontSize: 27,
    color: colors.ink,
    marginTop: 8,
  },
  path: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  node: {
    width: "17%",
    minWidth: 42,
    flexGrow: 1,
    maxWidth: 90,
    minHeight: 68,
    borderRadius: 16,
    gap: 6,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  current: { backgroundColor: colors.accent },
  level: { fontWeight: "600", fontSize: 18, color: colors.ink },
  levelCaption: { fontSize: 8, letterSpacing: 1, color: colors.inkSoft },
});
