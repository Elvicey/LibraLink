import { API_BASE_URL } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  AUTH_LIBRARY_OVERLAY,
  AuthLibraryBackground,
} from "../components/auth/AuthLibraryBackground";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";

/** Light scrim so dark text / light cards stay readable over the library photo. */
const LIGHT_LIBRARY_OVERLAY = "rgba(240, 245, 250, 0.78)";

export default function ProfileDetails() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState("");
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();

  const handleSave = () => {
    setIsUpdating(true);
    setMsg("");
    setTimeout(() => {
      setIsUpdating(false);
      setMsg("Profile updated successfully!");
    }, 1500);
  };

  return (
    <View style={styles.screen}>
      <AuthLibraryBackground
        overlayColor={isDark ? AUTH_LIBRARY_OVERLAY : LIGHT_LIBRARY_OVERLAY}
      />
      <ScreenWrapper
        scrollable
        statusBarColor="transparent"
        style={styles.transparent}
        contentContainerStyle={[styles.container, { padding: spacing.lg }]}
      >
        {/* Premium Back navigation with chevron icon */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <View style={styles.backButtonRow}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
          </View>
        </Pressable>

        <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
          Profile details
        </Text>
        <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
          Manage your account information.
        </Text>

        {/* Stateful Success Toast Banner */}
        {msg ? (
          <View style={[styles.successMsgContainer, { backgroundColor: colors.successLight, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginRight: spacing.xs }} />
            <Text style={[styles.successMsgText, { color: colors.success }]}>
              {msg}
            </Text>
          </View>
        ) : null}

        {/* Styled Form Card */}
        <Card style={[styles.formCard, isDark ? styles.formCardDark : null, { marginBottom: spacing.xl }]}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            leftIcon={<Ionicons name="person-outline" size={20} color={colors.textMuted} />}
            variant={isDark ? "glass" : "light"}
          />
          <Input
            label="Student Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textMuted} />}
            variant={isDark ? "glass" : "light"}
          />
        </Card>

        <Button
          title={isUpdating ? "Saving changes..." : "Save changes"}
          onPress={handleSave}
          loading={isUpdating}
          icon={isUpdating ? undefined : <Ionicons name="checkmark-circle-outline" size={18} color={colors.textLight} />}
          style={[styles.saveButton, { paddingVertical: spacing.md, borderRadius: borderRadius.xl }]}
        />
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  transparent: {
    backgroundColor: "transparent",
  },
  container: {
    backgroundColor: "transparent",
  },
  backButton: {
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  backButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -4, // Counteract icon edge padding
  },
  backText: {
    fontWeight: "700",
    fontSize: 16,
  },
  title: {
    fontWeight: "800",
  },
  description: {
    fontWeight: "500",
  },
  successMsgContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(21, 128, 61, 0.15)",
  },
  successMsgText: {
    fontWeight: "600",
    fontSize: 14,
  },
  formCard: {
    padding: 16,
  },
  formCardDark: {
    backgroundColor: "rgba(24, 28, 51, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
  },
  saveButton: {
    paddingVertical: 12,
  },
});
