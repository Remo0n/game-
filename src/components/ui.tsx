import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/theme";

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 12) }, style]}>
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  tone = "accent",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: "accent" | "cream" | "ink";
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "accent" && styles.accent,
        tone === "cream" && styles.cream,
        tone === "ink" && styles.ink,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, tone === "cream" && styles.creamText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: 18,
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  accent: { backgroundColor: colors.accent },
  cream: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line },
  ink: { backgroundColor: colors.ink },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.98 }] },
  buttonText: { color: "#FFF8EF", fontSize: 18, fontWeight: "800" },
  creamText: { color: colors.ink },
});
