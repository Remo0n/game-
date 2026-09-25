import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Screen } from "../src/components/ui";
import { formatDate, secondsUntilMidnight, weekKey } from "../src/engine/generator/daily";
import { useProgress } from "../src/game/progressStore";
import { colors } from "../src/theme/theme";

export default function DailyScreen() {
  const [now, setNow] = useState(() => new Date());
  const completed = useProgress((state) => state.dailyCompletedDate);
  const streak = useProgress((state) => state.streak);
  const weekly = useProgress((state) => state.weeklyDailyCount);
  const date = formatDate(now);
  const done = completed === date;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remain = secondsUntilMidnight(now);
  const clock = `${Math.floor(remain / 3600)}:${String(Math.floor((remain % 3600) / 60)).padStart(2, "0")}:${String(remain % 60).padStart(2, "0")}`;

  return (
    <Screen>
      <Text style={styles.title}>Daily Challenge</Text>
      <Text style={styles.sub}>{date}</Text>
      <View style={styles.card}>
        <Text style={styles.clock}>{clock}</Text>
        <Text style={styles.sub}>Streak {streak} · this week {weekly}/3</Text>
        <Text style={styles.sub}>Complete 3 challenges this week to get a special skin.</Text>
      </View>
      <Button
        label={done ? "Already solved today" : "Play"}
        disabled={done}
        onPress={() => router.push({ pathname: "/intro", params: { source: "daily", date, level: "7" } })}
      />
      <Text style={styles.week}>Week {weekKey(now)}</Text>
      <Button label="Back" tone="cream" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: colors.ink },
  sub: { color: colors.inkSoft, fontWeight: "700", marginTop: 6 },
  card: { backgroundColor: colors.cream, borderRadius: 24, padding: 16, marginVertical: 16 },
  clock: { fontSize: 28, fontWeight: "900", color: colors.ink },
  week: { textAlign: "center", marginVertical: 12, color: colors.inkSoft },
});
