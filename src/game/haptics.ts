import * as Haptics from "expo-haptics";

export type Pulse = "cut" | "snap" | "invalid" | "complete";

export async function pulse(kind: Pulse, enabled: boolean): Promise<void> {
  if (!enabled) return;
  try {
    if (kind === "complete") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    if (kind === "invalid") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(
      kind === "snap"
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light,
    );
  } catch {
    // Haptics are optional: browsers and some devices have no vibration motor.
  }
}
