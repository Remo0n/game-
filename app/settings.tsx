import { Text } from "../src/components/Typography";
import { router } from "expo-router";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { Icon } from "../src/components/Icon";
import { Button, Eyebrow, Page, Panel, textStyles } from "../src/components/ui";
import { useProgress } from "../src/game/progressStore";
import { useState } from "react";
import { release } from "../src/game/release";
import { colors } from "../src/theme/theme";
export default function SettingsScreen() {
  const [confirmReset, setConfirmReset] = useState(false);
  const { soundEnabled, hapticsEnabled, setSound, setHaptics } = useProgress();
  return (
    <Page
      title="Make yourself at home"
      subtitle="The little things, just how you like them."
      icon="settings"
    >
      <Eyebrow>Your atmosphere</Eyebrow>
      <Panel>
        {[
          {
            label: "Sound",
            copy: "Soft sounds for every slice and snap",
            value: soundEnabled,
            change: setSound,
          },
          {
            label: "Haptics",
            copy: "A little feedback you can feel on your phone",
            value: hapticsEnabled,
            change: setHaptics,
          },
        ].map((item) => (
          <View key={item.label} style={styles.row}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={textStyles.heading}>{item.label}</Text>
              <Text style={styles.copy}>{item.copy}</Text>
            </View>
            <Switch
              accessibilityLabel={item.label}
              value={item.value}
              onValueChange={item.change}
              trackColor={{ true: colors.accent, false: colors.line }}
            />
          </View>
        ))}
      </Panel>
      <Eyebrow>Around the kitchen</Eyebrow>
      <Panel>
        {[
          { label: "How to play", icon: "help", route: "/how-to" },
          {
            label: "Different ways to play",
            icon: "grid",
            route: "/variations",
          },
          { label: "Your special tools", icon: "tools", route: "/tools" },
          { label: "Your collection", icon: "palette", route: "/skins" },
        ].map((item) => (
          <Pressable
            key={item.route}
            accessibilityRole="button"
            onPress={() => router.push(item.route as "/how-to")}
            style={styles.link}
          >
            <Text style={textStyles.heading}>{item.label}</Text>
            <Icon name="arrow" size={19} />
          </Pressable>
        ))}
      </Panel>
      <Eyebrow>Help & your data</Eyebrow>
      <Panel>
        {[
          { label: "Support", route: "/support" },
          { label: "Privacy", route: "/privacy" },
          { label: "Credits & licenses", route: "/credits" },
        ].map((item) => (
          <Pressable
            key={item.route}
            accessibilityRole="button"
            onPress={() => router.push(item.route as "/support")}
            style={styles.link}
          >
            <Text style={textStyles.heading}>{item.label}</Text>
            <Icon name="arrow" size={19} />
          </Pressable>
        ))}
        <Text style={styles.copy}>
          Progress is saved on this device. There is no cloud sync.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setConfirmReset(true)}
          style={styles.link}
        >
          <Text style={{ ...textStyles.heading, color: colors.bad }}>
            Reset saved progress
          </Text>
          <Icon name="reset" size={19} color={colors.bad} />
        </Pressable>
      </Panel>
      <Text style={styles.footer}>Bento Blocks · {release.version}</Text>
      <Modal
        transparent
        animationType="fade"
        visible={confirmReset}
        onRequestClose={() => setConfirmReset(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            backgroundColor: "#293D3277",
          }}
        >
          <Panel style={{ width: "100%", maxWidth: 440, maxHeight: "100%" }}>
            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <Text style={textStyles.heading}>Erase saved progress?</Text>
              <Text style={textStyles.body}>
                This removes all completed levels, stars, earned tools, daily
                streaks, and preferences from this device. This cannot be
                undone.
              </Text>
              <Button
                label="Keep my progress"
                onPress={() => setConfirmReset(false)}
              />
              <Button
                label="Erase and start again"
                tone="cream"
                onPress={() => {
                  useProgress.getState().resetProgress();
                  setConfirmReset(false);
                  router.replace("/home");
                }}
              />
            </ScrollView>
          </Panel>
        </View>
      </Modal>
      {__DEV__ && (
        <Pressable
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: "center" }}
          onPress={() => router.push("/debug")}
        >
          <Text style={styles.footer}>Generator inspector</Text>
        </Pressable>
      )}
    </Page>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingVertical: 12,
  },
  copy: { fontSize: 13, color: colors.inkSoft, lineHeight: 20 },
  link: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: { textAlign: "center", fontSize: 12, color: colors.inkSoft },
});
