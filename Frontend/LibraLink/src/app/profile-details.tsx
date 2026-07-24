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
import { usersService } from "../services/users";

/** Light scrim so dark text / light cards stay readable over the library photo. */
const LIGHT_LIBRARY_OVERLAY = "rgba(240, 245, 250, 0.78)";

export default function ProfileDetails() {
  const router = useRouter();
  const { userId, token, roles, firstName, lastName, email: sessionEmail, institutionId, setSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [indexNumber, setIndexNumber] = useState("");
  const [programme, setProgramme] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();

  // Seed from the cached session immediately, then hydrate the extra fields (which the
  // session doesn't carry) from the full user record.
  useEffect(() => {
    setName([firstName, lastName].filter(Boolean).join(" "));
    setEmail(sessionEmail || "");
  }, [firstName, lastName, sessionEmail]);

  useEffect(() => {
    if (!userId) return;
    usersService
      .getById(userId)
      .then((user) => {
        setName([user.firstName, user.lastName].filter(Boolean).join(" ") || "");
        setEmail(user.email || "");
        setPhone(user.phoneNumber || "");
        setStudentId(user.studentId || "");
        setIndexNumber(user.indexNumber || "");
        setProgramme(user.programme || "");
      })
      .catch(() => {
        /* keep session-seeded values */
      });
  }, [userId]);

  const handleSave = async () => {
    if (!userId || !token) {
      setErrorMsg("You need to be signed in to update your profile.");
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg("Enter your name.");
      return;
    }
    const cleanStudentId = studentId.replace(/\D/g, "");
    const cleanIndex = indexNumber.replace(/\D/g, "");
    if (cleanStudentId && cleanStudentId.length !== 8) {
      setErrorMsg("Student ID must be 8 digits.");
      return;
    }
    if (cleanIndex && cleanIndex.length !== 7) {
      setErrorMsg("Index number must be 7 digits.");
      return;
    }
    const [first, ...rest] = trimmed.split(/\s+/);
    const last = rest.join(" ");
    setIsUpdating(true);
    setMsg("");
    setErrorMsg("");
    try {
      const updated = await usersService.updateProfile(userId, {
        firstName: first,
        lastName: last,
        phoneNumber: phone.trim(),
        studentId: cleanStudentId,
        indexNumber: cleanIndex,
        programme: programme.trim(),
      });
      await setSession({
        token,
        userId,
        roles,
        firstName: updated.firstName || first,
        lastName: updated.lastName || last,
        email: sessionEmail || undefined,
        institutionId,
      });
      setMsg("Profile updated successfully!");
    } catch (e: any) {
      setErrorMsg(e?.message || "Could not update your profile.");
    } finally {
      setIsUpdating(false);
    }
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

        {errorMsg ? (
          <View style={[styles.successMsgContainer, { backgroundColor: colors.dangerLight, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md }]}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} style={{ marginRight: spacing.xs }} />
            <Text style={[styles.successMsgText, { color: colors.danger }]}>
              {errorMsg}
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
            editable={false}
            keyboardType="email-address"
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textMuted} />}
            variant={isDark ? "glass" : "light"}
          />
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: -spacing.xs, marginBottom: spacing.sm }}>
            Email can't be changed here — contact the library to update it.
          </Text>
          <Input
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={20} color={colors.textMuted} />}
            variant={isDark ? "glass" : "light"}
          />
          <Input
            label="Student ID (8 digits)"
            value={studentId}
            onChangeText={(v) => setStudentId(v.replace(/\D/g, "").slice(0, 8))}
            keyboardType="number-pad"
            maxLength={8}
            leftIcon={<Ionicons name="card-outline" size={20} color={colors.textMuted} />}
            variant={isDark ? "glass" : "light"}
          />
          <Input
            label="Index number (7 digits)"
            value={indexNumber}
            onChangeText={(v) => setIndexNumber(v.replace(/\D/g, "").slice(0, 7))}
            keyboardType="number-pad"
            maxLength={7}
            leftIcon={<Ionicons name="finger-print-outline" size={20} color={colors.textMuted} />}
            variant={isDark ? "glass" : "light"}
          />
          <Input
            label="Programme"
            value={programme}
            onChangeText={setProgramme}
            leftIcon={<Ionicons name="school-outline" size={20} color={colors.textMuted} />}
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
