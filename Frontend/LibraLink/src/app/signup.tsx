import { useRouter } from "expo-router";
import { useState } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { theme, darkColors } from "../constants/theme";
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
      statusBarColor="#060913"
      statusBarStyle="light-content"
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      {/* Absolute background image placed inside the ScreenWrapper */}
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
            backgroundColor: "rgba(16, 185, 129, 0.2)", // Emerald Green Orb
            top: "8%",
            left: "-12%",
            shadowColor: "#10b981",
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            backgroundColor: "rgba(11, 110, 253, 0.22)", // Primary Blue Orb
            bottom: "12%",
            right: "-15%",
            width: 250,
            height: 250,
            borderRadius: 125,
            shadowColor: darkColors.primary,
          },
        ]}
      />

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
          variant="glass"
          editable={!loading}
        />
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
        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          variant="glass"
          editable={!loading}
        />

        <Button
          title="Sign up"
          onPress={handleSignUp}
          loading={loading}
          style={[styles.submitButton, { backgroundColor: darkColors.primary }]}
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
    backgroundColor: "#060913", // Fallback color
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(6, 9, 19, 0.65)", // Moody overlay shield showing shelf background
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
    marginBottom: theme.spacing.xl,
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
  bottomLink: {
    alignSelf: "center",
  },
  bottomText: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  bottomLinkText: {
    color: darkColors.primary,
    fontWeight: "700",
  },
});

