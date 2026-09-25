import { Text } from "../src/components/Typography";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Icon } from "../src/components/Icon";
import { Eyebrow, Page, textStyles } from "../src/components/ui";
import { useProgress } from "../src/game/progressStore";
import { colors } from "../src/theme/theme";
const MODES = [
  {
    id: "NORMAL",
    name: "The classic",
    copy: "A comforting mix of cuts and clever fits.",
    icon: "grid",
  },
  {
    id: "ONE_CUT",
    name: "One perfect slice",
    copy: "Just one cut. Make it a good one.",
    icon: "cut",
  },
  {
    id: "NO_ROTATION",
    name: "As they are",
    copy: "Find a home for every piece without turning it.",
    icon: "lock",
  },
  {
    id: "EXACT_FIT",
    name: "Every little square",
    copy: "No gaps. No leftovers. A perfectly packed tray.",
    icon: "check",
  },
  {
    id: "TIMED",
    name: "Lunch rush",
    copy: "A little more pace. Beat the clock.",
    icon: "clock",
  },
  {
    id: "MULTI_BLOCK",
    name: "A mixed bento",
    copy: "More starting blocks, more possibilities.",
    icon: "palette",
  },
] as const;
export default function VariationsScreen() {
  const levels = useProgress((s) => s.variationLevel);
  return (
    <Page
      title="A change of flavor"
      subtitle="Six ways to find your flow"
      icon="spark"
    >
      {MODES.map((mode) => (
        <Pressable
          key={mode.id}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/play",
              params: {
                source: "variation",
                variation: mode.id,
                level: String(levels[mode.id]),
              },
            })
          }
          style={({ pressed }) => ({
            padding: 24,
            borderRadius: 24,
            backgroundColor: colors.cream,
            borderWidth: 1,
            borderColor: colors.line,
            gap: 16,
            flexDirection: "row",
            alignItems: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Icon name={mode.icon} size={26} color={colors.accent} />
          <View style={{ flex: 1, gap: 7 }}>
            <Eyebrow>Level {levels[mode.id]}</Eyebrow>
            <Text style={textStyles.heading}>{mode.name}</Text>
            <Text style={textStyles.body}>{mode.copy}</Text>
          </View>
          <Icon name="arrow" size={18} />
        </Pressable>
      ))}
    </Page>
  );
}
