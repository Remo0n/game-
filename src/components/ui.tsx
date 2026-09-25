import { Text } from "./Typography";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { AnimatedPressable } from "./motion";
import { ReactNode } from "react";
import { router, usePathname } from "expo-router";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "../theme/theme";
import { Icon, IconName } from "./Icon";

export function Screen({
  children,
  style,
  wide = false,
}: {
  children: ReactNode;
  style?: ViewStyle;
  wide?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.outer}>
      <View
        style={[
          styles.screen,
          {
            maxWidth: wide ? 1144 : 760,
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 16),
          },
          style,
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
}
export function Page({
  children,
  title,
  subtitle,
  icon,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: IconName;
}) {
  return (
    <Screen>
      <Header title={title} subtitle={subtitle} icon={icon} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 20, paddingBottom: 28 }}
      >
        {children}
      </ScrollView>
    </Screen>
  );
}
export function Header({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.header}>
      <IconButton
        name="back"
        label="Go back"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/home")
        }
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {icon && <Icon name={icon} size={28} color={colors.accent} />}
    </View>
  );
}
export function Button({
  label,
  onPress,
  tone = "accent",
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  tone?: "accent" | "cream" | "ink";
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "cream"
          ? styles.cream
          : { backgroundColor: tone === "ink" ? colors.ink : colors.accent },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[styles.buttonText, tone === "cream" && { color: colors.ink }]}
      >
        {label}
      </Text>
      {icon && (
        <Icon
          name={icon}
          color={tone === "cream" ? colors.ink : colors.cream}
          size={20}
        />
      )}
    </AnimatedPressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  disabled = false,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon name={name} />
    </AnimatedPressable>
  );
}
export function Eyebrow({
  children,
  color = colors.inkSoft,
}: {
  children: ReactNode;
  color?: string;
}) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}
export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.panel, style]}>{children}</View>;
}
export function Stars({
  value,
  size = 18,
  celebrate = false,
}: {
  value: number;
  size?: number;
  celebrate?: boolean;
}) {
  return (
    <View
      accessibilityLabel={`${value} of 3 stars`}
      style={{ flexDirection: "row", gap: 5 }}
    >
      {[1, 2, 3].map((n) => (
        <Animated.View
          key={n}
          entering={
            celebrate
              ? ZoomIn.delay(150 + n * 160)
                  .springify()
                  .damping(12)
              : undefined
          }
        >
          <Icon
            name="star"
            size={size}
            color={n <= value ? colors.gold : colors.line}
            filled={n <= value}
          />
        </Animated.View>
      ))}
    </View>
  );
}
export function Navigation() {
  const path = usePathname();
  const items = [
    { name: "home", label: "Play", route: "/home" },
    { name: "grid", label: "Worlds", route: "/worlds" },
    { name: "sun", label: "Daily", route: "/daily" },
    { name: "palette", label: "Collection", route: "/skins" },
  ] as const;
  return (
    <View style={styles.nav}>
      {items.map((item) => (
        <AnimatedPressable
          key={item.route}
          accessibilityRole="button"
          accessibilityState={{ selected: path === item.route }}
          onPress={() => router.push(item.route)}
          style={styles.navItem}
        >
          <Icon
            name={item.name}
            size={21}
            color={path === item.route ? colors.accent : colors.inkSoft}
          />
          <Text
            style={[
              styles.navLabel,
              path === item.route && { color: colors.accent },
            ]}
          >
            {item.label}
          </Text>
          {path === item.route && <View style={styles.navDot} />}
        </AnimatedPressable>
      ))}
    </View>
  );
}
export const textStyles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 42,
  },
  body: { color: colors.inkSoft, fontSize: 15, lineHeight: 23 },
  heading: { color: colors.ink, fontSize: 18, fontWeight: "600" },
});
const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.paper, alignItems: "center" },
  screen: { flex: 1, width: "100%", paddingHorizontal: 24 },
  header: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    marginBottom: 26,
  },
  headerTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  button: {
    minHeight: 56,
    borderRadius: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  cream: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  buttonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.6,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  panel: {
    backgroundColor: colors.cream,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },
  nav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingTop: 14,
    marginTop: 12,
  },
  navItem: { flex: 1, alignItems: "center", minHeight: 52, gap: 5 },
  navLabel: { fontSize: 11, color: colors.inkSoft, fontWeight: "600" },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});
