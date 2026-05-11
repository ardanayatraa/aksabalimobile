import { Text } from "react-native";
import type { TextProps, TextStyle } from "react-native";

export const BALI_FONT = "NotoSansBalinese_400Regular";

type Props = Omit<TextProps, "style"> & {
  children: string;
  size?: number;
  style?: TextStyle;
  color?: string;
};

export function Glyph({ children, size = 48, style, color, ...rest }: Props) {
  return (
    <Text
      {...rest}
      allowFontScaling={false}
      style={[
        {
          fontFamily: BALI_FONT,
          fontSize: size,
          // Aksara Bali punya mark di atas (tedung/ulu) & ekor di bawah (gantungan).
          // lineHeight 2.2× supaya descender (ekor bawah) ada ruang dan ga ke-clip.
          // paddingTop angkat glyph ke atas biar ekor bawah ga nyentuh dasar frame.
          // paddingRight geser visual ke kiri (tedung/gantungan sering keluar ke kanan).
          lineHeight: Math.round(size * 2.2),
          paddingTop: Math.round(size * 0.25),
          paddingRight: Math.round(size * 0.18),
          textAlign: "center",
          color
        },
        style
      ]}
    >
      {children}
    </Text>
  );
}
