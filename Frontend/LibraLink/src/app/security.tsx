import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";

const INITIAL_DEVICES = [
  { id: "1", name: "Esther's iPhone 14 Pro", location: "Accra, Ghana (Active Now)", icon: "📱" },
  { id: "2", name: "Chrome on macOS", location: "KNUST Campus Net", icon: "💻" },
  { id: "3", name: "TECNO Camon 20", location: "Kumasi, Ghana", icon: "📱" },
];

export default function Security() {
  const router = useRouter();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const { colors, spacing, borderRadius, typography } = useTheme();

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
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Security
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Manage settings and secure sessions for your library account.
      </Text>

      {/* Account Authentication Toggles */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginVertical: spacing.md }]}>Login Security</Text>
      <Card style={{ padding: spacing.md, marginBottom: spacing.sm }}>
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
      <Text style={[styles.sectionTitle, { color: colors.text, marginVertical: spacing.md }]}>Connected Devices</Text>
      <Card style={{ padding: spacing.md, marginBottom: spacing.sm }}>
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
                <Text style={styles.deviceIcon}>{device.icon}</Text>
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
                  textStyle={{ color: colors.danger, fontSize: 13, fontWeight: "700" }}
                />
              )}
            </View>
          ))
        )}
      </Card>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
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
  deviceIcon: {
    fontSize: 24,
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
