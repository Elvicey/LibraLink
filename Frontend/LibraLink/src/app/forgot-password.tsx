import { useRouter } from "expo-router";
import { useState } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { theme, darkColors } from "../constants/theme";
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
      statusBarColor="#060913"
      statusBarStyle="light-content"
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <ImageBackground
        source={require("../../assets/images/onboarding-bg.jpg")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={styles.darkOverlay} />

      {/* Background Ambient Glow Orbs */}
      <View
        style={[
          styles.orb,
          {
            backgroundColor: "rgba(239, 68, 68, 0.15)", // Subtle Red/Orange Glow
            top: "10%",
            right: "-15%",
            shadowColor: "#ef4444",
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            backgroundColor: "rgba(11, 110, 253, 0.2)", // Primary Blue Glow
            bottom: "15%",
            left: "-12%",
            shadowColor: darkColors.primary,
          },
        ]}
      />

      <View style={styles.glassCard}>
        {/* Back navigation Row */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Ionicons name="chevron-back" size={20} color={darkColors.primary} />
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
              <Text style={{ fontWeight: "700", color: darkColors.textLight }}>{email.trim()}</Text>
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
              variant="glass"
              editable={!loading}
            />

            <Button
              title="Send recovery link"
              onPress={handleResetRequest}
              loading={loading}
              style={[styles.submitButton, { backgroundColor: darkColors.primary }]}
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
    backgroundColor: "#060913",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(6, 9, 19, 0.65)",
  },
  container: {
    padding: theme.spacing.lg,
    justifyContent: "center",
    minHeight: "100%",
    position: "relative",
  },
  orb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 70,
    elevation: 0,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: theme.borderRadius.huge,
    padding: theme.spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    marginLeft: -4,
  },
  backText: {
    color: darkColors.primary,
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
    color: darkColors.textLight,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.65)",
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
    color: "#f87171",
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: darkColors.textLight,
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
    color: darkColors.textLight,
    marginBottom: theme.spacing.xs,
  },
  successText: {
    color: "rgba(255, 255, 255, 0.65)",
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
});
