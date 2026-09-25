import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Tabi } from "../src/components/Tabi";
import { Screen } from "../src/components/ui";
import { colors } from "../src/theme/theme";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace("/how-to"), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Screen>
      <View style={styles.hero}>
        <Tabi size={140} />
        <Text style={styles.title}>Bento Blocks</Text>
        <Text style={styles.tag}>Cut. Fit. Satisfy.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 42, fontWeight: "900", color: colors.ink, marginTop: 8 },
  tag: { fontSize: 18, color: colors.inkSoft, fontWeight: "700", marginTop: 4 },
});
