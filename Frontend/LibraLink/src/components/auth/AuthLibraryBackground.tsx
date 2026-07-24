import { ImageBackground, StyleSheet, View } from "react-native";

const LIBRARY_BG = require("../../../assets/images/onboarding-library-bg.png");

/** Deep navy scrim — sharp photo underneath, inputs stay readable. */
export const AUTH_LIBRARY_OVERLAY = "rgba(10, 22, 40, 0.70)";

/**
 * Full-screen library photo with overlay (no blur).
 * Sit behind SafeAreaView content (absolute fill).
 */
export function AuthLibraryBackground({
  overlayColor = AUTH_LIBRARY_OVERLAY,
}: {
  overlayColor?: string;
}) {
  return (
    <ImageBackground
      source={LIBRARY_BG}
      style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { backgroundColor: overlayColor }]} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
