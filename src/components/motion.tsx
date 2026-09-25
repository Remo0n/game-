import { useEffect, useState } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const MotionPressable = Animated.createAnimatedComponent(Pressable);

/** Shared, interruptible press feedback. Reanimated respects the system's reduced-motion setting. */
export function AnimatedPressable({
  style,
  onPressIn,
  onPressOut,
  children,
  ...props
}: PressableProps) {
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);
  const motion = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <MotionPressable
      {...props}
      style={[typeof style === "function" ? style({ pressed }) : style, motion]}
      onPressIn={(event) => {
        setPressed(true);
        scale.value = withSpring(0.96, { damping: 18, stiffness: 350 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
        onPressOut?.(event);
      }}
    >
      {typeof children === "function" ? children({ pressed }) : children}
    </MotionPressable>
  );
}
export function ProgressFill({
  value,
  style,
}: {
  value: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(value);
  useEffect(() => {
    progress.value = withTiming(value, { duration: 400 });
  }, [value]);
  const motion = useAnimatedStyle(() => ({
    width: `${progress.value}%` as `${number}%`,
  }));
  return <Animated.View style={[style, motion]} />;
}
