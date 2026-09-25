import { Text } from "../src/components/Typography";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { BentoArt } from "../src/components/BentoArt";
import { Icon } from "../src/components/Icon";
import { Button, Eyebrow, Page, Panel, textStyles } from "../src/components/ui";
import { colors } from "../src/theme/theme";
const STEPS = [
  {
    icon: "cut",
    title: "A little slice",
    copy: "Choose Cut. Swipe across a block along the grid to split it. Your cut counter shows what’s left.",
  },
  {
    icon: "move",
    title: "Find its place",
    copy: "Choose Move. Drag each piece into the tray. Tap a piece to select it, then rotate if the level allows it.",
  },
  {
    icon: "check",
    title: "That perfect fit",
    copy: "Fill every square with no overlaps. Fewer cuts and hints earn more stars. Undo is always there for you.",
  },
] as const;
export default function HowToScreen() {
  return (
    <Page
      title="A recipe for a perfect fit"
      subtitle="Easy to learn. Lovely to master."
    >
      <View style={styles.art}>
        <BentoArt />
      </View>
      <Eyebrow>Three simple ingredients</Eyebrow>
      {STEPS.map((step, i) => (
        <Panel key={step.title} style={{ flexDirection: "row", gap: 18 }}>
          <View style={styles.icon}>
            <Icon name={step.icon} color={colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={textStyles.heading}>
              {i + 1}. {step.title}
            </Text>
            <Text style={textStyles.body}>{step.copy}</Text>
          </View>
        </Panel>
      ))}
      <Button
        label="Back to the kitchen"
        icon="arrow"
        onPress={() => router.replace("/home")}
      />
    </Page>
  );
}
const styles = StyleSheet.create({
  art: { height: 210, backgroundColor: colors.sage, borderRadius: 26 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.sage,
  },
});
