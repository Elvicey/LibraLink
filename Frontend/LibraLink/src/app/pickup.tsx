import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { PickupSlotResponse, reservationsService } from "../services/reservations";

const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const HOURS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const PERIODS = ["AM", "PM"] as const;

function toLocalIso(date: Date, hour: number, minute: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}:00`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function sameDay(first: Date, second: Date) {
  return first.toDateString() === second.toDateString();
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [
    ...Array(firstDay.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ];
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
  const [calendarMonth, setCalendarMonth] = useState(startOfToday());
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<typeof PERIODS[number] | null>(null);
  const [openPicker, setOpenPicker] = useState<"hour" | "minute" | "period" | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);

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
    setSelectedDate(null);
    setCalendarMonth(startOfToday());
    setSelectedHour(null);
    setSelectedMinute(null);
    setSelectedPeriod(null);
    setOpenPicker(null);
  };

  const saveSchedule = async () => {
    if (!userId || !selectedSlot) return;
    if (!selectedDate || !selectedHour || !selectedMinute || !selectedPeriod) {
      Alert.alert("Pickup details required", "Choose a Pickup Date, hour, minutes, and AM/PM before confirming.");
      return;
    }
    if (selectedDate < startOfToday()) {
      Alert.alert("Invalid date", "Pickup Date cannot be in the past.");
      return;
    }
    const hour12 = Number(selectedHour);
    const minute = Number(selectedMinute);
    const startHour = selectedPeriod === "PM" ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12);
    const endDate = new Date(selectedDate);
    endDate.setHours(startHour, minute, 0, 0);
    endDate.setHours(endDate.getHours() + 2);
    setSavingSchedule(true);
    try {
      await reservationsService.schedulePickup({
        userId,
        reservationId: selectedSlot.reservationId,
        slotStart: toLocalIso(selectedDate, startHour, minute),
        slotEnd: toLocalIso(endDate, endDate.getHours(), endDate.getMinutes()),
      });
      const chosenDate = formatDate(selectedDate);
      setSelectedSlot(null);
      Alert.alert("Pickup scheduled", `Your pickup is booked for ${chosenDate}, ${selectedHour}:${selectedMinute} ${selectedPeriod}.`);
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

            <View style={styles.formGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Pickup Date</Text>
                <Text style={styles.requiredLabel}>Required</Text>
              </View>
              <View style={styles.calendarHeader}>
                <Pressable style={styles.monthButton} onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} disabled={calendarMonth.getFullYear() === startOfToday().getFullYear() && calendarMonth.getMonth() === startOfToday().getMonth()}>
                  <Ionicons name="chevron-back" size={18} color={colors.primary} />
                </Pressable>
                <Text style={[styles.monthTitle, { color: colors.text }]}>{calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
                <Pressable style={styles.monthButton} onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </Pressable>
              </View>
              <View style={styles.weekRow}>{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekLabel}>{day}</Text>)}</View>
              <View style={styles.calendarGrid}>
                {calendarDays.map((date, index) => {
                  if (!date) return <View key={`empty-${index}`} style={styles.calendarDay} />;
                  const isPast = date < startOfToday();
                  const selected = selectedDate ? sameDay(selectedDate, date) : false;
                  return (
                    <Pressable key={date.toISOString()} disabled={isPast} onPress={() => setSelectedDate(date)} style={[styles.calendarDay, selected && { backgroundColor: colors.primary }, isPast && styles.pastDay]}>
                      <Text style={[styles.calendarDayText, { color: colors.text }, isPast && { color: colors.textMuted }, selected && { color: colors.textLight, fontWeight: "800" }]}>{date.getDate()}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.selectedValue}>{selectedDate ? formatDate(selectedDate) : "Choose a date"}</Text>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Pickup Time</Text>
                <Text style={styles.requiredLabel}>Required</Text>
              </View>
              <View style={styles.timePickerRow}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Hour</Text>
                  <Pressable style={[styles.dropdownField, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => setOpenPicker(openPicker === "hour" ? null : "hour")}>
                    <Text style={[styles.dropdownValue, { color: selectedHour ? colors.text : colors.textMuted }]}>{selectedHour || "Hour"}</Text>
                    <Ionicons name={openPicker === "hour" ? "chevron-up" : "chevron-down"} size={15} color={colors.textMuted} />
                  </Pressable>
                  {openPicker === "hour" && <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>{HOURS.map((hour) => <Pressable key={hour} onPress={() => { setSelectedHour(hour); setOpenPicker(null); }} style={[styles.dropdownOption, selectedHour === hour && { backgroundColor: colors.primaryLight }]}><Text style={[styles.pickerOptionText, { color: selectedHour === hour ? colors.primary : colors.text }]}>{hour}</Text></Pressable>)}</View>}
                </View>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Minutes</Text>
                  <Pressable style={[styles.dropdownField, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => setOpenPicker(openPicker === "minute" ? null : "minute")}>
                    <Text style={[styles.dropdownValue, { color: selectedMinute ? colors.text : colors.textMuted }]}>{selectedMinute || "Min"}</Text>
                    <Ionicons name={openPicker === "minute" ? "chevron-up" : "chevron-down"} size={15} color={colors.textMuted} />
                  </Pressable>
                  {openPicker === "minute" && <View style={[styles.dropdownMenu, styles.minuteMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>{MINUTES.map((minute) => <Pressable key={minute} onPress={() => { setSelectedMinute(minute); setOpenPicker(null); }} style={[styles.dropdownOption, selectedMinute === minute && { backgroundColor: colors.primaryLight }]}><Text style={[styles.pickerOptionText, { color: selectedMinute === minute ? colors.primary : colors.text }]}>{minute}</Text></Pressable>)}</View>}
                </View>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>AM / PM</Text>
                  <Pressable style={[styles.dropdownField, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => setOpenPicker(openPicker === "period" ? null : "period")}>
                    <Text style={[styles.dropdownValue, { color: selectedPeriod ? colors.text : colors.textMuted }]}>{selectedPeriod || "AM/PM"}</Text>
                    <Ionicons name={openPicker === "period" ? "chevron-up" : "chevron-down"} size={15} color={colors.textMuted} />
                  </Pressable>
                  {openPicker === "period" && <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>{PERIODS.map((period) => <Pressable key={period} onPress={() => { setSelectedPeriod(period); setOpenPicker(null); }} style={[styles.dropdownOption, selectedPeriod === period && { backgroundColor: colors.primaryLight }]}><Text style={[styles.pickerOptionText, { color: selectedPeriod === period ? colors.primary : colors.text }]}>{period}</Text></Pressable>)}</View>}
                </View>
              </View>
              <Text style={styles.selectedValue}>{selectedHour && selectedMinute && selectedPeriod ? `${selectedHour}:${selectedMinute} ${selectedPeriod}` : "Choose hour, minutes, and AM/PM"}</Text>
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
    formGroup: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.sm },
    fieldLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    requiredLabel: { color: colors.danger, fontSize: 11, fontWeight: "700" },
    calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
    monthButton: { width: 34, height: 34, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
    monthTitle: { fontSize: 14, fontWeight: "800" },
    weekRow: { flexDirection: "row", marginTop: spacing.sm },
    weekLabel: { width: "14.28%", textAlign: "center", color: colors.textMuted, fontSize: 11, fontWeight: "700" },
    calendarGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.xs },
    calendarDay: { width: "14.28%", height: 34, alignItems: "center", justifyContent: "center", borderRadius: borderRadius.md },
    calendarDayText: { fontSize: 12 },
    pastDay: { opacity: 0.35 },
    selectedValue: { color: colors.primary, fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: spacing.sm },
    timePickerRow: { flexDirection: "row", gap: spacing.sm },
    pickerColumn: { flex: 1 },
    pickerLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "700", textAlign: "center", marginBottom: spacing.xs },
    dropdownField: { minHeight: 44, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    dropdownValue: { fontSize: 12, fontWeight: "700" },
    dropdownMenu: { position: "absolute", zIndex: 20, top: 62, left: 0, right: 0, borderWidth: 1, borderRadius: borderRadius.md, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 8, elevation: 5 },
    minuteMenu: { maxHeight: 180 },
    dropdownOption: { minHeight: 32, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
    pickerOptionText: { fontSize: 12, fontWeight: "600" },
    confirmButton: { height: 50, borderRadius: borderRadius.lg, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: spacing.xl },
  });
}
