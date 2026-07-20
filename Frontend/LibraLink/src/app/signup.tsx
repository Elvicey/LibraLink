import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { theme, lightColors } from "../constants/theme";
import { authService } from "../services/auth";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all student credentials.");
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "Student";

      await authService.register({
        firstName,
        lastName,
        email: email.trim(),
        passwordHash: password, // maps directly to backend DB password validation
        institutionId: 1, // KNUST Main Campus (default basic tier)
      });

      // Automatically routes to dashboard home screen upon successful registration
      router.replace("/home" as any);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check network connections.");
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
        {/* Large soft blue circle top left */}
        <View style={[styles.circle, styles.circleBlueLarge, { top: -100, left: -100 }]} />
        {/* Medium yellow circle top right */}
        <View style={[styles.circle, styles.circleYellowMedium, { top: 80, right: -40 }]} />
        {/* Medium blue ring middle left */}
        <View style={[styles.circle, styles.circleBlueRing, { top: "45%", left: -50 }]} />
        {/* Small yellow circle bottom left */}
        <View style={[styles.circle, styles.circleYellowSmall, { bottom: 120, left: -30 }]} />
        {/* Large blue circle bottom right */}
        <View style={[styles.circle, styles.circleBlueLarge, { bottom: -120, right: -80 }]} />
        {/* Medium-small yellow ring middle right */}
        <View style={[styles.circle, styles.circleYellowRing, { top: "25%", right: "15%" }]} />
      </View>

      {/* Glassmorphic Form Card */}
      <View style={styles.glassCard}>
        <View style={styles.header}>
          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>
            Register your student profile to start borrowing books
          </Text>
        </View>

        {/* Error warning banner */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Input
          label="Full Name"
          placeholder="Esther Asamoah"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        <Input
          label="Student Email"
          placeholder="you@knust.edu.gh"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <Button
          title="Sign up"
          onPress={handleSignUp}
          loading={loading}
          style={[styles.submitButton, { backgroundColor: lightColors.primary }]}
          textStyle={styles.submitButtonText}
        />

        <Pressable
          style={styles.bottomLink}
          onPress={() => router.replace("/signin" as any)}
          disabled={loading}
        >
          <Text style={styles.bottomText}>
            Already have an account?{" "}
            <Text style={styles.bottomLinkText}>Sign in</Text>
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
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  submitButton: {
    width: "100%",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
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
  bottomLink: {
    alignSelf: "center",
  },
  bottomText: {
    color: lightColors.textMuted,
  },
  bottomLinkText: {
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

