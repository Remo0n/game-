export type SoundName = "cut" | "snap" | "invalid" | "complete";

const listeners = new Set<(name: SoundName) => void>();

export function playSound(name: SoundName, enabled: boolean): void {
  if (!enabled) return;
  listeners.forEach((listener) => listener(name));
}

export function onSound(listener: (name: SoundName) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
