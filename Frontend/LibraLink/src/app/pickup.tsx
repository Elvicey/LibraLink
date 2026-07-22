import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { PickupSlotResponse, reservationsService } from "../services/reservations";

export default function BookPickup() {
  const router = useRouter();
  const { userId, token, roles } = useAuth();
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);
  const isStaff = roles.includes("LIBRARIAN") || roles.includes("ADMIN");

  const [slots, setSlots] = useState<PickupSlotResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId || !token) {
      setSlots([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setSlots(await reservationsService.getPickupsForUser(userId));
    } catch (e: any) {
      Alert.alert("Could not load pickups", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text }]}>
        Pick-Up Scheduler
      </Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>
        Your reservation pickup slots from LibraLink. Reserve a title from the catalogue, then collect with your QR code.
      </Text>

      {isStaff && (
        <Card style={styles.infoCard}>
          <Text style={{ color: colors.text, fontWeight: "700", marginBottom: 4 }}>Staff tip</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            Use Scan Barcode / desk tools in the Admin console to collect scheduled pickups via QR.
          </Text>
        </Card>
      )}

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />}

      {!loading && slots.length === 0 && (
        <Card style={styles.infoCard}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>No pickup slots yet</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
            Open a book, tap Reserve, and confirm a pickup window to create one.
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/search" as any)} style={{ marginTop: spacing.md }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Browse catalogue →</Text>
          </Pressable>
        </Card>
      )}

      {slots.map((slot) => (
        <Card key={slot.id} style={styles.slotCard}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>
            Reservation #{slot.reservationId}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
            Status: {slot.status || "SCHEDULED"}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {slot.slotStart || slot.scheduledAt || "—"} → {slot.slotEnd || "—"}
          </Text>
          {!!slot.qrCode && (
            <Text style={{ color: colors.primary, fontSize: 13, marginTop: 6, fontWeight: "600" }}>
              QR: {slot.qrCode}
            </Text>
          )}
        </Card>
      ))}
    </ScreenWrapper>
  );
}

function createStyles(
  colors: any,
  spacing: any,
  borderRadius: any,
  _typography: any,
  _isDark: boolean
) {
  return StyleSheet.create({
    container: { flexGrow: 1 },
    backButton: { marginBottom: spacing.sm },
    backButtonRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    backText: { fontWeight: "600" },
    title: { fontWeight: "800", marginBottom: 4 },
    description: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
    infoCard: { marginBottom: spacing.md },
    slotCard: { marginBottom: spacing.sm },
  });
}
