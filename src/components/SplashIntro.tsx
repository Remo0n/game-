import { Text } from "./Typography";
import { createContext, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { FoodArt } from "./FoodArt";
import { colors, fonts } from "../theme/theme";

export const LaunchReadyContext = createContext(true);

/** Covers every cold launch, including web refreshes and deep links, without changing the route. */
export function SplashIntro({ onFinish }: { onFinish: () => void }) {
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const timer = setTimeout(onFinish, reducedMotion ? 450 : 2200);
    return () => clearTimeout(timer);
  }, [onFinish, reducedMotion]);
  return (
    <Animated.View
      testID="launch-splash"
      accessibilityViewIsModal
      exiting={FadeOut.duration(240)}
      style={styles.splash}
    >
      <View style={styles.halo} />
      <Animated.Text entering={FadeIn.duration(450)} style={styles.eyebrow}>
        A LITTLE POCKET OF PLAY
      </Animated.Text>
      <View style={styles.tray}>
        <View style={styles.trayInset} />
        {["sushi", "sandwich", "salmon", "egg"].map((id, index) => (
          <SplashBite key={id} id={id} index={index} />
        ))}
      </View>
      <Animated.View
        entering={FadeInDown.delay(250).duration(600)}
        style={styles.wordmark}
      >
        <Text accessibilityRole="header" style={styles.title}>
          Bento Blocks
        </Text>
        <Text style={styles.subtitle}>Slice. Pack. Find your happy place.</Text>
      </Animated.View>
      <Animated.View
        entering={FadeIn.delay(550).duration(400)}
        style={styles.dots}
      >
        {[0, 1, 2].map((index) => (
          <LoadingDot key={index} index={index} />
        ))}
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip splash screen"
        onPress={onFinish}
        style={styles.skip}
      >
        <Text style={styles.skipText}>Let’s play →</Text>
      </Pressable>
    </Animated.View>
  );
}
function SplashBite({ id, index }: { id: string; index: number }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    progress.value = withDelay(
      index * 160 + 100,
      withSpring(1, { damping: 13, stiffness: 150 }),
    );
  }, []);
  const motion = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * -65 },
      { scale: 0.6 + 0.4 * progress.value },
      { rotate: `${(1 - progress.value) * (index % 2 ? 25 : -25)}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.bite,
        {
          left: 23 + (index % 2) * 90,
          top: 23 + Math.floor(index / 2) * 90,
          backgroundColor: ["#E4EDD5", "#F8DCA8", "#F8D5C0", "#F9E9A2"][index],
        },
        motion,
      ]}
    >
      <FoodArt id={id} size={77} variant={index} />
    </Animated.View>
  );
}
function LoadingDot({ index }: { index: number }) {
  const progress = useSharedValue(0.3);
  useEffect(() => {
    progress.value = withDelay(
      700 + index * 280,
      withTiming(1, { duration: 350 }),
    );
  }, []);
  const motion = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.7 + 0.3 * progress.value }],
  }));
  return <Animated.View style={[styles.dot, motion]} />;
}
const styles = StyleSheet.create({
  splash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  halo: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#E8EDDCC0",
    marginTop: -100,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 2.6,
    color: colors.accent,
    fontWeight: "700",
    marginBottom: 30,
  },
  tray: {
    width: 222,
    height: 222,
    backgroundColor: "#D1AD79",
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#B9915C",
    transform: [{ rotate: "-7deg" }],
    shadowColor: "#7C663F",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 15 },
  },
  trayInset: {
    position: "absolute",
    left: 9,
    right: 9,
    top: 9,
    bottom: 9,
    borderRadius: 25,
    backgroundColor: "#EBD1A2",
  },
  bite: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderBottomWidth: 4,
    borderColor: "#A88A5830",
  },
  wordmark: { alignItems: "center", marginTop: 38, gap: 12 },
  title: {
    fontFamily: fonts.display,
    fontSize: 42,
    letterSpacing: -1.6,
    color: colors.ink,
  },
  subtitle: { fontSize: 13, color: colors.inkSoft },
  dots: { flexDirection: "row", gap: 8, marginTop: 30 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  skip: {
    position: "absolute",
    bottom: 38,
    minHeight: 48,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  skipText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
});
