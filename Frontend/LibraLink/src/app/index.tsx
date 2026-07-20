import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View, ActivityIndicator } from "react-native";
import ScreenWrapper from "../components/common/ScreenWrapper";

export default function Index() {
  const router = useRouter();

  // Animation values
  const screenFade = useRef(new Animated.Value(1)).current;
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const shadowOpacity = useRef(new Animated.Value(0)).current;
  const loaderFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Initial Intro Animations: Fade/Scale in logo and shadow glow (800ms)
    Animated.parallel([
      Animated.timing(logoFade, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.75,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(loaderFade, {
        toValue: 1,
        duration: 400,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Pulse / Blink shadow glow twice (4 * 300ms = 1200ms)
      Animated.sequence([
        // First Blink (600ms)
        Animated.timing(shadowOpacity, {
          toValue: 0.15,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shadowOpacity, {
          toValue: 0.75,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        // Second Blink (600ms)
        Animated.timing(shadowOpacity, {
          toValue: 0.15,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shadowOpacity, {
          toValue: 0.75,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 3. Delay slightly (450ms) to hit the 2.45s mark before fade-out starts
        setTimeout(() => {
          // 4. Smooth fade-out of the entire screen content (550ms)
          // Completing exactly at 3000ms
          Animated.timing(screenFade, {
            toValue: 0,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            // 5. Smooth transition to the onboarding page
            router.replace("./onboarding");
          });
        }, 450);
      });
    });
  }, [router, logoFade, logoScale, shadowOpacity, loaderFade, screenFade]);

  return (
    <ScreenWrapper
      statusBarColor="#ffffff"
      statusBarStyle="dark-content"
      style={styles.screen}
      edges={["top", "bottom", "left", "right"]}
    >
      <Animated.View style={[styles.container, { opacity: screenFade }]}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Ambient Shadow Glow layer positioned absolute behind the logo */}
          <Animated.Image
            source={require("../../assets/images/logo-glow.png")}
            style={[styles.logoShadow, { opacity: shadowOpacity }]}
            resizeMode="contain"
          />

          {/* Core Logo Image */}
          <Animated.Image
            source={require("../../assets/images/logo.png")}
            style={[styles.logo, { opacity: logoFade }]}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.loaderContainer, { opacity: loaderFade }]}>
          <ActivityIndicator size="small" color="#0b6efd" style={styles.loader} />
        </Animated.View>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    width: "100%",
    height: "100%",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 320,
    height: 320,
    position: "relative",
  },
  logoShadow: {
    position: "absolute",
    width: 440,
    height: 440,
    zIndex: -1,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  loaderContainer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    transform: [{ scale: 1.2 }],
  },
});

