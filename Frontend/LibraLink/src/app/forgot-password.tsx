import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { theme, lightColors } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async () => {
    if (!email.trim()) {
      setError("Please enter your student email address.");
      return;
    }
    
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Simulate API call for password reset link dispatch
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to request password reset. Please try again.");
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

      <View style={styles.glassCard}>
        {/* Back navigation Row */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Ionicons name="chevron-back" size={20} color={lightColors.primary} />
          <Text style={styles.backText}>Back to Sign In</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            Enter your KNUST student email and we'll send you a password recovery link
          </Text>
        </View>

        {success ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="mail-open-outline" size={42} color="#10b981" />
            </View>
            <Text style={styles.successTitle}>Check your inbox</Text>
            <Text style={styles.successText}>
              We have sent password reset instructions to{"\n"}
              <Text style={{ fontWeight: "700", color: lightColors.text }}>{email.trim()}</Text>
            </Text>
            <Button
              title="Return to Sign In"
              onPress={() => router.replace("/signin" as any)}
              style={styles.successButton}
            />
          </View>
        ) : (
          <>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Student Email"
              placeholder="you@knust.edu.gh"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <Button
              title="Send recovery link"
              onPress={handleResetRequest}
              loading={loading}
              style={[styles.submitButton, { backgroundColor: lightColors.primary }]}
              textStyle={styles.submitButtonText}
            />
          </>
        )}
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    marginLeft: -4,
  },
  backText: {
    color: lightColors.primary,
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 2,
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
    lineHeight: 20,
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
  successContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: lightColors.text,
    marginBottom: theme.spacing.xs,
  },
  successText: {
    color: lightColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  successButton: {
    width: "100%",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
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
