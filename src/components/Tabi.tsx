import Svg, { Circle, Ellipse, Path } from "react-native-svg";

export function Tabi({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Ellipse cx="60" cy="92" rx="36" ry="10" fill="#E7C9A4" />
      <Circle cx="60" cy="58" r="34" fill="#F4E1C1" />
      <Circle cx="38" cy="36" r="12" fill="#F4E1C1" />
      <Circle cx="82" cy="36" r="12" fill="#F4E1C1" />
      <Circle cx="38" cy="36" r="6" fill="#F7B7C6" />
      <Circle cx="82" cy="36" r="6" fill="#F7B7C6" />
      <Ellipse cx="48" cy="60" rx="5" ry="6" fill="#3C2A22" />
      <Ellipse cx="72" cy="60" rx="5" ry="6" fill="#3C2A22" />
      <Path d="M54 72 Q60 78 66 72" stroke="#3C2A22" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Ellipse cx="44" cy="68" rx="5" ry="3" fill="#F3B6C0" />
      <Ellipse cx="76" cy="68" rx="5" ry="3" fill="#F3B6C0" />
    </Svg>
  );
}
