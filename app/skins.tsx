import { Text } from "../src/components/Typography";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { FoodArt } from "../src/components/FoodArt";
import { Icon } from "../src/components/Icon";
import {
  LookPreview,
  lookDescription,
  type LookKind,
} from "../src/components/LookPreview";
import { BackgroundArt, TraySurface } from "../src/components/SceneArt";
import {
  Button,
  Eyebrow,
  IconButton,
  Page,
  textStyles,
} from "../src/components/ui";
import { useProgress } from "../src/game/progressStore";
import {
  BACKGROUNDS,
  BLOCK_SKINS,
  colors,
  fonts,
  isUnlocked,
  TRAYS,
  type Look,
} from "../src/theme/theme";
function unlockLabel(look: Look) {
  const u = look.unlock;
  return u.type === "free"
    ? "Ready to use"
    : u.type === "stars"
      ? `${u.stars} stars`
      : u.type === "weekly"
        ? "3 daily bentos in a week"
        : u.world === "sushi"
          ? "40 stars"
          : "100 stars";
}
const backdrops: Record<string, string> = {
  sushi: "#F8DFCF",
  sandwich: "#E9EDBC",
  pizza: "#FFE2AC",
  classic: "#E1EBE0",
  seaweed: "#DBE8C3",
  salmon: "#FFD6C9",
  egg: "#F6EBBD",
  tuna: "#F5D3DD",
  avocado: "#DCE9AF",
  wood: "#F5DDB8",
  marble: "#EDE0D4",
  sakura: "#F7DCE9",
  galaxy: "#DCD5F1",
  dessert: "#F5D7E5",
  halloween: "#F6D4AA",
};
export default function SkinsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<LookKind>(
    params.tab === "Trays" || params.tab === "Backgrounds"
      ? params.tab
      : "Blocks",
  );
  const [preview, setPreview] = useState<Look | null>(null);
  const progress = useProgress();
  const looks =
    tab === "Blocks" ? BLOCK_SKINS : tab === "Trays" ? TRAYS : BACKGROUNDS;
  const selected =
    tab === "Blocks"
      ? progress.selectedSkin
      : tab === "Trays"
        ? progress.selectedTray
        : progress.selectedBackground;
  const currentSkin =
    BLOCK_SKINS.find((l) => l.id === progress.selectedSkin) ?? BLOCK_SKINS[0];
  const currentTray =
    TRAYS.find((l) => l.id === progress.selectedTray) ?? TRAYS[0];
  const currentScene =
    BACKGROUNDS.find((l) => l.id === progress.selectedBackground) ??
    BACKGROUNDS[0];
  const previewOpen =
    preview &&
    isUnlocked(preview, progress.totalStars, progress.weeklyRewardClaimed);
  function equip(look: Look) {
    progress.setLook(
      tab === "Blocks" ? "skin" : tab === "Trays" ? "tray" : "background",
      look.id,
    );
    setPreview(null);
  }
  return (
    <Page
      title="The flavor cabinet"
      subtitle={`${BLOCK_SKINS.length} foods · ${TRAYS.length} trays · ${BACKGROUNDS.length} little worlds`}
      icon="palette"
    >
      <View style={styles.loadout}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <BackgroundArt id={currentScene.id} />
        </View>
        <View style={styles.loadoutTag}>
          <Eyebrow color={colors.ink}>Your current bento</Eyebrow>
        </View>
        <View style={styles.sampleTray}>
          <TraySurface id={currentTray.id} />
          <View pointerEvents="none" style={styles.sampleFood}>
            {[0, 1, 2, 3].map((i) => (
              <FoodArt key={i} id={currentSkin.id} size={48} variant={i} />
            ))}
          </View>
        </View>
        <View style={styles.loadoutNames}>
          <Text style={styles.loadoutTitle}>{currentSkin.name}</Text>
          <Text style={styles.loadoutSub}>
            {currentTray.name} · {currentScene.name}
          </Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              textStyles.heading,
              { fontFamily: fonts.display, fontSize: 25 },
            ]}
          >
            A whole new kind of delicious.
          </Text>
          <Text style={styles.intro}>
            Mix your favorite food, tray, and setting. Tap any design for a
            closer look.
          </Text>
        </View>
      </View>
      <View style={styles.tabs}>
        {(["Blocks", "Trays", "Backgrounds"] as const).map((name) => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: name === tab }}
            onPress={() => {
              setTab(name);
              setPreview(null);
            }}
            style={[
              styles.tab,
              tab === name && { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={[styles.tabText, tab === name && { color: colors.cream }]}
            >
              {name}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.grid}>
        {looks.map((look) => {
          const open = isUnlocked(
              look,
              progress.totalStars,
              progress.weeklyRewardClaimed,
            ),
            active = selected === look.id;
          return (
            <Pressable
              key={look.id}
              accessibilityRole="button"
              accessibilityLabel={`Preview ${look.name}, ${active ? "selected" : open ? "available" : "locked, " + unlockLabel(look)}`}
              accessibilityState={{ selected: active }}
              onPress={() => setPreview(look)}
              style={({ pressed }) => [
                styles.card,
                active && { borderColor: colors.accent },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View
                style={[
                  styles.preview,
                  {
                    backgroundColor:
                      tab === "Blocks"
                        ? (backdrops[look.id] ?? colors.sage)
                        : tab === "Trays"
                          ? "#F1EBD9"
                          : look.colors[0],
                  },
                ]}
              >
                <LookPreview id={look.id} kind={tab} />
                {active ? (
                  <View style={styles.check}>
                    <Icon name="check" size={14} color={colors.cream} />
                  </View>
                ) : open ? (
                  <View style={styles.ready}>
                    <Text style={styles.readyText}>READY TO USE</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>{look.name}</Text>
                <View style={styles.cardFooter}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 4,
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Icon
                      name={active ? "check" : open ? "spark" : "lock"}
                      size={12}
                      color={active ? colors.accent : colors.inkSoft}
                    />
                    <Text
                      style={[
                        styles.unlock,
                        active && { color: colors.accent },
                      ]}
                    >
                      {active
                        ? "In your bento"
                        : open
                          ? "Try this look"
                          : unlockLabel(look)}
                    </Text>
                  </View>
                  <Icon name="arrow" size={15} color={colors.inkSoft} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Button
        label="Play with your bento"
        icon="play"
        onPress={() =>
          router.push({
            pathname: "/play",
            params: { source: "campaign", level: String(progress.levelNumber) },
          })
        }
      />
      <Modal
        transparent
        visible={preview !== null}
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={styles.sheet}>
            <ScrollView
              contentContainerStyle={{ gap: 18 }}
              showsVerticalScrollIndicator={false}
            >
              {preview && (
                <>
                  <View style={styles.modalHeading}>
                    <Eyebrow>
                      {tab === "Blocks"
                        ? "On the menu"
                        : tab === "Trays"
                          ? "A place for every bite"
                          : "A change of scenery"}
                    </Eyebrow>
                    <IconButton
                      name="close"
                      label="Close preview"
                      onPress={() => setPreview(null)}
                    />
                  </View>
                  <View
                    style={[
                      styles.largePreview,
                      {
                        backgroundColor:
                          tab === "Blocks"
                            ? (backdrops[preview.id] ?? colors.sage)
                            : "#F1EBD9",
                      },
                    ]}
                  >
                    <LookPreview id={preview.id} kind={tab} large />
                  </View>
                  <Text style={styles.modalTitle}>{preview.name}</Text>
                  <Text style={textStyles.body}>
                    {lookDescription(preview.id, tab)}
                  </Text>
                  {previewOpen ? (
                    <Button
                      label={
                        selected === preview.id
                          ? "Already in your bento"
                          : "Use this look"
                      }
                      icon={selected === preview.id ? "check" : "arrow"}
                      onPress={() => equip(preview)}
                    />
                  ) : (
                    <View style={styles.lockedNote}>
                      <Icon name="lock" size={20} color={colors.accent} />
                      <Text style={styles.lockedCopy}>
                        Unlock with {unlockLabel(preview).toLowerCase()}.
                        {preview.unlock.type === "stars"
                          ? ` You have ${progress.totalStars} stars.`
                          : ""}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.note}>
                    {tab === "Blocks"
                      ? "Your food skin appears on every block, including cut and placed pieces."
                      : tab === "Trays"
                        ? "This becomes the actual tray you fill during a puzzle."
                        : "This scene appears behind your puzzle board."}
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Page>
  );
}
const styles = StyleSheet.create({
  loadout: {
    height: 230,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  loadoutTag: {
    position: "absolute",
    top: 14,
    backgroundColor: "rgba(255,254,248,.94)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sampleTray: { width: 240, height: 124, marginTop: 8 },
  sampleFood: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    gap: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  loadoutNames: {
    position: "absolute",
    bottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,254,248,.96)",
    width: "100%",
    alignItems: "center",
    gap: 3,
  },
  loadoutTitle: { fontWeight: "600", fontSize: 14, color: colors.ink },
  loadoutSub: { fontSize: 10, color: colors.inkSoft, textAlign: "center" },
  section: { flexDirection: "row", gap: 12 },
  intro: { color: colors.inkSoft, fontSize: 13, lineHeight: 20, marginTop: 8 },
  tabs: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: colors.sage,
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  tabText: { color: colors.ink, fontWeight: "600", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    flexGrow: 1,
    borderRadius: 22,
    overflow: "hidden",
    borderColor: colors.line,
    borderWidth: 2,
    backgroundColor: colors.cream,
  },
  preview: {
    height: 154,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  check: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  ready: {
    position: "absolute",
    top: 9,
    left: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,254,248,.9)",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  readyText: {
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.accent,
  },
  copy: { padding: 13, gap: 9 },
  name: { fontWeight: "600", fontSize: 14, color: colors.ink },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
  unlock: { color: colors.inkSoft, fontSize: 10, flexShrink: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(31,46,35,.5)",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "95%",
    backgroundColor: colors.paper,
    borderRadius: 28,
    padding: 22,
  },
  modalHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  largePreview: {
    height: 230,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  lockedNote: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.sage,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  lockedCopy: { color: colors.accent, fontSize: 14, lineHeight: 21, flex: 1 },
  note: {
    fontSize: 11,
    color: colors.inkSoft,
    lineHeight: 18,
    textAlign: "center",
  },
});
