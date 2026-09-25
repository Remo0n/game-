import { Page, Panel, textStyles } from "../src/components/ui";
import { Text } from "../src/components/Typography";
import { release } from "../src/game/release";
export default function PrivacyScreen() {
  return (
    <Page
      title="Privacy, simply"
      subtitle="Last updated September 25, 2026"
      icon="check"
    >
      <Panel>
        <Text style={textStyles.heading}>Your game stays on your device</Text>
        <Text style={textStyles.body}>
          Bento Blocks saves completed levels, stars, earned tools, daily
          challenge dates, and your preferences on this device. There is no
          account or cloud sync. Clearing browser storage or removing the app
          may delete your progress.
        </Text>
      </Panel>
      <Panel>
        <Text style={textStyles.heading}>No ads or tracking in this build</Text>
        <Text style={textStyles.body}>
          This version includes no advertising, analytics, or third-party
          tracking SDKs. Fonts, illustrations, puzzles, and sound effects are
          bundled with the game. The app does not request camera, microphone,
          location, or contacts access.
        </Text>
      </Panel>
      <Panel>
        <Text style={textStyles.heading}>You choose what to share</Text>
        <Text style={textStyles.body}>
          Sharing a result opens your device’s share sheet, or copies result
          text in supported browsers. Nothing is shared until you choose. If you
          email support, your email provider and the support inbox receive the
          information you send.
        </Text>
      </Panel>
      <Panel>
        <Text style={textStyles.heading}>Web hosting and your choices</Text>
        <Text style={textStyles.body}>
          When you open the web game, the hosting service receives the network
          information needed to serve it, such as your IP address. Hosting log
          retention and provider details must be confirmed before the public
          launch. You can erase locally saved game data from Settings → Reset
          saved progress.
        </Text>
      </Panel>
      <Panel>
        <Text style={textStyles.heading}>Contact</Text>
        <Text style={textStyles.body}>
          {release.developer && release.supportEmail
            ? `${release.developer}\n${release.supportEmail}`
            : "This is a preview. The developer identity and privacy contact will be added before public release."}
        </Text>
      </Panel>
    </Page>
  );
}
