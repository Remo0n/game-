import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Tabi } from "../src/components/Tabi";
import { Button, Screen } from "../src/components/ui";
import { useProgress } from "../src/game/progressStore";
import { colors, WORLDS, worldForLevel } from "../src/theme/theme";

export default function WorldsScreen() {
  const levelNumber = useProgress((state) => state.levelNumber);
  const totalStars = useProgress((state) => state.totalStars);
  const results = useProgress((state) => state.results);
  const world = worldForLevel(levelNumber);

  return (
    <Screen>
      <Text style={styles.kicker}>Tabi the Cat</Text>
      <Text style={styles.title}>Worlds</Text>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
        {WORLDS.map((item) => {
          const unlocked = totalStars >= item.unlockStars;
          const cleared = Array.from({ length: 30 }, (_, index) => bandStartOf(item.start) + index).filter((level) => {
            const key = Object.keys(results).find((entry) => entry.endsWith(`:campaign:${level}`));
            return key ? results[key].stars > 0 : false;
          }).length;
          return (
            <View key={item.id} style={[styles.card, !unlocked && styles.locked]}>
              <Text style={styles.cardTitle}>{unlocked ? item.name : `${item.name}  locked`}</Text>
              <Text style={styles.sub}>{item.subtitle}</Text>
              <Text style={styles.sub}>{unlocked ? `${Math.min(30, cleared)}/30 cleared · ${item.unlockStars} stars to open` : `Needs ${item.unlockStars} stars`}</Text>
            </View>
          );
        })}
        <Text style={styles.sub}>Level {levelNumber} · {world.name} · {totalStars} stars</Text>
        <View style={styles.path}>
          {Array.from({ length: 30 }, (_, index) => {
            const level = (levelNumber <= 90 ? world.start : Math.floor((levelNumber - 1) / 30) * 30 + 1) + index;
            const done = Object.entries(results).some(([key, value]) => key.endsWith(`:campaign:${level}`) && value.stars > 0);
            const open = totalStars >= world.unlockStars && level <= levelNumber;
            return (
              <Pressable
                key={level}
                disabled={!open}
                onPress={() => router.push({ pathname: "/intro", params: { source: "campaign", level: String(level) } })}
                style={[styles.node, done && styles.nodeDone, level === levelNumber && styles.nodeNow]}
              >
                <Text style={styles.nodeText}>{level}</Text>
              </Pressable>
            );
          })}
        </View>
        <Tabi size={84} />
        <Button
          label={totalStars >= worldForLevel(levelNumber).unlockStars ? `Play level ${levelNumber}` : "Earn stars to continue"}
          disabled={totalStars < worldForLevel(levelNumber).unlockStars}
          onPress={() => router.push({ pathname: "/intro", params: { source: "campaign", level: String(levelNumber) } })}
        />
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function bandStartOf(start: number): number {
  return start;
}

const styles = StyleSheet.create({
  kicker: { color: colors.inkSoft, fontWeight: "700" },
  title: { fontSize: 34, fontWeight: "900", color: colors.ink, marginBottom: 8 },
  card: { backgroundColor: colors.cream, borderRadius: 22, padding: 14 },
  locked: { opacity: 0.55 },
  cardTitle: { fontSize: 20, fontWeight: "800", color: colors.ink },
  sub: { color: colors.inkSoft, marginTop: 4 },
  path: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  node: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E7D3BC",
    alignItems: "center",
    justifyContent: "center",
  },
  nodeDone: { backgroundColor: colors.good },
  nodeNow: { borderWidth: 3, borderColor: colors.accent },
  nodeText: { color: colors.ink, fontWeight: "800", fontSize: 12 },
  back: { textAlign: "center", color: colors.inkSoft, fontWeight: "700", marginTop: 8 },
});
