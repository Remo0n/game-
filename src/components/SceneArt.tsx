import { memo } from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";

const stars = [
  [24, 23],
  [57, 67],
  [94, 26],
  [145, 52],
  [190, 20],
  [241, 62],
  [303, 24],
  [334, 88],
  [29, 154],
  [115, 130],
  [278, 139],
  [320, 202],
  [168, 220],
];
function Blossom({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${size})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <Ellipse
          key={a}
          cx="0"
          cy="-6"
          rx="4"
          ry="7"
          fill="#FFB6D4"
          transform={`rotate(${a})`}
        />
      ))}
      <Circle r="3" fill="#FFD775" />
    </G>
  );
}
export const BackgroundArt = memo(function BackgroundArt({
  id,
}: {
  id: string;
}) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 360 260"
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none"
    >
      {id === "picnic" ? (
        <>
          <Rect width="360" height="260" fill="#A4C879" />
          <Path d="M0 55Q130 3 360 69V260H0Z" fill="#87B25C" />
          <G transform="rotate(-8 180 150)">
            <Rect
              x="34"
              y="55"
              width="298"
              height="183"
              rx="7"
              fill="#FFF6DC"
            />
            {Array.from({ length: 10 }, (_, i) => (
              <Rect
                key={i}
                x={34 + i * 32}
                y="55"
                width="16"
                height="183"
                fill="#EA9C8B"
                opacity={0.6}
              />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <Rect
                key={i}
                x="34"
                y={55 + i * 32}
                width="298"
                height="16"
                fill="#EA9C8B"
                opacity={0.6}
              />
            ))}
          </G>
          <Ellipse cx="295" cy="209" rx="38" ry="23" fill="#C69559" />
          <Path
            d="M270 198q23-43 48 0"
            stroke="#976E40"
            strokeWidth="7"
            fill="none"
          />
          <Path d="M263 214h66 M270 224h51" stroke="#E6BA77" strokeWidth="4" />
          {[
            [22, 37],
            [316, 30],
            [337, 132],
            [17, 221],
          ].map(([x, y], i) => (
            <G key={i}>
              <Circle cx={x} cy={y} r="8" fill="#FFF9CE" />
              <Circle cx={x} cy={y} r="3" fill="#EAC762" />
            </G>
          ))}
        </>
      ) : id === "seaside" ? (
        <>
          <Rect width="360" height="260" fill="#94DAE4" />
          <Circle cx="292" cy="43" r="24" fill="#FFF1A3" />
          <Path d="M0 109q75-18 168 2t192-4v100H0Z" fill="#3CB5C5" />
          <Path d="M0 151q90-19 177 3t183-5v100H0Z" fill="#78D0CD" />
          <Path d="M0 183q90-17 180 4t180-6v79H0Z" fill="#F2D493" />
          <Path
            d="M0 179q95-17 180 4t180-6"
            stroke="#EDFCED"
            strokeWidth="9"
            fill="none"
          />
          <Path d="M43 214V74" stroke="#8B7959" strokeWidth="4" />
          <Path d="M3 105q39-70 80 0z" fill="#E98976" />
          <Path d="M43 55q-13 21-14 50h27Q56 76 43 55" fill="#FFF3D7" />
          <Path
            d="m256 221 8-13 9 12 16 2-13 10 1 16-13-9-14 7 2-16-12-11z"
            fill="#DE9673"
          />
          <Path
            d="M99 56q8-8 17 0 9-8 17 0 M209 78q6-6 12 0 6-6 12 0"
            stroke="#5B99AD"
            strokeWidth="3"
            fill="none"
          />
        </>
      ) : id === "sushi" ? (
        <>
          <Rect width="360" height="260" fill="#243958" />
          <Circle cx="273" cy="47" r="23" fill="#FFE4A1" />
          <Rect x="24" y="77" width="123" height="150" fill="#B7554D" />
          <Rect x="210" y="54" width="129" height="173" fill="#7B5265" />
          <Path
            d="M13 84h145l-15-20H29Z M197 65h151l-20-23H217Z"
            fill="#263A42"
          />
          {[40, 76, 112, 229, 266, 303].map((x, i) => (
            <G key={x}>
              <Rect
                x={x}
                y={i < 3 ? 103 : 89}
                width="22"
                height="45"
                rx="3"
                fill="#FFD886"
              />
              <Path
                d={`M${x + 11} ${i < 3 ? 103 : 89}v45`}
                stroke="#B57255"
                strokeWidth="3"
              />
            </G>
          ))}
          <Rect x="40" y="167" width="91" height="58" fill="#563C3C" />
          <Rect x="226" y="159" width="97" height="66" fill="#4E3A49" />
          <Path
            d="M0 20q150 52 360 1"
            stroke="#5C6A67"
            strokeWidth="3"
            fill="none"
          />
          {[54, 132, 213, 304].map((x, i) => (
            <G key={x}>
              <Path
                d={`M${x} ${i === 0 ? 34 : 45}v12`}
                stroke="#AD8C6B"
                strokeWidth="2"
              />
              <Ellipse
                cx={x}
                cy={i === 0 ? 56 : 67}
                rx="12"
                ry="16"
                fill={i % 2 ? "#FFD378" : "#EB8567"}
              />
              <Line
                x1={x}
                y1={i === 0 ? 43 : 54}
                x2={x}
                y2={i === 0 ? 69 : 80}
                stroke="#FFF0B4"
                strokeWidth="2"
              />
            </G>
          ))}
          <Path d="M0 225h360v35H0Z" fill="#7F7B88" />
          <Path
            d="M30 240h67 M126 240h65 M228 240h92"
            stroke="#BDB0A9"
            strokeWidth="2"
          />
        </>
      ) : id === "dessert" ? (
        <>
          <Rect width="360" height="260" fill="#FBC9DB" />
          <Circle cx="287" cy="46" r="25" fill="#FFF1AD" />
          <Path d="M0 160Q83 72 170 158T360 142v118H0Z" fill="#C4A4D8" />
          <Path d="M0 197Q81 144 166 200t194-23v83H0Z" fill="#F1A5BE" />
          <Path d="M62 205V88 M284 207V106" stroke="#FDF1D2" strokeWidth="8" />
          <Circle cx="62" cy="77" r="36" fill="#F8E7AC" />
          <Path
            d="M43 63q37-23 38 11t-31 16q-12-17 9-18"
            stroke="#DE7B99"
            strokeWidth="8"
            fill="none"
          />
          <Circle cx="284" cy="102" r="27" fill="#E983AB" />
          <Path
            d="M268 92q26-13 30 6t-23 11"
            stroke="#FFDFB2"
            strokeWidth="7"
            fill="none"
          />
          <Path d="m130 211 13-51h53l16 51z" fill="#B87B9D" />
          <Path
            d="M136 161q-8-20 11-24 6-26 24-17 24-11 25 18 18 5 6 23Z"
            fill="#FFF3D7"
          />
          <Circle cx="169" cy="120" r="10" fill="#DE647B" />
          {stars.slice(0, 8).map(([x, y], i) => (
            <Path
              key={i}
              d={`m${x} ${y} 5 8`}
              stroke={i % 2 ? "#FDF2AB" : "#D99AC7"}
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}
        </>
      ) : id === "sakura" ? (
        <>
          <Rect width="360" height="260" fill="#F8DDE9" />
          <Circle cx="252" cy="62" r="31" fill="#F3ADBF" />
          <Path d="M56 208 185 70 311 208Z" fill="#9BACC6" />
          <Path d="m140 118 45-48 46 49-28-8-18 12-20-15Z" fill="#FFF8F5" />
          <Path d="M0 215q140-33 360-2v47H0Z" fill="#A8BCB1" />
          <Path
            d="M0 2q70 62 146 57 M65 38q48-6 95-36 M360 0q-38 103-121 109 M315 69q-2-36-22-54"
            stroke="#906C70"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          {[
            [25, 20],
            [52, 36],
            [79, 50],
            [116, 56],
            [141, 20],
            [322, 37],
            [307, 75],
            [270, 99],
            [291, 18],
            [338, 4],
          ].map(([x, y], i) => (
            <Blossom key={i} x={x} y={y} size={i % 2 ? 1 : 1.4} />
          ))}
          <Path
            d="m76 138 7 6 M282 166l-6 7 M125 214l8-3"
            stroke="#EEA5C4"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : id === "galaxy" ? (
        <>
          <Rect width="360" height="260" fill="#29284C" />
          <Ellipse
            cx="187"
            cy="142"
            rx="210"
            ry="43"
            transform="rotate(-29 187 142)"
            fill="#4E3B79"
            opacity={0.7}
          />
          {stars.map(([x, y], i) => (
            <G key={i}>
              <Circle
                cx={x}
                cy={y}
                r={i % 3 === 0 ? 2.5 : 1.5}
                fill="#FFF3C5"
              />
              {i % 4 === 0 && (
                <Path
                  d={`M${x - 6} ${y}h12 M${x} ${y - 6}v12`}
                  stroke="#CFB7F0"
                  strokeWidth="1"
                />
              )}
            </G>
          ))}
          <Circle cx="279" cy="86" r="35" fill="#B28BDB" />
          <Path
            d="M250 68q30 30 62 14 M248 88q21 21 58 16"
            stroke="#D1AFE9"
            strokeWidth="8"
            fill="none"
          />
          <Ellipse
            cx="279"
            cy="86"
            rx="58"
            ry="10"
            stroke="#E7B886"
            strokeWidth="8"
            fill="none"
            transform="rotate(-22 279 86)"
          />
          <Circle cx="68" cy="206" r="48" fill="#668CC4" />
          <Circle cx="49" cy="184" r="12" fill="#89ABDE" />
          <Circle cx="84" cy="218" r="16" fill="#5479B3" />
        </>
      ) : id === "halloween" ? (
        <>
          <Rect width="360" height="260" fill="#3D3556" />
          <Circle cx="272" cy="60" r="35" fill="#FFE3A0" />
          <Path d="M0 197Q100 135 203 199t157-15v76H0Z" fill="#5B4768" />
          <Path
            d="M28 216 39 62l-21-25 M36 115l38-40 M38 87l-5-42"
            stroke="#342C42"
            strokeWidth="11"
            fill="none"
          />
          {[
            [259, 203, 1],
            [307, 220, 0.75],
            [88, 220, 0.7],
          ].map(([x, y, s], i) => (
            <G key={i} transform={`translate(${x} ${y}) scale(${s})`}>
              <Path
                d="M0-23q-4-10 3-13"
                stroke="#879256"
                strokeWidth="5"
                fill="none"
              />
              <Ellipse rx="29" ry="24" fill="#E98D43" />
              <Ellipse rx="16" ry="24" fill="#F2A548" />
              <Path
                d="m-16-4 9-6 2 8z m22 2 1-8 9 6z M-11 10q11 12 22 0"
                fill="#4E3544"
              />
            </G>
          ))}
          <Path
            d="M203 79q10-13 19 0 11-13 20 0l-19 8z M136 40q9-9 17 0 9-9 17 0l-17 6z"
            fill="#44354F"
          />
        </>
      ) : (
        <>
          <Rect width="360" height="260" fill="#F1E6CA" />
          {[50, 100, 150, 200].map((y) => (
            <Line
              key={y}
              x1="0"
              x2="360"
              y1={y}
              y2={y}
              stroke="#DDD8BE"
              strokeWidth="2"
            />
          ))}
          {[35, 95, 155, 215, 275, 335].map((x) => (
            <Line
              key={x}
              x1={x}
              x2={x}
              y1="0"
              y2="260"
              stroke="#DDD8BE"
              strokeWidth="2"
            />
          ))}
          <Rect x="23" y="20" width="129" height="100" rx="5" fill="#BCA578" />
          <Rect x="30" y="27" width="115" height="86" fill="#B9D9CF" />
          <Path d="M88 27v86 M30 70h115" stroke="#FFF4DC" strokeWidth="7" />
          <Rect x="191" y="106" width="150" height="10" rx="3" fill="#B88A58" />
          <Rect x="220" y="68" width="30" height="38" rx="8" fill="#D8866B" />
          <Path
            d="M235 77V31 M235 53q-26-4-18-23 21 0 18 23 M235 67q24-3 21-25-20 3-21 25"
            fill="#699361"
            stroke="#62875A"
            strokeWidth="3"
          />
          <Rect x="275" y="77" width="29" height="29" rx="4" fill="#EECF7F" />
          <Path
            d="M302 82q18-2 13 15h-12"
            stroke="#D0A958"
            strokeWidth="5"
            fill="none"
          />
          <Rect y="204" width="360" height="56" fill="#D5B789" />
          <Path d="M0 214h360 M0 247h360" stroke="#C8A478" strokeWidth="3" />
          <Ellipse cx="88" cy="223" rx="39" ry="13" fill="#FDF4D9" />
          <Ellipse cx="88" cy="221" rx="27" ry="8" fill="#E6D5B4" />
        </>
      )}
    </Svg>
  );
});

export const TraySurface = memo(function TraySurface({ id }: { id: string }) {
  const dark = id === "sushi" || id === "galaxy";
  const rim =
    id === "picnic"
      ? "#439BAA"
      : id === "bamboo"
        ? "#B99151"
        : id === "sushi"
          ? "#9D3F3B"
          : id === "dessert"
            ? "#DB85A7"
            : id === "sakura"
              ? "#E9A4BD"
              : id === "galaxy"
                ? "#8073AF"
                : id === "marble"
                  ? "#A9BCB3"
                  : "#B88D59";
  const fill =
    id === "picnic"
      ? "#D5ECE3"
      : id === "bamboo"
        ? "#EBD39A"
        : id === "sushi"
          ? "#343F3A"
          : id === "dessert"
            ? "#FFE1E5"
            : id === "sakura"
              ? "#FFF1ED"
              : id === "galaxy"
                ? "#353452"
                : id === "marble"
                  ? "#F2F2E6"
                  : "#E9CC9C";
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 240 170"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Rect
        x="2"
        y="5"
        width="236"
        height="163"
        rx={id === "dessert" ? 38 : 24}
        fill={rim}
      />
      <Rect
        x="3"
        y="2"
        width="234"
        height="158"
        rx={id === "dessert" ? 38 : 24}
        fill={fill}
        stroke={rim}
        strokeWidth="6"
      />
      <Rect
        x="13"
        y="12"
        width="214"
        height="136"
        rx="17"
        fill="none"
        stroke={rim}
        strokeWidth="2"
        opacity={0.6}
      />
      {(id === "wood" || id === "bamboo") &&
        Array.from({ length: 8 }, (_, i) => (
          <Path
            key={i}
            d={
              id === "bamboo"
                ? `M${22 + i * 29} 16v128 M16 ${25 + i * 15}h208`
                : `M16 ${27 + i * 16}q55-8 99 0t109 0`
            }
            fill="none"
            stroke={id === "bamboo" ? "#B7945C" : "#B88D59"}
            strokeWidth={id === "bamboo" ? 2 : 1.2}
            opacity={0.3}
          />
        ))}
      {id === "marble" && (
        <>
          <Path
            d="M20 0q80 33 72 70t110 100 M169 0q-47 47-2 59t-23 111"
            stroke="#ADC6BC"
            strokeWidth="3"
            opacity={0.6}
            fill="none"
          />
          <Path
            d="M33 0q80 33 72 70t110 100"
            stroke="#D4B976"
            strokeWidth="1"
            fill="none"
          />
        </>
      )}
      {id === "picnic" && (
        <>
          <Path
            d="M32 7v145 M66 7v145 M100 7v145 M134 7v145 M168 7v145 M202 7v145 M13 35h215 M13 69h215 M13 103h215 M13 137h215"
            stroke="#8AC5C4"
            strokeWidth="15"
            opacity={0.25}
          />
          <Rect x="97" y="2" width="46" height="7" rx="3" fill="#EDC572" />
        </>
      )}
      {id === "sushi" && (
        <>
          <Rect
            x="12"
            y="13"
            width="216"
            height="135"
            rx="17"
            stroke="#CEAA5E"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M18 38h15V23 M207 23v15h15 M18 123h15v15 M207 138v-15h15"
            fill="none"
            stroke="#D8B975"
            strokeWidth="3"
          />
        </>
      )}
      {id === "galaxy" &&
        stars.slice(0, 9).map(([x, y], i) => (
          <G key={i} transform={`translate(${x * 0.64 + 5} ${y * 0.55 + 17})`}>
            <Circle r="2" fill="#F6DA94" />
            {i % 2 === 0 && <Path d="M-5 0h10 M0-5v10" stroke="#D8C3ED" />}
          </G>
        ))}
      {id === "sakura" && (
        <>
          <Path
            d="M22 144q20-35 66-31 M217 23q-22 30-62 26"
            fill="none"
            stroke="#B4908F"
            strokeWidth="2"
          />
          <Blossom x={32} y={129} size={0.8} />
          <Blossom x={61} y={113} size={0.7} />
          <Blossom x={200} y={35} size={0.8} />
          <Blossom x={172} y={48} size={0.7} />
        </>
      )}
      {id === "dessert" &&
        Array.from({ length: 13 }, (_, i) => (
          <G key={i}>
            <Circle cx={28 + i * 15} cy="13" r="3" fill="#FFF5E9" />
            <Circle cx={28 + i * 15} cy="148" r="3" fill="#FFF5E9" />
          </G>
        ))}
      <Path
        d="M25 9h188"
        stroke={dark ? "#E9C994" : "#FFF6D7"}
        strokeWidth="2"
        opacity={0.7}
      />
    </Svg>
  );
});
