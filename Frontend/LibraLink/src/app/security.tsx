import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { loginColors } from "../constants/loginTheme";
import { useTheme } from "../constants/theme";

const ACCENT = loginColors.teal;

const INITIAL_DEVICES: { id: string; name: string; location: string; isPhone: boolean }[] = [];

export default function Security() {
  const router = useRouter();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();

  const handleRevokeDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const CustomSwitch = ({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) => (
    <Pressable
      style={[
        styles.switchBase,
        value
          ? { backgroundColor: colors.success }
          : { backgroundColor: colors.borderDark },
      ]}
      onPress={() => onValueChange(!value)}
    >
      <View
        style={[
          styles.switchThumb,
          { backgroundColor: colors.textLight },
          value ? styles.switchThumbActive : styles.switchThumbInactive,
        ]}
      />
    </Pressable>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
      {/* Back button with chevron icon */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonRow}>
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
          <Text style={[styles.backText, { color: ACCENT }]}>Back</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Security
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Manage settings and secure sessions for your library account.
      </Text>

      {/* Account Authentication Toggles */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Login Security</Text>
      <Card style={[styles.formCard, isDark ? styles.formCardDark : null, { padding: spacing.md, marginBottom: spacing.xl }]}>
        <View style={[styles.toggleRow, { paddingVertical: spacing.md, borderColor: colors.border }]}>
          <View style={[styles.toggleTextSection, { marginRight: spacing.md }]}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Two-Factor Authentication</Text>
            <Text style={[styles.settingDesc, { color: colors.textMuted, marginTop: spacing.xs }]}>
              Requires double verification for student credentials.
            </Text>
          </View>
          <CustomSwitch value={mfaEnabled} onValueChange={setMfaEnabled} />
        </View>
        <View style={[styles.toggleRow, styles.lastToggleRow, { paddingVertical: spacing.md }]}>
          <View style={[styles.toggleTextSection, { marginRight: spacing.md }]}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Biometric Logins</Text>
            <Text style={[styles.settingDesc, { color: colors.textMuted, marginTop: spacing.xs }]}>
              Use FaceID or Fingerprint checks to sign in.
            </Text>
          </View>
          <CustomSwitch value={biometricsEnabled} onValueChange={setBiometricsEnabled} />
        </View>
      </Card>

      {/* Connected Sessions */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Connected Devices</Text>
      <Card style={[styles.formCard, isDark ? styles.formCardDark : null, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.sm }]}>
        {devices.length === 0 ? (
          <Text style={[styles.noDevicesText, { color: colors.textMuted, paddingVertical: spacing.lg }]}>
            No active devices connected.
          </Text>
        ) : (
          devices.map((device, idx) => (
            <View
              key={device.id}
              style={[
                styles.deviceRow,
                { paddingVertical: spacing.md, borderColor: colors.border },
                idx === devices.length - 1 && styles.lastDeviceRow,
              ]}
            >
              <View style={[styles.deviceInfo, { gap: spacing.md }]}>
                {/* Circular styled icon background */}
                <View style={[styles.deviceIconWrapper, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : colors.background }]}>
                  <Ionicons
                    name={device.isPhone ? "phone-portrait-outline" : "laptop-outline"}
                    size={20}
                    color={colors.text}
                  />
                </View>
                <View>
                  <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
                  <Text style={[styles.deviceLoc, { color: colors.textMuted, marginTop: spacing.xs }]}>
                    {device.location}
                  </Text>
                </View>
              </View>
              {device.id !== "1" && (
                <Button
                  title="Revoke"
                  variant="text"
                  size="sm"
                  onPress={() => handleRevokeDevice(device.id)}
                  icon={<Ionicons name="close-circle-outline" size={14} color={colors.danger} />}
                  textStyle={{ color: colors.danger, fontSize: 13, fontWeight: "700" }}
                />
              )}
            </View>
          ))
        )}
      </Card>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    backgroundColor: "transparent",
  },
  backButton: {
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  backButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -4,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  formCard: {
    padding: 16,
  },
  formCardDark: {
    backgroundColor: "rgba(24, 28, 51, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  lastToggleRow: {
    borderBottomWidth: 0,
  },
  toggleTextSection: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  settingDesc: {
    fontSize: 12,
  },
  // Custom switch styling
  switchBase: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: "center",
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: "flex-end",
  },
  switchThumbInactive: {
    alignSelf: "flex-start",
  },
  // Device layout
  deviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  lastDeviceRow: {
    borderBottomWidth: 0,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "700",
  },
  deviceLoc: {
    fontSize: 12,
  },
  noDevicesText: {
    fontSize: 14,
    textAlign: "center",
  },
});
