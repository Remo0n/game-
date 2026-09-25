import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";
import type { BoardCut, Point } from "./boardGeometry";
import { colors } from "../theme/theme";

/** The knife follows the latest movement; nothing is tethered to the initial press. */
export function CutFeedback({
  tip,
  previous,
  cut,
  width,
  height,
}: {
  tip: Point;
  previous: Point;
  cut: BoardCut | null;
  width: number;
  height: number;
}) {
  const dx = tip.x - previous.x;
  const dy = tip.y - previous.y;
  const distance = Math.hypot(dx, dy);
  const angle = distance > 0.5 ? (Math.atan2(dy, dx) * 180) / Math.PI - 90 : 0;
  const tail = Math.min(22, distance);
  const ux = distance ? dx / distance : 0;
  const uy = distance ? dy / distance : 1;
  return (
    <View
      testID="cut-feedback"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { zIndex: 70 }]}
    >
      <Svg width={width} height={height}>
        {cut && (
          <G>
            <Line
              x1={cut.from.x}
              y1={cut.from.y}
              x2={cut.to.x}
              y2={cut.to.y}
              stroke="#FFFFFF"
              strokeWidth={5}
              strokeLinecap="round"
              opacity={0.95}
            />
            <Line
              x1={cut.from.x}
              y1={cut.from.y}
              x2={cut.to.x}
              y2={cut.to.y}
              stroke={colors.accent}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </G>
        )}
        {distance > 4 && (
          <Line
            x1={tip.x - ux * (tail + 30)}
            y1={tip.y - uy * (tail + 30)}
            x2={tip.x - ux * 30}
            y2={tip.y - uy * 30}
            stroke={colors.accent}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.18}
          />
        )}
        <G transform={`translate(${tip.x} ${tip.y}) rotate(${angle})`}>
          <Path
            d="M-2-18H6V-7Q6 0 0 3L-2-2Z"
            fill="#FFFFFF"
            stroke="#698271"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <Path
            d="M3-16V-7Q3-3 0 0"
            fill="none"
            stroke="#D9E5DA"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Rect
            x={-3.5}
            y={-32}
            width={7}
            height={15}
            rx={3}
            fill={colors.accentDeep}
          />
          <Circle cx={0} cy={-26} r={1} fill="#D4E4C4" />
        </G>
      </Svg>
    </View>
  );
}
