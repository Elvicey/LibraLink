import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";

export default function ProfileDetails() {
  const router = useRouter();
  const [name, setName] = useState("Esther Asamoah");
  const [email, setEmail] = useState("esther@knust.edu.gh");
  const [campus, setCampus] = useState("KNUST Main Library");
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState("");
  const { colors, spacing, borderRadius, typography } = useTheme();

  const handleSave = () => {
    setIsUpdating(true);
    setMsg("");
    setTimeout(() => {
      setIsUpdating(false);
      setMsg("Profile updated successfully!");
    }, 1500);
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Profile details
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Manage your contact information and campus choices.
      </Text>

      {msg ? (
        <Text style={[styles.successMsg, { backgroundColor: colors.successLight, color: colors.success, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md }]}>
          {msg}
        </Text>
      ) : null}

      <Card style={{ marginBottom: spacing.xl }}>
        <Input
          label="Full Name"
          value={name}
          onChangeText={setName}
        />
        <Input
          label="Student Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Input
          label="Preferred Campus"
          value={campus}
          onChangeText={setCampus}
        />
      </Card>

      <Button
        title={isUpdating ? "Saving changes..." : "Save changes"}
        onPress={handleSave}
        loading={isUpdating}
        style={[styles.saveButton, { paddingVertical: spacing.md, borderRadius: borderRadius.xl }]}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  backButton: {
    marginBottom: 12,
    alignSelf: "flex-start",
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
  successMsg: {
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(21, 128, 61, 0.15)",
  },
  saveButton: {
    paddingVertical: 12,
  },
});
