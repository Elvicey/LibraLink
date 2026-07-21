import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/api";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { theme, lightColors } from "../constants/theme";

export default function LibrarianSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password.");
      }

      const roles: string[] = data.roles || [];
      const isLibrarian = roles.some(
        (r) => r === "LIBRARIAN" || r === "ADMIN"
      );

      if (!isLibrarian) {
        throw new Error("This account does not have librarian privileges.");
      }

      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("userId", String(data.userId));
      await AsyncStorage.setItem("userRoles", JSON.stringify(roles));
      router.replace("/admin" as any);
    } catch (e: any) {
      Alert.alert("Sign in failed", e.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      scrollable
      statusBarColor="#ffffff"
      statusBarStyle="dark-content"
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      {/* Decorative background circles */}
      <View style={styles.backgroundCirclesContainer}>
        <View style={[styles.circle, styles.circleBlueLarge, { top: -100, left: -100 }]} />
        <View style={[styles.circle, styles.circleYellowMedium, { top: 80, right: -40 }]} />
        <View style={[styles.circle, styles.circleBlueRing, { top: "45%", left: -50 }]} />
        <View style={[styles.circle, styles.circleYellowSmall, { bottom: 120, left: -30 }]} />
        <View style={[styles.circle, styles.circleBlueLarge, { bottom: -120, right: -80 }]} />
        <View style={[styles.circle, styles.circleYellowRing, { top: "25%", right: "15%" }]} />
      </View>

      {/* Glassmorphic Form Card */}
      <View style={styles.glassCard}>
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconBadgeText}>📚</Text>
          </View>
          <Text style={styles.title}>Librarian Portal</Text>
          <Text style={styles.subtitle}>
            Sign in with your staff credentials
          </Text>
        </View>

        <Input
          label="Staff Email"
          placeholder="admin@knust.edu.gh"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={styles.linkButton}
          onPress={() => router.push("/forgot-password" as any)}
        >
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>

        <Button
          title={loading ? "Signing in..." : "Sign in as Librarian"}
          onPress={handleSignIn}
          loading={loading}
          style={[styles.submitButton, { backgroundColor: lightColors.primary }]}
          textStyle={styles.submitButtonText}
        />

        <Pressable
          style={styles.studentLink}
          onPress={() => router.replace("/signin" as any)}
        >
          <Text style={styles.studentLinkText}>
            Are you a student? <Text style={styles.studentLinkHighlight}>Sign in here</Text>
          </Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#ffffff",
  },
  container: {
    padding: theme.spacing.lg,
    justifyContent: "center",
    minHeight: "100%",
    position: "relative",
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1.5,
    borderColor: "rgba(13, 37, 63, 0.08)",
    borderRadius: theme.borderRadius.huge,
    padding: theme.spacing.xl,
    shadowColor: "#0d253f",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: "center",
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(11, 110, 253, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  iconBadgeText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: lightColors.text,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    color: lightColors.textMuted,
    fontSize: theme.typography.bodyLarge.fontSize,
    textAlign: "center",
  },
  linkButton: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.xl,
  },
  linkText: {
    color: lightColors.primary,
    fontWeight: "600",
  },
  submitButton: {
    width: "100%",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: lightColors.textLight,
    fontSize: 16,
    fontWeight: "700",
  },
  studentLink: {
    alignSelf: "center",
    marginTop: theme.spacing.xl,
  },
  studentLinkText: {
    color: lightColors.textMuted,
    fontSize: 14,
  },
  studentLinkHighlight: {
    color: lightColors.primary,
    fontWeight: "700",
  },
  backgroundCirclesContainer: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    zIndex: -1,
  },
  circle: {
    position: "absolute",
  },
  circleBlueLarge: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(13, 37, 63, 0.5)",
  },
  circleBlueRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "rgba(13, 37, 63, 0.5)",
  },
  circleYellowMedium: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(245, 186, 19, 0.5)",
  },
  circleYellowSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 186, 19, 0.5)",
  },
  circleYellowRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: "rgba(245, 186, 19, 0.5)",
  },
});
