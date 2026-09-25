import { createContext, forwardRef, useContext } from "react";
import { StyleSheet, Text as NativeText, type TextProps } from "react-native";
import { fonts } from "../theme/theme";

const InheritedFont = createContext<string>(fonts.body);
const families: ReadonlySet<string> = new Set(Object.values(fonts));

/** Use real font weights, including in nested text, instead of platform-synthesized bold. */
export const Text = forwardRef<NativeText, TextProps>(function Text(
  { style, children, ...props },
  ref,
) {
  const inherited = useContext(InheritedFont);
  const flat = StyleSheet.flatten(style) ?? {};
  let family = flat.fontFamily ?? inherited;
  if (families.has(family) && flat.fontWeight) {
    const weight =
      flat.fontWeight === "bold" ? 700 : Number(flat.fontWeight) || 400;
    family =
      weight >= 800
        ? fonts.display
        : weight >= 700
          ? fonts.bold
          : weight >= 500
            ? fonts.medium
            : fonts.body;
  }
  return (
    <InheritedFont.Provider value={family}>
      <NativeText
        ref={ref}
        {...props}
        style={[
          { fontFamily: family, includeFontPadding: false },
          style,
          families.has(family) && { fontFamily: family, fontWeight: "normal" },
        ]}
      >
        {children}
      </NativeText>
    </InheritedFont.Provider>
  );
});
