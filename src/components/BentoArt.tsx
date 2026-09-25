import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";

/** Original, resolution-independent bento illustration, shared across platforms. */
export function BentoArt({ variant = "hero" }: { variant?: "hero" | "daily" }) {
  const salmon = variant === "daily" ? "#A7B890" : "#EB9A7E";
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 480 340"
      accessibilityLabel="An illustrated wooden bento with salmon, rice, egg and little green vegetables"
    >
      <Ellipse
        cx="248"
        cy="299"
        rx="172"
        ry="22"
        fill="#405844"
        opacity={0.09}
      />
      <G transform="rotate(-8 240 170)">
        <Rect x="73" y="45" width="332" height="242" rx="35" fill="#AB8051" />
        <Rect
          x="73"
          y="36"
          width="332"
          height="242"
          rx="35"
          fill="#D5AF7D"
          stroke="#BB9567"
          strokeWidth={2}
        />
        <Rect x="85" y="48" width="308" height="218" rx="26" fill="#F0D7AC" />
        <Rect x="96" y="59" width="169" height="196" rx="17" fill="#CBA576" />
        <Rect x="276" y="59" width="106" height="89" rx="15" fill="#CBA576" />
        <Rect x="276" y="159" width="106" height="96" rx="15" fill="#CBA576" />
        <Rect x="105" y="68" width="151" height="178" rx="12" fill="#FFFAE8" />
        {Array.from({ length: 25 }, (_, i) => (
          <Line
            key={i}
            x1={115 + (i % 5) * 29}
            y1={82 + Math.floor(i / 5) * 34}
            x2={119 + (i % 5) * 29}
            y2={78 + Math.floor(i / 5) * 34}
            stroke="#E8DFC8"
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}
        <G transform="rotate(-7 180 145)">
          <Rect x="116" y="99" width="126" height="49" rx="13" fill="#C87A60" />
          <Rect x="116" y="94" width="126" height="48" rx="13" fill={salmon} />
          <Rect
            x="116"
            y="160"
            width="126"
            height="49"
            rx="13"
            fill="#C87A60"
          />
          <Rect x="116" y="155" width="126" height="48" rx="13" fill={salmon} />
          {[0, 1, 2, 3].map((i) => (
            <G key={i}>
              <Path
                d={`M${131 + i * 27} 96q-10 22 2 45 M${131 + i * 27} 157q-10 22 2 45`}
                stroke="#F7C3A7"
                strokeWidth={5}
                fill="none"
              />
            </G>
          ))}
        </G>
        {[0, 1, 2].map((i) => (
          <G key={i} transform="rotate(-7 330 102)">
            <Rect
              x={288 + i * 27}
              y="72"
              width="24"
              height="62"
              rx="8"
              fill="#C8A344"
            />
            <Rect
              x={288 + i * 27}
              y="69"
              width="24"
              height="58"
              rx="8"
              fill="#F3D879"
            />
            <Line
              x1={293 + i * 27}
              x2={304 + i * 27}
              y1="80"
              y2="80"
              stroke="#FFEDB0"
              strokeWidth={3}
              strokeLinecap="round"
            />
          </G>
        ))}
        {[
          [304, 190],
          [343, 188],
          [324, 223],
        ].map(([x, y], i) => (
          <G key={i}>
            <Circle cx={x} cy={y + 3} r={22} fill="#4B6D49" />
            <Circle cx={x} cy={y} r={21} fill="#7F9A66" />
            <Circle cx={x - 8} cy={y - 8} r={9} fill="#9FB880" />
            <Circle cx={x + 8} cy={y - 5} r={10} fill="#91AB73" />
            <Circle cx={x} cy={y + 7} r={10} fill="#91AB73" />
          </G>
        ))}
        <Circle cx="222" cy="226" r="12" fill="#CC694E" />
        <Path
          d="m219 212 3 5 4-4"
          stroke="#597E4E"
          strokeWidth={3}
          fill="none"
        />
      </G>
      <G transform="rotate(22 416 174)">
        <Rect x="412" y="79" width="7" height="209" rx="3" fill="#8D694D" />
        <Rect x="425" y="79" width="7" height="209" rx="3" fill="#8D694D" />
        <Rect x="412" y="79" width="7" height="56" rx="3" fill="#B98766" />
        <Rect x="425" y="79" width="7" height="56" rx="3" fill="#B98766" />
      </G>
      <Path
        d="m54 91 3-9 3 9 9 3-9 3-3 9-3-9-9-3z M369 24l2-7 2 7 7 2-7 2-2 7-2-7-7-2z"
        fill="#A3B18C"
      />
      <G transform="rotate(-22 48 242)">
        <Ellipse cx="47" cy="242" rx="15" ry="26" fill="#96AB78" />
        <Path d="M47 263v-38" stroke="#567751" strokeWidth={2} />
      </G>
    </Svg>
  );
}
