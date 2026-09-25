import { memo, useId } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

/** Food illustrations share a square canvas so the same skin survives cuts and placements. */
export const FoodArt = memo(function FoodArt({
  id,
  size = 96,
  variant = 0,
}: {
  id: string;
  size?: number;
  variant?: number;
}) {
  const key = useId().replace(/:/g, "");
  const bread = `${key}bread`,
    fish = `${key}fish`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <LinearGradient id={bread} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE4A0" />
          <Stop offset="1" stopColor="#D88A36" />
        </LinearGradient>
        <LinearGradient id={fish} x1="0" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#FFAC83" />
          <Stop offset="1" stopColor="#EA604B" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="50" cy="83" rx="37" ry="8" fill="#513C37" opacity={0.13} />
      {id === "sushi" || id === "salmon" || id === "tuna" ? (
        <G transform="rotate(-12 50 50)">
          {id !== "salmon" && (
            <>
              <Rect
                x="14"
                y="37"
                width="73"
                height="42"
                rx="18"
                fill="#DBDCC5"
              />
              <Rect
                x="14"
                y="33"
                width="73"
                height="39"
                rx="17"
                fill="#FFFDE9"
              />
              {[0, 1, 2, 3, 4].map((i) => (
                <Path
                  key={i}
                  d={`M${22 + i * 13} 61l3 3 M${25 + i * 12} 70l2-2`}
                  stroke="#DAD7BC"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ))}
            </>
          )}
          <Rect
            x="11"
            y="20"
            width="77"
            height="36"
            rx="12"
            fill={id === "tuna" ? "#D94968" : `url(#${fish})`}
            stroke={id === "tuna" ? "#AD3452" : "#DA6D50"}
            strokeWidth="2"
          />
          {[0, 1, 2, 3].map((i) => (
            <Path
              key={i}
              d={`M${22 + i * 18} 22q-9 17 2 31`}
              fill="none"
              stroke={id === "tuna" ? "#F08BA2" : "#FFD0A5"}
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}
          {id === "sushi" && (
            <>
              <Path d="M44 19h15v54l-15 2z" fill="#284E3A" />
              <Path d="M48 22v45" stroke="#537656" strokeWidth="2" />
            </>
          )}
          <Path d="m70 77 8-5 9 5-5 5-12-1z" fill="#93B74A" />
        </G>
      ) : id === "sandwich" ? (
        <G transform="rotate(-8 50 50)">
          <Path
            d="M11 64 69 19 91 69 38 88Z"
            fill="#B66F32"
            stroke="#965326"
            strokeWidth="2"
          />
          <Path
            d="M13 56 70 14 91 62 38 82Z"
            fill="#FFE8B1"
            stroke="#D6964F"
            strokeWidth="4"
          />
          <Path
            d="m17 58 9-5 8 5 12-10 10 6 15-8 10 6 8 10-51 17Z"
            fill="#6DA445"
          />
          <Path d="m18 56 53-25 16 29-47 15z" fill="#E96047" />
          <Path d="m16 49 54-30 17 32-45 18z" fill="#F7C743" />
          <Path
            d="M13 43 69 9 89 45 38 65Z"
            fill={`url(#${bread})`}
            stroke="#CA8944"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <Path d="m21 42 45-26 14 26-40 17z" fill="#FFF0BD" />
          {[
            [35, 36],
            [58, 30],
            [49, 47],
            [69, 40],
          ].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={1.6} fill="#D8AE65" />
          ))}
        </G>
      ) : id === "seaweed" ? (
        <G>
          <Ellipse cx="50" cy="64" rx="34" ry="23" fill="#223F33" />
          <Rect x="16" y="38" width="68" height="26" fill="#294D3A" />
          <Ellipse cx="50" cy="38" rx="34" ry="26" fill="#426447" />
          <Ellipse cx="50" cy="37" rx="29" ry="21" fill="#FFF7DA" />
          {Array.from({ length: 10 }, (_, i) => (
            <Ellipse
              key={i}
              cx={50 + 23 * Math.cos(i * 0.63)}
              cy={37 + 16 * Math.sin(i * 0.63)}
              rx="2"
              ry="1"
              fill="#DAD4AF"
              transform={`rotate(${i * 36} ${50 + 23 * Math.cos(i * 0.63)} ${37 + 16 * Math.sin(i * 0.63)})`}
            />
          ))}
          <Ellipse cx="49" cy="36" rx="18" ry="13" fill="#9DC857" />
          <Path d="M34 31h18v17H35z" fill="#F68660" />
          <Path d="M53 24q14 3 13 15H53Z" fill="#F6C44E" />
          <Path
            d="M30 64q3 11 8 13 M72 58v11"
            stroke="#587553"
            strokeWidth="2"
          />
        </G>
      ) : id === "pizza" ? (
        <G transform="rotate(9 50 50)">
          <Path
            d="M14 23Q50 9 88 24L48 88Z"
            fill="#D58533"
            stroke="#AD692D"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <Path d="M19 29Q51 16 82 30L48 81Z" fill="#F6CA55" />
          <Path
            d="M17 26Q48 11 85 27"
            stroke="#EAAA58"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <Path
            d="M22 24Q50 13 79 25"
            stroke="#F4CF89"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {[
            [39, 37],
            [66, 37],
            [48, 61],
          ].map(([x, y], i) => (
            <G key={i}>
              <Circle cx={x} cy={y} r="9" fill="#CD4F3F" />
              <Circle cx={x - 2} cy={y - 2} r="5" fill="#E87751" />
            </G>
          ))}
          <Path
            d="m34 55 5 1 M60 51l3-5 M50 29l4 2"
            stroke="#588047"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </G>
      ) : id === "egg" ? (
        <G transform="rotate(-12 50 50)">
          <Rect x="15" y="28" width="70" height="50" rx="12" fill="#D89B36" />
          <Rect x="15" y="20" width="70" height="49" rx="12" fill="#F7D45F" />
          <Path d="M35 24v41 M57 24v41" stroke="#E5B646" strokeWidth="3" />
          <Path
            d="M20 33q8-11 11 0 M40 33q8-11 11 0 M62 33q8-11 15 0"
            stroke="#FFF0A4"
            strokeWidth="5"
            fill="none"
          />
          <Path
            d="m40 49 4 3 M64 56l4-1"
            stroke="#70924B"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </G>
      ) : id === "avocado" ? (
        <G transform="rotate(-16 50 50)">
          <Path
            d="M52 11C34 10 37 29 22 46 6 67 22 88 48 89 82 91 92 69 77 48 65 31 69 13 52 11"
            fill="#3F7744"
          />
          <Path
            d="M52 17C38 17 42 33 28 49 13 67 26 82 49 83 75 84 84 68 70 50 59 33 65 19 52 17"
            fill="#B5D965"
          />
          <Ellipse cx="50" cy="61" rx="21" ry="20" fill="#E6E78E" />
          <Circle cx="50" cy="61" r="15" fill="#A36A3E" />
          <Ellipse cx="46" cy="56" rx="7" ry="5" fill="#C59054" />
          <Path
            d="M47 26q-1 13-12 25"
            stroke="#DDED9E"
            strokeWidth="4"
            fill="none"
          />
        </G>
      ) : id === "wood" ? (
        <G transform="rotate(-10 50 50)">
          <Rect x="15" y="19" width="70" height="65" rx="12" fill="#A55D2F" />
          <Rect
            x="15"
            y="14"
            width="70"
            height="65"
            rx="12"
            fill={`url(#${bread})`}
          />
          {Array.from({ length: 9 }, (_, i) => (
            <Rect
              key={i}
              x={23 + (i % 3) * 20}
              y={22 + Math.floor(i / 3) * 18}
              width="14"
              height="12"
              rx="3"
              fill="#B56E31"
              stroke="#EBB866"
              strokeWidth="2"
            />
          ))}
          <Path d="M16 25q17 2 15 22t19-8 19 5 16-10v-8z" fill="#6D3D2E" />
          <Rect
            x="42"
            y="30"
            width="17"
            height="14"
            rx="3"
            fill="#FFE29A"
            transform="rotate(15 50 37)"
          />
          <Circle cx="72" cy="69" r="9" fill="#D84C4E" />
          <Path d="m67 61 5 4 5-5" stroke="#618345" strokeWidth="3" />
        </G>
      ) : id === "marble" ? (
        <G>
          <Circle cx="47" cy="56" r="32" fill="#594131" />
          <Circle
            cx="47"
            cy="48"
            r="32"
            fill="#E7C293"
            stroke="#BA946B"
            strokeWidth="3"
          />
          {[
            [29, 31],
            [52, 28],
            [64, 46],
            [34, 56],
            [54, 66],
            [46, 43],
          ].map(([x, y], i) => (
            <Path key={i} d={`m${x} ${y} 7-2 3 7-7 4-4-3z`} fill="#60443A" />
          ))}
          <Path d="M69 68q19-16 19-5v14H67z" fill="#FFF7E5" />
          <Ellipse cx="79" cy="63" rx="10" ry="5" fill="#EEE8DA" />
        </G>
      ) : id === "galaxy" ? (
        <G>
          <Circle cx="50" cy="53" r="34" fill="#9F663D" />
          <Circle
            cx="50"
            cy="47"
            r="34"
            fill="#8264C3"
            stroke="#684DA5"
            strokeWidth="2"
          />
          <Path
            d="M20 33q7-19 24-15"
            stroke="#B89AE9"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx="50" cy="47" r="12" fill="#64472E" />
          <Ellipse cx="50" cy="50" rx="10" ry="8" fill="#EEE5D0" />
          {[
            [32, 34],
            [69, 32],
            [23, 54],
            [47, 21],
            [65, 65],
            [37, 73],
            [75, 51],
          ].map(([x, y], i) => (
            <Path
              key={i}
              d={`m${x} ${y} 3 5`}
              stroke={i % 2 ? "#FFD665" : "#F5AFDA"}
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
        </G>
      ) : id === "dessert" ? (
        <G>
          <Path d="m25 55 8 31h35l9-31z" fill="#CE6794" />
          <Path
            d="m37 59 3 22 M51 58v24 M64 58l-3 24"
            stroke="#F5B4CE"
            strokeWidth="4"
          />
          <Path
            d="M22 51q-3-13 11-17-1-13 13-14 6-14 16 0 11 0 10 14 13 3 8 18 5 9-10 9H30Q17 62 22 51"
            fill="#FFD2DE"
            stroke="#E599B5"
            strokeWidth="2"
          />
          <Path
            d="M33 33q14 7 32 0 M25 49q20 8 49 0"
            stroke="#FFF0E9"
            strokeWidth="4"
            fill="none"
          />
          <Circle cx="52" cy="18" r="8" fill="#E85565" />
          <Path
            d="M52 12q2-8 8-9"
            stroke="#51804B"
            strokeWidth="3"
            fill="none"
          />
        </G>
      ) : id === "sakura" ? (
        <G>
          <Ellipse cx="50" cy="69" rx="35" ry="16" fill="#AC6485" />
          <Path d="M15 65C12 14 82 11 85 65q-2 17-34 16T15 65" fill="#F4A9C6" />
          <Path
            d="M25 49q0-19 23-24"
            stroke="#FFD9E9"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M18 71Q47 85 78 69"
            stroke="#D78EAE"
            strokeWidth="3"
            fill="none"
          />
          <Path d="M39 65q12-18 27-2-17 17-27 2" fill="#8DAA66" />
          <Path d="m46 66 14-3" stroke="#D8E2AB" strokeWidth="2" />
        </G>
      ) : id === "halloween" ? (
        <G>
          <Path
            d="M49 26q-2-13 6-17"
            stroke="#6B7C42"
            strokeWidth="7"
            fill="none"
          />
          <Ellipse cx="50" cy="56" rx="36" ry="29" fill="#EA8132" />
          <Ellipse cx="50" cy="56" rx="22" ry="29" fill="#F7A044" />
          <Ellipse cx="50" cy="56" rx="9" ry="29" fill="#FFB95E" />
          <Path
            d="m30 48 10 2-6-9z m30 2 10-2-4-7z M34 64q16 15 33-1l-9 2-2 5-5-4-6 5-2-6z"
            fill="#593E37"
          />
        </G>
      ) : (
        <G transform={`rotate(${variant % 2 ? 9 : -9} 50 50)`}>
          <Path
            d="M18 69 37 20Q50 0 64 21L84 68Q90 85 71 87H30Q12 87 18 69"
            fill="#D4D8C4"
          />
          <Path
            d="M17 62 37 16Q50 0 63 18L83 62Q89 79 70 80H30Q10 80 17 62"
            fill="#FFFBE8"
            stroke="#E9E4C8"
            strokeWidth="2"
          />
          {[
            [40, 30],
            [58, 27],
            [31, 51],
            [67, 51],
            [49, 45],
          ].map(([x, y], i) => (
            <Path
              key={i}
              d={`m${x} ${y} 3-3`}
              stroke="#DCDCC3"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
          <Path d="M37 57q13-5 26 0v25H37z" fill="#315342" />
          <Path d="M41 61v16 M57 61v16" stroke="#50745A" strokeWidth="2" />
        </G>
      )}
    </Svg>
  );
});
