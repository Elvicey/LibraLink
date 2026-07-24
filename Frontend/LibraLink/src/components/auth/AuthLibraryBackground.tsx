import { ImageBackground, StyleSheet, View } from "react-native";

const LIBRARY_BG = require("../../../assets/images/onboarding-library-bg.png");

/** Deep navy scrim — sharp photo underneath, inputs stay readable. */
const OVERLAY = "rgba(10, 22, 40, 0.70)";

/**
 * Full-screen library photo with deep navy overlay (no blur).
 * Sit behind SafeAreaView content (absolute fill).
 */
export function AuthLibraryBackground() {
  return (
    <ImageBackground
      source={LIBRARY_BG}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
      pointerEvents="none"
    >
      <View style={styles.overlay} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OVERLAY,
  },
});
