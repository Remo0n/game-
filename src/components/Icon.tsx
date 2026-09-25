import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "../theme/theme";

export type IconName =
  | "home"
  | "grid"
  | "sun"
  | "palette"
  | "settings"
  | "arrow"
  | "back"
  | "star"
  | "lock"
  | "cut"
  | "move"
  | "rotate"
  | "undo"
  | "reset"
  | "hint"
  | "check"
  | "close"
  | "help"
  | "spark"
  | "clock"
  | "play"
  | "tools"
  | "share";
const paths: Record<IconName, string> = {
  home: "m3 10 9-7 9 7 M5 9v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  sun: "M12 1v2 M12 21v2 M1 12h2 M21 12h2 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2",
  palette:
    "M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4 2 2 0 0 1 1-4h3a3 3 0 0 0 3-3c0-4-4-7-9-7Z M7 10h.01 M10 6h.01 M15 7h.01",
  settings:
    "M9.7 3h4.6l.5 2.2 1.6.9 2.2-.7 2.3 4-1.7 1.5v2.2l1.7 1.5-2.3 4-2.2-.7-1.6.9-.5 2.2H9.7l-.5-2.2-1.6-.9-2.2.7-2.3-4 1.7-1.5v-2.2L3.1 9.4l2.3-4 2.2.7 1.6-.9Z",
  arrow: "M4 12h15 M13 6l6 6-6 6",
  back: "M20 12H5 M11 6l-6 6 6 6",
  star: "m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2-4.6-4.5 6.3-.9Z",
  lock: "M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v11H5z M12 14v3",
  cut: "m8.1 8.1 12.4 12.4 M14 10l6.5-6.5 M8.1 15.9 12 12",
  move: "M12 2v20 M2 12h20 M8 6l4-4 4 4 M8 18l4 4 4-4 M6 8l-4 4 4 4 M18 8l4 4-4 4",
  rotate: "M20 10a8 8 0 1 0-2 8 M20 3v7h-7",
  undo: "M8 4 3 9l5 5 M3 9h11a6 6 0 0 1 0 12h-2",
  reset: "M4 10a8 8 0 1 1 2 8 M4 3v7h7",
  hint: "M9 18h6 M9.5 21h5 M8 14a6 6 0 1 1 8 0c-1.1.8-1.5 1.4-1.5 2h-5c0-.6-.4-1.2-1.5-2Z",
  check: "M5 12l4 4L20 5",
  close: "m6 6 12 12 M6 18 18 6",
  help: "M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3 M12 17h.01",
  spark: "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z",
  clock: "M12 6v6l4 2",
  share: "M12 15V3 m-4 4 4-4 4 4 M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7",
  play: "m9 5 11 7-11 7z",
  tools: "m14 7 3 3 4-4a6 6 0 0 1-8 8l-7 7-3-3 7-7a6 6 0 0 1 8-8z",
};
export function Icon({
  name,
  size = 22,
  color = colors.ink,
  filled = false,
}: {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg
      style={{ flexShrink: 0 }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={filled ? 1.4 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {(name === "clock" || name === "help") && (
        <Circle cx={12} cy={12} r={9} />
      )}
      {name === "sun" && <Circle cx={12} cy={12} r={5} />}
      {name === "settings" && <Circle cx={12} cy={12} r={3} />}
      {name === "cut" && (
        <>
          <Circle cx={6} cy={6} r={3} />
          <Circle cx={6} cy={18} r={3} />
        </>
      )}
      <Path d={paths[name]} fill={filled ? color : "none"} />
    </Svg>
  );
}
