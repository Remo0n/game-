import "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { useCallback, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { LaunchReadyContext, SplashIntro } from "../src/components/SplashIntro";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../src/theme/theme";
import { View } from "react-native";
import { Button } from "../src/components/ui";
import { Text } from "../src/components/Typography";
import { AudioFeedback } from "../src/components/AudioFeedback";
import {
  resetUnreadableProgress,
  useProgress,
  useSaveStatus,
} from "../src/game/progressStore";
import type { ErrorBoundaryProps } from "expo-router";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { hydrated, loadError, saveError } = useSaveStatus();
  const [confirmRecovery, setConfirmRecovery] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular: require("@expo-google-fonts/outfit/400Regular/Outfit_400Regular.ttf"),
    Outfit_600SemiBold: require("@expo-google-fonts/outfit/600SemiBold/Outfit_600SemiBold.ttf"),
    Outfit_700Bold: require("@expo-google-fonts/outfit/700Bold/Outfit_700Bold.ttf"),
    Outfit_800ExtraBold: require("@expo-google-fonts/outfit/800ExtraBold/Outfit_800ExtraBold.ttf"),
  });
  const [showSplash, setShowSplash] = useState(true);
  const finishSplash = useCallback(() => setShowSplash(false), []);
  if (!fontsLoaded && !fontError) return null;
  return (
    <GestureHandlerRootView
      onLayout={() => {
        void SplashScreen.hideAsync().catch(() => {});
      }}
      style={{ flex: 1, backgroundColor: colors.paper }}
    >
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AudioFeedback />
        {saveError && hydrated && (
          <View style={{ padding: 16, backgroundColor: colors.peach }}>
            <Text accessibilityRole="alert">
              Progress could not be saved. Check your device storage before
              closing the game.
            </Text>
            <Button
              label="Try saving again"
              tone="cream"
              onPress={() =>
                useProgress
                  .getState()
                  .setSound(useProgress.getState().soundEnabled)
              }
            />
          </View>
        )}
        {!hydrated ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              padding: 32,
              gap: 20,
              maxWidth: 560,
              alignSelf: "center",
            }}
          >
            <Text style={{ fontSize: 22, color: colors.ink }}>
              {loadError
                ? "Your saved bento couldn’t be opened"
                : "Opening your kitchen…"}
            </Text>
            {loadError && (
              <>
                {confirmRecovery ? (
                  <>
                    <Text>
                      This permanently erases the unreadable save, including all
                      stars, levels, tools, and preferences on this device. It
                      cannot be undone.
                    </Text>
                    <Button
                      label="Keep my save"
                      onPress={() => setConfirmRecovery(false)}
                    />
                    <Button
                      label="Erase and start again"
                      tone="cream"
                      onPress={() => void resetUnreadableProgress()}
                    />
                    {saveError && (
                      <Text accessibilityRole="alert">
                        Storage is still unavailable. Make room on your device
                        before trying again.
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text>
                      Your progress has not been replaced. Make sure device
                      storage is available, then try again.
                    </Text>
                    <Button
                      label="Try again"
                      onPress={() => void useProgress.persist.rehydrate()}
                    />
                    <Button
                      label="Reset unreadable save"
                      tone="cream"
                      onPress={() => setConfirmRecovery(true)}
                    />
                  </>
                )}
              </>
            )}
          </View>
        ) : (
          <LaunchReadyContext.Provider value={!showSplash}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
                contentStyle: { backgroundColor: colors.paper },
              }}
            />
            {showSplash && <SplashIntro onFinish={finishSplash} />}
          </LaunchReadyContext.Provider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.paper,
        padding: 32,
        justifyContent: "center",
        gap: 20,
      }}
    >
      <Text style={{ fontSize: 26, color: colors.ink }}>
        Let’s try that again
      </Text>
      <Text>
        The game ran into a problem. Your previously saved progress stays on
        this device.
      </Text>
      <Button label="Try again" onPress={() => void retry()} />
    </View>
  );
}
