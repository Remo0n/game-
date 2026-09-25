import { Linking } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Button, Page, Panel, textStyles } from "../src/components/ui";
import { Text } from "../src/components/Typography";
import { release } from "../src/game/release";
export default function SupportScreen() {
  const [error, setError] = useState("");
  return (
    <Page
      title="A little help"
      subtitle={`Bento Blocks · Version ${release.version}`}
      icon="help"
    >
      <Panel>
        <Text style={textStyles.heading}>Need a hand with a puzzle?</Text>
        <Text style={textStyles.body}>
          Cut along a seam, then move each piece into the tray. Undo is always
          free. Hints and optional tools can help when you’re stuck.
        </Text>
        <Button
          label="How to play"
          tone="cream"
          onPress={() => router.push("/how-to")}
        />
      </Panel>
      <Panel>
        <Text style={textStyles.heading}>Progress and devices</Text>
        <Text style={textStyles.body}>
          Progress is saved on this device. Web, iOS, and Android saves are
          separate. Completed levels are saved automatically; leaving or
          refreshing during a puzzle starts that attempt again. Keep browser
          data if you want to keep your collection.
        </Text>
      </Panel>
      <Panel>
        <Text style={textStyles.heading}>Something went wrong?</Text>
        <Text style={textStyles.body}>
          Include your device model, app version, level number, and the steps
          that caused the problem. Please avoid including personal or sensitive
          information in screenshots.
        </Text>
        {release.supportEmail ? (
          <Button
            label="Email support"
            icon="share"
            onPress={() => {
              void Linking.openURL(
                `mailto:${release.supportEmail}?subject=Bento%20Blocks%20support%20${release.version}`,
              ).catch(() => setError(`Email us at ${release.supportEmail}`));
            }}
          />
        ) : (
          <Text style={textStyles.body}>
            A support contact will be available in the public release.
          </Text>
        )}
        {error ? <Text accessibilityLiveRegion="polite">{error}</Text> : null}
      </Panel>
      <Button
        label="Privacy"
        tone="cream"
        onPress={() => router.push("/privacy")}
      />
      <Button
        label="Credits & licenses"
        tone="cream"
        onPress={() => router.push("/credits")}
      />
    </Page>
  );
}
