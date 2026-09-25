import { Text } from "../src/components/Typography";
import { View } from "react-native";
import { Icon } from "../src/components/Icon";
import { Eyebrow, Page, Panel, textStyles } from "../src/components/ui";
import { useProgress } from "../src/game/progressStore";
import { colors } from "../src/theme/theme";
const TOOLS = [
  {
    name: "Laser slice",
    key: "laser",
    icon: "tools",
    copy: "Slice through a selected piece on a diagonal.",
  },
  {
    name: "Guided split",
    key: "lineSplit",
    icon: "cut",
    copy: "Let a guide find the right seam for your selected piece.",
  },
  {
    name: "A little turn",
    key: "rotate",
    icon: "rotate",
    copy: "Rotate a piece, even when rotation is locked.",
  },
  {
    name: "One more slice",
    key: "extraCut",
    icon: "spark",
    copy: "Add an extra cut to the current puzzle.",
  },
] as const;
export default function ToolsScreen() {
  const wallet = useProgress((s) => s.wallet);
  return (
    <Page
      title="A little helping hand"
      subtitle="Your collection of special tools"
      icon="tools"
    >
      <Text style={textStyles.body}>
        Earn a tool the first time you get three stars on a level. They’re
        optional, and you can keep up to three of each.
      </Text>
      {TOOLS.map((tool) => (
        <Panel
          key={tool.key}
          style={{ flexDirection: "row", alignItems: "center", gap: 18 }}
        >
          <Icon name={tool.icon} size={28} color={colors.accent} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={textStyles.heading}>{tool.name}</Text>
            <Text style={textStyles.body}>{tool.copy}</Text>
            <Eyebrow>{wallet[tool.key]} available</Eyebrow>
          </View>
        </Panel>
      ))}
    </Page>
  );
}
