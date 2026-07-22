import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { theme, lightColors } from "../constants/theme";
import { API_BASE_URL } from "../config/api";

export default function SignIn() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;
    if (!cleanEmail || !cleanPassword) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Invalid email or password.");
      }

      const roles: string[] = data.roles || [];
      const isAcademic = roles.some((r) => r === "STUDENT" || r === "LECTURER");
      if (!isAcademic) {
        throw new Error("Use the Librarian / Admin portal for staff accounts.");
      }

      await setSession({
        token: data.token,
        userId: data.userId,
        roles,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        institutionId: data.institutionId ?? null,
      });
      router.replace("/(tabs)/home" as any);
    } catch (e: any) {
      Alert.alert(
        "Sign in failed",
        e.message || "Check your email and password, then try again."
      );
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
          <Text style={styles.title}>Academic Portal</Text>
          <Text style={styles.subtitle}>
            Sign in as Student or Lecturer — same library screens
          </Text>
        </View>

        <Input
          label="Student Email"
          placeholder="you@knust.edu.gh"
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
          title="Sign in"
          onPress={handleSignIn}
          loading={loading}
          style={[styles.submitButton, { backgroundColor: lightColors.primary }]}
          textStyle={styles.submitButtonText}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialRow}>
          <Button
            title="Google"
            variant="outline"
            onPress={() => {}}
            style={styles.socialButton}
            textStyle={styles.socialText}
          />
          <Button
            title="Student ID"
            variant="outline"
            onPress={() => {}}
            style={styles.socialButton}
            textStyle={styles.socialText}
          />
        </View>

        <Pressable
          style={styles.bottomLink}
          onPress={() => router.push("/signup" as any)}
        >
          <Text style={styles.bottomText}>
            No account? <Text style={styles.bottomLinkText}>Sign up</Text>
          </Text>
        </Pressable>

        <Pressable
          style={styles.librarianLink}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.librarianLinkText}>
            <Text style={styles.librarianLinkHighlight}>← Back to role selection</Text>
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
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: lightColors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: lightColors.textMuted,
    fontSize: theme.typography.bodyLarge.fontSize,
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(13, 37, 63, 0.1)",
  },
  dividerText: {
    color: lightColors.textMuted,
    marginHorizontal: theme.spacing.md,
    fontSize: 14,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  socialButton: {
    flex: 1,
    borderColor: "rgba(13, 37, 63, 0.1)",
    backgroundColor: "rgba(13, 37, 63, 0.02)",
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1.5,
  },
  socialText: {
    color: lightColors.text,
    fontWeight: "600",
  },
  bottomLink: {
    alignSelf: "center",
    marginTop: theme.spacing.xs,
  },
  bottomText: {
    color: lightColors.textMuted,
  },
  bottomLinkText: {
    color: lightColors.primary,
    fontWeight: "700",
  },
  librarianLink: {
    alignSelf: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  librarianLinkText: {
    color: lightColors.textMuted,
    fontSize: 13,
  },
  librarianLinkHighlight: {
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
