import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { theme, darkColors } from "../constants/theme";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <ScreenWrapper
      scrollable
      statusBarColor="#060913"
      statusBarStyle="light-content"
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
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

        <Input
          label="Full Name"
          placeholder="Esther Asamoah"
          value={name}
          onChangeText={setName}
          variant="glass"
        />
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

        <Button
          title="Sign up"
          onPress={() => router.replace("/home" as any)}
          style={[styles.submitButton, { backgroundColor: darkColors.primary }]}
          textStyle={styles.submitButtonText}
        />

        <Pressable
          style={styles.bottomLink}
          onPress={() => router.replace("/signin" as any)}
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
    backgroundColor: "#060913", // Deep dark canvas background
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
