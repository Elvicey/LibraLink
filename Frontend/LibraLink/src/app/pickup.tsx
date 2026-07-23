import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { PickupSlotResponse, reservationsService } from "../services/reservations";

const PICKUP_TIMES = [
  { label: "9:00 AM – 11:00 AM", start: 9, end: 11 },
  { label: "11:00 AM – 1:00 PM", start: 11, end: 13 },
  { label: "1:00 PM – 3:00 PM", start: 13, end: 15 },
  { label: "3:00 PM – 5:00 PM", start: 15, end: 17 },
];

function toLocalIso(date: Date, hour: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:00:00`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function BookPickup() {
  const router = useRouter();
  const { userId, token, roles } = useAuth();
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);
  const isStaff = roles.includes("LIBRARIAN") || roles.includes("ADMIN");

  const [slots, setSlots] = useState<PickupSlotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<PickupSlotResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState(PICKUP_TIMES[0]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const pickupDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let index = 1; index <= 14; index += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      dates.push(date);
    }
    return dates;
  }, []);

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

  const openScheduler = (slot: PickupSlotResponse) => {
    setSelectedSlot(slot);
    setSelectedDate(pickupDates[0]);
    setSelectedTime(PICKUP_TIMES[0]);
  };

  const saveSchedule = async () => {
    if (!userId || !selectedSlot || !selectedDate) return;
    setSavingSchedule(true);
    try {
      await reservationsService.schedulePickup({
        userId,
        reservationId: selectedSlot.reservationId,
        slotStart: toLocalIso(selectedDate, selectedTime.start),
        slotEnd: toLocalIso(selectedDate, selectedTime.end),
      });
      const chosenDate = formatDate(selectedDate);
      setSelectedSlot(null);
      Alert.alert("Pickup scheduled", `Your pickup is booked for ${chosenDate}, ${selectedTime.label}.`);
      await load();
    } catch (e: any) {
      Alert.alert("Could not schedule pickup", e?.message || "Please try again.");
    } finally {
      setSavingSchedule(false);
    }
  };

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
          <Pressable style={styles.scheduleButton} onPress={() => openScheduler(slot)}>
            <Ionicons name="calendar-outline" size={17} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
              Choose pickup date & time
            </Text>
          </Pressable>
        </Card>
      ))}

      <Modal visible={!!selectedSlot} transparent animationType="slide" onRequestClose={() => setSelectedSlot(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={{ color: colors.text, fontSize: 19, fontWeight: "800" }}>Schedule pickup</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 3 }}>Choose a convenient collection window</Text>
              </View>
              <Pressable onPress={() => setSelectedSlot(null)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Select a date</Text>
            <View style={styles.dateGrid}>
              {pickupDates.map((date) => {
                const selected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <Pressable key={date.toISOString()} onPress={() => setSelectedDate(date)} style={[styles.dateChip, { borderColor: colors.border, backgroundColor: colors.background }, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Text style={[styles.dateChipText, { color: colors.textMuted }, selected && { color: colors.textLight }]}>{formatDate(date)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Select a time</Text>
            <View style={styles.timeGrid}>
              {PICKUP_TIMES.map((time) => {
                const selected = selectedTime.label === time.label;
                return (
                  <Pressable key={time.label} onPress={() => setSelectedTime(time)} style={[styles.timeChip, { borderColor: colors.border, backgroundColor: colors.background }, selected && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                    <Ionicons name="time-outline" size={16} color={selected ? colors.primary : colors.textMuted} />
                    <Text style={[styles.timeChipText, { color: colors.text }, selected && { color: colors.primary, fontWeight: "800" }]}>{time.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={[styles.confirmButton, savingSchedule && { opacity: 0.6 }]} onPress={saveSchedule} disabled={savingSchedule}>
              {savingSchedule ? <ActivityIndicator color={colors.textLight} /> : <Text style={{ color: colors.textLight, fontWeight: "800", fontSize: 15 }}>Confirm pickup time</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
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
    scheduleButton: { flexDirection: "row", alignItems: "center", gap: 7, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md },
    modalOverlay: { flex: 1, backgroundColor: "rgba(26,26,46,0.52)", justifyContent: "flex-end" },
    modalCard: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: spacing.xl, paddingBottom: spacing.xxl },
    modalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: spacing.lg },
    closeButton: { padding: spacing.xs },
    modalSectionTitle: { fontSize: 14, fontWeight: "800", marginBottom: spacing.sm, marginTop: spacing.sm },
    dateGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    dateChip: { width: "22%", minHeight: 48, borderWidth: 1, borderRadius: borderRadius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
    dateChipText: { fontSize: 11, fontWeight: "700", textAlign: "center" },
    timeGrid: { gap: spacing.sm },
    timeChip: { minHeight: 46, borderWidth: 1, borderRadius: borderRadius.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md },
    timeChipText: { fontSize: 13 },
    confirmButton: { height: 50, borderRadius: borderRadius.lg, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: spacing.xl },
  });
}
