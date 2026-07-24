import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import LoginScreen from "../components/auth/LoginScreen";
import { lightColors } from "../constants/theme";

const ONBOARDING_SEEN_KEY = "hasSeenOnboarding";

export default function LoginEntry() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const checkOnboarding = async () => {
      if (__DEV__) {
        setTimeout(() => {
          if (active) router.replace("/onboarding");
        }, 0);
        return;
      }

      const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
      if (!active) return;

      if (seen !== "true") {
        setTimeout(() => {
          if (active) router.replace("/onboarding");
        }, 0);
        return;
      }

      setReady(true);
    };

    checkOnboarding();

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={lightColors.primary} />
      </View>
    );
  }

  return <LoginScreen />;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a1628",
  },
});
