import { useRouter } from "expo-router";
import { useState } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { theme, darkColors } from "../constants/theme";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            backgroundColor: "rgba(11, 110, 253, 0.25)", // Primary Blue Orb
            top: "5%",
            right: "-10%",
            shadowColor: darkColors.primary,
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            backgroundColor: "rgba(139, 92, 246, 0.18)", // Purple Orb
            bottom: "10%",
            left: "-15%",
            width: 260,
            height: 260,
            borderRadius: 130,
            shadowColor: "#8b5cf6",
          },
        ]}
      />

      {/* Glassmorphic Form Card */}
      <View style={styles.glassCard}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to access your library account
          </Text>
        </View>

        <Input
          label="Student Email"
          placeholder="you@knust.edu.gh"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          variant="glass"
        />
        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          variant="glass"
        />

        {/* Role-based routing info banner */}
        <Text style={styles.roleNote}>
          ℹ️ Students use standard logins. Librarians log in with <Text style={{ fontWeight: "700" }}>admin@knust.edu.gh</Text>.
        </Text>

        <Pressable
          style={styles.linkButton}
          onPress={() => router.push("/forgot-password" as any)}
        >
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>

        <Button
          title="Sign in"
          onPress={() => {
            const isLibrarian = email.toLowerCase().includes("admin") || email.toLowerCase().includes("librarian");
            if (isLibrarian) {
              router.replace("/admin" as any);
            } else {
              router.replace("/home" as any);
            }
          }}
          style={[styles.submitButton, { backgroundColor: darkColors.primary }]}
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
  linkButton: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.xl,
  },
  linkText: {
    color: darkColors.primary,
    fontWeight: "600",
  },
  roleNote: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 13,
    lineHeight: 18,
    marginVertical: theme.spacing.sm,
    backgroundColor: "rgba(11, 110, 253, 0.12)",
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(11, 110, 253, 0.25)",
  },
  submitButton: {
    width: "100%",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.4)",
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
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1.5,
  },
  socialText: {
    color: darkColors.textLight,
    fontWeight: "600",
  },
  bottomLink: {
    alignSelf: "center",
    marginTop: theme.spacing.xs,
  },
  bottomText: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  bottomLinkText: {
    color: darkColors.primary,
    fontWeight: "700",
  },
});
