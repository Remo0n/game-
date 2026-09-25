import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useEffect } from "react";
import { onSound } from "../game/sound";

export function AudioFeedback() {
  const cut = useAudioPlayer(require("../../assets/sounds/cut.wav"));
  const snap = useAudioPlayer(require("../../assets/sounds/snap.wav"));
  const invalid = useAudioPlayer(require("../../assets/sounds/invalid.wav"));
  const complete = useAudioPlayer(require("../../assets/sounds/complete.wav"));
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: "mixWithOthers",
      allowsRecording: false,
      shouldPlayInBackground: false,
    }).catch(() => {});
    const players = { cut, snap, invalid, complete };
    Object.values(players).forEach((player) => {
      player.volume = 0.4;
    });
    return onSound((name) => {
      const player = players[name];
      void player
        .seekTo(0)
        .then(() => player.play())
        .catch(() => {});
    });
  }, [cut, snap, invalid, complete]);
  return null;
}
