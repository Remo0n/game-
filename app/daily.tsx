import { Text } from "../src/components/Typography";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { BentoArt } from "../src/components/BentoArt";
import { Icon } from "../src/components/Icon";
import { Button, Eyebrow, Page, Panel, textStyles } from "../src/components/ui";
import {
  formatDate,
  secondsUntilMidnight,
  weekKey,
} from "../src/engine/generator/daily";
import { useProgress } from "../src/game/progressStore";
import { colors, fonts } from "../src/theme/theme";
export default function DailyScreen() {
  const { width, fontScale } = useWindowDimensions();
  const [now, setNow] = useState(() => new Date());
  const {
    dailyCompletedDate,
    streak,
    weeklyDailyCount,
    weekKey: savedWeek,
  } = useProgress();
  const date = formatDate(now),
    done = dailyCompletedDate === date;
  const weekly = savedWeek === weekKey(now) ? weeklyDailyCount : 0;
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remain = secondsUntilMidnight(now);
  const clock = `${String(Math.floor(remain / 3600)).padStart(2, "0")}:${String(Math.floor((remain % 3600) / 60)).padStart(2, "0")}:${String(remain % 60).padStart(2, "0")}`;
  return (
    <Page
      title="The daily bento"
      subtitle={now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      icon="sun"
    >
      <View style={styles.hero}>
        <Eyebrow color="#99774F">Made fresh, every day</Eyebrow>
        <View style={styles.art}>
          <BentoArt variant="daily" />
        </View>
        <Text style={styles.title}>
          {done ? "Beautifully packed." : "A fresh little challenge."}
        </Text>
        <Text style={styles.copy}>
          {done
            ? "Your daily ritual is complete. See you tomorrow."
            : "A new arrangement to make your own. Take your time."}
        </Text>
      </View>
      <Button
        label={done ? "Today’s bento is complete" : "Pack today’s bento"}
        disabled={done}
        icon={done ? "check" : "arrow"}
        onPress={() =>
          router.push({
            pathname: "/play",
            params: { source: "daily", date, level: "7" },
          })
        }
      />
      <View
        style={[
          styles.stats,
          (width < 380 || fontScale > 1.15) && { flexDirection: "column" },
        ]}
      >
        <Panel style={{ flex: 1 }}>
          <Icon name="spark" color={colors.gold} />
          <Text style={styles.stat}>
            {streak} {streak === 1 ? "day" : "days"}
          </Text>
          <Text style={styles.small}>Current streak</Text>
        </Panel>
        <Panel style={{ flex: 1 }}>
          <Icon name="clock" color={colors.accent} />
          <Text style={styles.stat}>{clock}</Text>
          <Text style={styles.small}>Next fresh bento</Text>
        </Panel>
      </View>
      <Panel>
        <Eyebrow>A treat for your collection</Eyebrow>
        <Text style={textStyles.heading}>Three days. One special skin.</Text>
        <View style={styles.stamps}>
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={[
                styles.stamp,
                n <= weekly && { backgroundColor: colors.accent },
              ]}
            >
              <Icon
                name={n <= weekly ? "check" : "sun"}
                color={n <= weekly ? colors.cream : "#A9B19E"}
              />
            </View>
          ))}
        </View>
        <Text style={textStyles.body}>
          {Math.min(weekly, 3)} of 3 challenges completed this week.
        </Text>
      </Panel>
    </Page>
  );
}
const styles = StyleSheet.create({
  hero: {
    padding: 24,
    backgroundColor: colors.peach,
    borderRadius: 28,
    alignItems: "center",
  },
  art: { height: 230, width: "100%" },
  title: {
    fontFamily: fonts.display,
    fontSize: 29,
    color: colors.ink,
    textAlign: "center",
  },
  copy: {
    marginTop: 10,
    color: colors.inkSoft,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
  },
  stats: { flexDirection: "row", gap: 12 },
  stat: { fontSize: 23, color: colors.ink, fontFamily: fonts.display },
  small: { color: colors.inkSoft, fontSize: 12 },
  stamps: { flexDirection: "row", gap: 12, marginVertical: 6 },
  stamp: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.sage,
  },
});
