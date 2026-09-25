import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ToolKit } from "../engine/types";
import { createCampaignSeed } from "./vault";
import {
  finishRun,
  initialProgress,
  restoreProgress,
  type CompletedRun,
  type ProgressData,
} from "./progress";
export { progressKey, runKey } from "./progress";

export const useSaveStatus = create<{
  hydrated: boolean;
  loadError: boolean;
  saveError: boolean;
}>(() => ({ hydrated: false, loadError: false, saveError: false }));
let pendingWrite = Promise.resolve();
interface ProgressState extends ProgressData {
  completeRun: (run: CompletedRun) => void;
  rememberSignature: (signature: string) => void;
  setLook: (kind: "skin" | "tray" | "background", id: string) => void;
  setSound: (enabled: boolean) => void;
  setHaptics: (enabled: boolean) => void;
  spendWallet: (tool: keyof ToolKit) => void;
  resetProgress: () => void;
}
export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...initialProgress(createCampaignSeed()),
      completeRun: (run) => set((state) => finishRun(state, run)),
      rememberSignature: (signature) =>
        set((state) => ({
          recentSignatures: [...state.recentSignatures, signature].slice(-80),
        })),
      spendWallet: (tool) =>
        set((state) => ({
          wallet: {
            ...state.wallet,
            [tool]: Math.max(0, state.wallet[tool] - 1),
          },
        })),
      setLook: (kind, id) =>
        set(
          kind === "skin"
            ? { selectedSkin: id }
            : kind === "tray"
              ? { selectedTray: id }
              : { selectedBackground: id },
        ),
      setSound: (soundEnabled) => set({ soundEnabled }),
      setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
      resetProgress: () => set(initialProgress(createCampaignSeed())),
    }),
    {
      name: "bento-progress",
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: (name) => AsyncStorage.getItem(name),
        removeItem: (name) => AsyncStorage.removeItem(name),
        setItem: (name, value) => {
          // Serialize native writes so an older snapshot can never overwrite a newer one.
          pendingWrite = pendingWrite
            .then(() => AsyncStorage.setItem(name, value))
            .then(
              () => useSaveStatus.setState({ saveError: false }),
              () => useSaveStatus.setState({ saveError: true }),
            );
          return pendingWrite;
        },
      })),
      migrate: (saved) => restoreProgress(saved, createCampaignSeed()),
      merge: (saved, current) => ({
        ...current,
        ...restoreProgress(saved, current.campaignSeed),
      }),
      onRehydrateStorage: () => {
        useSaveStatus.setState({ hydrated: false, loadError: false });
        return (_state, error) =>
          useSaveStatus.setState({
            hydrated: !error,
            loadError: Boolean(error),
          });
      },
    },
  ),
);

/** Only called after the player confirms erasing an unreadable save. */
export async function resetUnreadableProgress(): Promise<void> {
  useProgress.getState().resetProgress();
  await pendingWrite;
  if (!useSaveStatus.getState().saveError) {
    useSaveStatus.setState({ hydrated: true, loadError: false });
  }
}
