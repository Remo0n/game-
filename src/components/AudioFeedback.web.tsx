import { Asset } from "expo-asset";
import { useEffect } from "react";
import { onSound, type SoundName } from "../game/sound";

// HTML media play() can reject when autoplay is blocked. Keep that rejection out of gameplay.
export function AudioFeedback() {
  useEffect(() => {
    const sources = {
      cut: require("../../assets/sounds/cut.wav"),
      snap: require("../../assets/sounds/snap.wav"),
      invalid: require("../../assets/sounds/invalid.wav"),
      complete: require("../../assets/sounds/complete.wav"),
    };
    const players = Object.fromEntries(
      Object.entries(sources).map(([name, source]) => {
        const player = new Audio(Asset.fromModule(source).uri);
        player.preload = "auto";
        player.volume = 0.4;
        return [name, player];
      }),
    ) as Record<SoundName, HTMLAudioElement>;
    let disposed = false;
    const unlock = () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      Object.values(players).forEach((player) => {
        player.muted = true;
        void player
          .play()
          .then(() => {
            player.pause();
            player.currentTime = 0;
            player.muted = false;
          })
          .catch(() => {
            player.muted = false;
          });
      });
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    const unsubscribe = onSound((name) => {
      if (disposed || document.hidden) return;
      const player = players[name];
      player.currentTime = 0;
      void player.play().catch(() => {});
    });
    const pause = () => {
      if (document.hidden)
        Object.values(players).forEach((player) => player.pause());
    };
    document.addEventListener("visibilitychange", pause);
    return () => {
      disposed = true;
      unsubscribe();
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", pause);
      Object.values(players).forEach((player) => {
        player.pause();
        player.removeAttribute("src");
        player.load();
      });
    };
  }, []);
  return null;
}
