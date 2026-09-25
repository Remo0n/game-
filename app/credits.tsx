import { Page, Panel, textStyles } from "../src/components/ui";
import { Text } from "../src/components/Typography";
import { outfitLicense } from "../src/game/fontLicense";
export default function CreditsScreen() {
  return (
    <Page title="Made with care" subtitle="Artwork, type & sound" icon="spark">
      <Panel>
        <Text style={textStyles.heading}>Bento illustrations & sounds</Text>
        <Text style={textStyles.body}>
          Food illustrations and interface icons are drawn for this game. Sound
          effects are original synthesized tones; no sampled recordings are
          used.
        </Text>
      </Panel>
      <Panel>
        <Text style={textStyles.heading}>Outfit typeface</Text>
        <Text style={textStyles.body}>{outfitLicense}</Text>
      </Panel>
      <Panel>
        <Text style={textStyles.heading}>Open-source foundations</Text>
        <Text style={textStyles.body}>
          Built with Expo, React, React Native, Expo Router, Zustand, React
          Native Reanimated, React Native Gesture Handler, and React Native SVG.
          Their license notices are included in the project’s dependency
          distributions.
        </Text>
      </Panel>
    </Page>
  );
}
