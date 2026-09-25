import { router } from "expo-router";
import { Button, Page, Panel, textStyles } from "./ui";
import { Text } from "./Typography";
export function GameUnavailable({
  message = "This puzzle link is incomplete or no longer available.",
}: {
  message?: string;
}) {
  return (
    <Page title="Let’s find your next bento" subtitle={message}>
      <Panel>
        <Text style={textStyles.body}>
          Your saved progress is still here. Continue from the kitchen or choose
          a completed level to replay.
        </Text>
      </Panel>
      <Button
        label="Back to the kitchen"
        icon="home"
        onPress={() => router.replace("/home")}
      />
    </Page>
  );
}
