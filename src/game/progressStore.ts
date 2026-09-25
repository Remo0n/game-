import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { GENERATOR_VERSION, type ToolKit, type Variation } from "../engine/types";
import { createCampaignSeed } from "./vault";

export interface LevelResult {
  stars: number;
  bestScore: number;
}

const emptyVariationLevels = (): Record<Variation, number> => ({
  NORMAL: 1,
  ONE_CUT: 1,
  NO_ROTATION: 1,
  EXACT_FIT: 1,
  TIMED: 1,
  MULTI_BLOCK: 1,
});

interface ProgressState {
  campaignSeed: number;
  levelNumber: number;
  variationLevel: Record<Variation, number>;
  results: Record<string, LevelResult>;
  totalStars: number;
  streak: number;
  lastDailyDate: string | null;
  dailyCompletedDate: string | null;
  weekKey: string;
  weeklyDailyCount: number;
  weeklyRewardClaimed: boolean;
  wallet: ToolKit;
  selectedSkin: string;
  selectedTray: string;
  selectedBackground: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  recentSignatures: string[];
  recordResult: (key: string, stars: number, score: number) => boolean;
  advanceCampaign: () => void;
  setVariationLevel: (variation: Variation, level: number) => void;
  rememberSignature: (signature: string) => void;
  completeDaily: (date: string, week: string) => void;
  grantTool: () => void;
  setLook: (kind: "skin" | "tray" | "background", id: string) => void;
  setSound: (enabled: boolean) => void;
  setHaptics: (enabled: boolean) => void;
  spendWallet: (tool: keyof ToolKit) => void;
}

export function progressKey(mode: string, levelNumber: number): string {
  return `${GENERATOR_VERSION}:${mode}:${levelNumber}`;
}

function previousDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day);
  value.setDate(value.getDate() - 1);
  const nextMonth = String(value.getMonth() + 1).padStart(2, "0");
  const nextDay = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${nextMonth}-${nextDay}`;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      campaignSeed: createCampaignSeed(),
      levelNumber: 1,
      variationLevel: emptyVariationLevels(),
      results: {},
      totalStars: 0,
      streak: 0,
      lastDailyDate: null,
      dailyCompletedDate: null,
      weekKey: "",
      weeklyDailyCount: 0,
      weeklyRewardClaimed: false,
      wallet: { laser: 0, lineSplit: 0, rotate: 0, extraCut: 0 },
      selectedSkin: "classic",
      selectedTray: "wood",
      selectedBackground: "kitchen",
      soundEnabled: true,
      hapticsEnabled: true,
      recentSignatures: [],
      recordResult: (key, stars, score) => {
        let perfect = false;
        set((state) => {
          const previous = state.results[key];
          const bestStars = Math.max(previous?.stars ?? 0, stars);
          const bestScore = Math.max(previous?.bestScore ?? 0, score);
          perfect = stars === 3 && (previous?.stars ?? 0) < 3;
          return {
            results: { ...state.results, [key]: { stars: bestStars, bestScore } },
            totalStars: state.totalStars + (bestStars - (previous?.stars ?? 0)),
          };
        });
        return perfect;
      },
      advanceCampaign: () => set((state) => ({ levelNumber: state.levelNumber + 1 })),
      setVariationLevel: (variation, level) =>
        set((state) => ({ variationLevel: { ...state.variationLevel, [variation]: level } })),
      rememberSignature: (signature) =>
        set((state) => ({ recentSignatures: [...state.recentSignatures, signature].slice(-80) })),
      completeDaily: (date, week) =>
        set((state) => {
          if (state.dailyCompletedDate === date) return state;
          const streak = state.lastDailyDate === previousDate(date) ? state.streak + 1 : 1;
          const sameWeek = state.weekKey === week;
          const weeklyDailyCount = (sameWeek ? state.weeklyDailyCount : 0) + 1;
          return {
            streak,
            lastDailyDate: date,
            dailyCompletedDate: date,
            weekKey: week,
            weeklyDailyCount,
            weeklyRewardClaimed: state.weeklyRewardClaimed || weeklyDailyCount >= 3,
          };
        }),
      spendWallet: (tool: keyof ToolKit) =>
        set((state) => {
          if (state.wallet[tool] <= 0) return state;
          return { wallet: { ...state.wallet, [tool]: state.wallet[tool] - 1 } };
        }),
      grantTool: () =>
        set((state) => {
          const order: Array<keyof ToolKit> = ["lineSplit", "extraCut", "laser", "rotate"];
          const tool = order.find((name) => state.wallet[name] < 3) ?? "lineSplit";
          if (state.wallet[tool] >= 3) return state;
          return { wallet: { ...state.wallet, [tool]: state.wallet[tool] + 1 } };
        }),
      setLook: (kind, id) =>
        set(() => {
          if (kind === "skin") return { selectedSkin: id };
          if (kind === "tray") return { selectedTray: id };
          return { selectedBackground: id };
        }),
      setSound: (soundEnabled) => set({ soundEnabled }),
      setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
    }),
    {
      name: "bento-progress",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
