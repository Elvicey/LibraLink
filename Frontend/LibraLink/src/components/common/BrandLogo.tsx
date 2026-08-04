import { Image } from "expo-image";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

const LOGO = require("../../../assets/images/libralink-logo-transparent.png");

/**
 * Square logo PNG is 1040×1040 (icon + wordmark). The device dock/keyboard bar
 * ends near y≈740; the baked wordmark starts around y≈780. Clip in the gap so the
 * full dock is visible and the wordmark stays hidden.
 */
const ICON_CLIP_FRAC = 760 / 1040;

export type BrandLogoVariant = "full" | "iconWithLabel";
export type BrandLogoSize = "auth" | "onboarding";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  style?: ViewStyle;
}

const SIZES = {
  auth: {
    fullWidth: 172,
    fullHeight: 132,
    icon: 80,
    nameSize: 26,
  },
  onboarding: {
    fullWidth: 0,
    fullHeight: 0,
    icon: 108,
    nameSize: 30,
  },
} as const;

export function BrandLogo({ variant = "full", size = "auth", style }: BrandLogoProps) {
  const dims = SIZES[size];

  if (variant === "iconWithLabel") {
    const cropHeight = dims.icon * ICON_CLIP_FRAC;
    return (
      <View style={[styles.wrap, style]} accessibilityRole="header">
        <View style={[styles.iconCrop, { width: dims.icon, height: cropHeight }]}>
          <Image
            source={LOGO}
            style={{ width: dims.icon, height: dims.icon }}
            contentFit="fill"
            accessibilityLabel="LibraLink icon"
          />
        </View>
        <Text style={[styles.name, { fontSize: dims.nameSize }]}>LibraLink</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]} accessibilityRole="header">
      <Image
        source={LOGO}
        style={{ width: dims.fullWidth, height: dims.fullHeight }}
        contentFit="contain"
        accessibilityLabel="LibraLink"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 12,
  },
  iconCrop: {
    overflow: "hidden",
  },
  name: {
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.4,
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
