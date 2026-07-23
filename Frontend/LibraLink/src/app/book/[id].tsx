import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { bookAuthorName, booksService, Book, isBookAvailable } from "../../services/books";
import { reservationsService } from "../../services/reservations";

const HOURS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const PERIODS = ["AM", "PM"] as const;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function toLocalIso(date: Date, hour: number, minute: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}:00`;
}

function formatPickupDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))];
}

export default function BookDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params as { id: string };
  const { userId, token } = useAuth();
  const { colors, spacing, borderRadius, typography } = useTheme();

  const [reserveVisible, setReserveVisible] = useState(false);
  const [listVisible, setListVisible] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(startOfToday());
  const [pickupHour, setPickupHour] = useState<string | null>(null);
  const [pickupMinute, setPickupMinute] = useState<string | null>(null);
  const [pickupPeriod, setPickupPeriod] = useState<typeof PERIODS[number] | null>(null);
  const [openPicker, setOpenPicker] = useState<"hour" | "minute" | "period" | null>(null);
  const [pickupCampus, setPickupCampus] = useState("KNUST Main Library");
  const [reservedPass, setReservedPass] = useState<{ date: string; time: string; campus: string; qr?: string } | null>(null);
  const [folders, setFolders] = useState({
    semester: false,
    research: false,
    exam: false,
  });

  const [apiBook, setApiBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const days = useMemo(() => calendarDays(calendarMonth), [calendarMonth]);

  const load = useCallback(async () => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      setError("Invalid book id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setApiBook(await booksService.getById(numericId));
    } catch (e: any) {
      setError(e?.message || "Could not load book.");
      setApiBook(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const book = {
    title: apiBook?.title || `Book #${id}`,
    author: apiBook ? bookAuthorName(apiBook) : "Unknown Author",
    tag: apiBook?.language || "General",
    available: apiBook ? isBookAvailable(apiBook) : false,
    pages: "—",
    desc:
      apiBook?.description ||
      "No book description is available for this title yet.",
    copies: apiBook
      ? `${apiBook.availableCopies ?? 0} / ${apiBook.totalCopies ?? 0} available`
      : "—",
  };

  const getCheckbox = (checked: boolean) => (
    <View style={[styles.checkboxBase, { borderColor: colors.borderDark }, checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
      </Pressable>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />}
      {!!error && !loading && (
        <Text style={{ color: colors.danger, marginBottom: spacing.lg }}>{error}</Text>
      )}

      {!loading && !error && (
        <>
      <View style={[styles.coverSection, { marginVertical: spacing.lg }]}>
        <View style={[styles.coverPlaceholder, { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderColor: colors.border }]}>
          <Text style={styles.coverEmoji}>📖</Text>
        </View>
        <Text style={[styles.tag, { backgroundColor: colors.secondaryLight, color: colors.primary, marginTop: spacing.md, borderRadius: borderRadius.round }]}>
          {book.tag}
        </Text>
      </View>

      <View style={[styles.metaSection, { marginBottom: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, marginBottom: spacing.xs }]}>{book.title}</Text>
        <Text style={[styles.author, { color: colors.textMuted }]}>by {book.author}</Text>
      </View>

      <View style={[styles.statsRow, { gap: spacing.md, marginBottom: spacing.lg }]}>
        <Card style={[styles.statCard, { padding: spacing.md }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted, marginBottom: spacing.xs }]}>Status</Text>
          <Text
            style={[
              styles.statValue,
              { color: book.available ? colors.success : colors.danger },
            ]}
          >
            {book.available ? "Available" : "On Loan"}
          </Text>
        </Card>
        <Card style={[styles.statCard, { padding: spacing.md }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted, marginBottom: spacing.xs }]}>Copies</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{book.copies}</Text>
        </Card>
      </View>

      <View style={{ marginBottom: spacing.xl }}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>Summary</Text>
        <Text style={[styles.descText, { color: colors.textMuted }]}>{book.desc}</Text>
      </View>
        </>
      )}

      {/* Ticket Pass Output if Reserved */}
      {reservedPass ? (
        <Card style={[styles.ticketCard, { borderColor: colors.primary, borderWidth: 1.5, marginBottom: spacing.xl }]}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketBadge}>🎫 PICKUP PASS</Text>
            <Text style={[styles.ticketCode, { color: colors.primary }]}>LL-87391</Text>
          </View>
          <View style={[styles.ticketDivider, { borderColor: colors.border, marginVertical: spacing.md }]} />
          
          <View style={styles.ticketDetails}>
            <Text style={[styles.ticketLabel, { color: colors.textMuted }]}>Campus Location</Text>
            <Text style={[styles.ticketValue, { color: colors.text, marginBottom: spacing.md }]}>{reservedPass.campus}</Text>
            
            <View style={styles.ticketDateRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ticketLabel, { color: colors.textMuted }]}>Date</Text>
                <Text style={[styles.ticketValue, { color: colors.text }]}>{reservedPass.date}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ticketLabel, { color: colors.textMuted }]}>Time Slot</Text>
                <Text style={[styles.ticketValue, { color: colors.text }]}>{reservedPass.time}</Text>
              </View>
            </View>
          </View>

          {/* Mock Barcode Block */}
          <View style={[styles.barcodeContainer, { marginTop: spacing.lg }]}>
            <View style={styles.barcodeLines}>
              {[1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 3, 1, 2, 4, 1, 3].map((val, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.barcodeBar,
                    { width: val, backgroundColor: colors.text, marginRight: val % 2 === 0 ? 3 : 1 },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.barcodeNumber, { color: colors.textMuted, marginTop: spacing.sm }]}>
              *LL-87391-PASS*
            </Text>
          </View>

          <Button
            title="Cancel pickup schedule"
            variant="text"
            onPress={() => setReservedPass(null)}
            style={{ marginTop: spacing.md }}
            textStyle={{ color: colors.danger, fontWeight: "700" }}
          />
        </Card>
      ) : (
        <View style={[styles.actionSection, { gap: spacing.sm, marginBottom: spacing.xl }]}>
          <Button
            title={book.available ? "Reserve for Pickup" : "Request Hold"}
            onPress={() => setReserveVisible(true)}
            style={{ paddingVertical: spacing.md, borderRadius: borderRadius.xl }}
          />
          <Button
            title="Add to Reading List"
            onPress={() => setListVisible(true)}
            variant="outline"
            style={{ paddingVertical: spacing.md, borderRadius: borderRadius.xl }}
          />
        </View>
      )}

      {/* 1. RESERVATION PICKUP BOTTOM SHEET */}
      <Modal
        visible={reserveVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReserveVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setReserveVisible(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Schedule Pickup</Text>
              <Pressable onPress={() => setReserveVisible(false)}>
                <Text style={{ color: colors.textMuted, fontWeight: "700", fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>

            <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm }]}>Pickup Date <Text style={{ color: colors.danger }}>*</Text></Text>
            <View style={styles.calendarHeader}>
              <Pressable onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} disabled={calendarMonth.getMonth() === startOfToday().getMonth() && calendarMonth.getFullYear() === startOfToday().getFullYear()}><Text style={{ color: colors.primary, fontSize: 20 }}>‹</Text></Pressable>
              <Text style={{ color: colors.text, fontWeight: "800" }}>{calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
              <Pressable onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><Text style={{ color: colors.primary, fontSize: 20 }}>›</Text></Pressable>
            </View>
            <View style={styles.calendarGrid}>
              {days.map((date, index) => date ? <Pressable key={date.toISOString()} disabled={date < startOfToday()} onPress={() => setPickupDate(date)} style={[styles.calendarDay, pickupDate?.toDateString() === date.toDateString() && { backgroundColor: colors.primary }, date < startOfToday() && { opacity: 0.35 }]}><Text style={{ color: pickupDate?.toDateString() === date.toDateString() ? colors.textLight : colors.text, fontSize: 12 }}>{date.getDate()}</Text></Pressable> : <View key={`empty-${index}`} style={styles.calendarDay} />)}
            </View>
            <Text style={styles.selectedValue}>{pickupDate ? formatPickupDate(pickupDate) : "Choose a date"}</Text>

            <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm }]}>Pickup Time <Text style={{ color: colors.danger }}>*</Text></Text>
            <View style={styles.timePickerRow}>
              {([[
                "hour", "Hour", pickupHour, HOURS,
              ], ["minute", "Min", pickupMinute, MINUTES], ["period", "AM/PM", pickupPeriod, PERIODS]] as const).map(([type, placeholder, value, options]) => (
                <View key={type} style={styles.pickerColumn}>
                  <Pressable style={[styles.dropdownField, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => setOpenPicker(openPicker === type ? null : type)}><Text style={{ color: value ? colors.text : colors.textMuted, fontSize: 12, fontWeight: "700" }}>{value || placeholder}</Text><Text style={{ color: colors.textMuted }}>⌄</Text></Pressable>
                  {openPicker === type && <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>{options.map((option) => <Pressable key={option} style={styles.dropdownOption} onPress={() => { if (type === "hour") setPickupHour(option); else if (type === "minute") setPickupMinute(option); else setPickupPeriod(option as typeof PERIODS[number]); setOpenPicker(null); }}><Text style={{ color: colors.text, fontSize: 12 }}>{option}</Text></Pressable>)}</View>}
                </View>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.text, marginBottom: spacing.sm }]}>Campus Desk</Text>
            <View style={[styles.choiceRow, { gap: spacing.sm, marginBottom: spacing.xl }]}>
              {["Main Library", "Engineering", "Science Library"].map((c) => (
                <Pressable
                  key={c}
                  style={[
                    styles.choiceChip,
                    { backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius.md },
                    pickupCampus === c && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setPickupCampus(c)}
                >
                  <Text style={[styles.choiceText, { color: colors.textMuted }, pickupCampus === c && { color: colors.primary, fontWeight: "700" }]}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <Button
              title={reserving ? "Confirming..." : "Confirm Reservation"}
              loading={reserving}
              onPress={async () => {
                if (!userId || !token) {
                  Alert.alert("Sign in required", "Please sign in to reserve this book.");
                  return;
                }
                if (!pickupDate || !pickupHour || !pickupMinute || !pickupPeriod) {
                  Alert.alert("Pickup details required", "Choose a Pickup Date, hour, minutes, and AM/PM.");
                  return;
                }
                const bookId = Number(id);
                if (!Number.isFinite(bookId)) {
                  Alert.alert("Invalid book", "Could not reserve this title.");
                  return;
                }
                setReserving(true);
                try {
                  const reservation = await reservationsService.create(
                    userId,
                    bookId,
                    `Pickup at ${pickupCampus} · ${formatPickupDate(pickupDate)} · ${pickupHour}:${pickupMinute} ${pickupPeriod}`
                  );
                  const hour12 = Number(pickupHour);
                  const minute = Number(pickupMinute);
                  const startHour = pickupPeriod === "PM" ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12);
                  const start = new Date(pickupDate);
                  start.setHours(startHour, minute, 0, 0);
                  const end = new Date(start);
                  end.setHours(end.getHours() + 2);
                  const pickup = await reservationsService.schedulePickup({
                    userId,
                    reservationId: reservation.id,
                    slotStart: toLocalIso(start, start.getHours(), start.getMinutes()),
                    slotEnd: toLocalIso(end, end.getHours(), end.getMinutes()),
                  });
                  setReservedPass({
                    date: formatPickupDate(pickupDate),
                    time: `${pickupHour}:${pickupMinute} ${pickupPeriod}`,
                    campus: pickupCampus,
                    qr: pickup.qrCode,
                  });
                  setReserveVisible(false);
                  Alert.alert(
                    "Reservation confirmed",
                    pickup.qrCode
                      ? `Pickup scheduled. Show QR ${pickup.qrCode.slice(0, 8)}… at the desk.`
                      : "Pickup scheduled. Check Pick-Up Scheduler for your slot."
                  );
                } catch (e: any) {
                  Alert.alert("Reservation failed", e?.message || "Please try another slot.");
                } finally {
                  setReserving(false);
                }
              }}
              style={{ paddingVertical: spacing.md, borderRadius: borderRadius.xl, marginBottom: spacing.lg }}
            />
          </View>
        </View>
      </Modal>

      {/* 2. ADD TO READING LIST BOTTOM SHEET */}
      <Modal
        visible={listVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setListVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setListVisible(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Add to Reading List</Text>
              <Pressable onPress={() => setListVisible(false)}>
                <Text style={{ color: colors.textMuted, fontWeight: "700", fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>

            {/* Checklist */}
            <View style={{ marginVertical: spacing.lg }}>
              {/* Semester List */}
              <Pressable
                style={[styles.checklistRow, { paddingVertical: spacing.md, borderColor: colors.border }]}
                onPress={() => setFolders((prev) => ({ ...prev, semester: !prev.semester }))}
              >
                <View style={styles.checkLeft}>
                  <Text style={{ fontSize: 24, marginRight: spacing.md }}>📚</Text>
                  <View>
                    <Text style={[styles.checkTitle, { color: colors.text }]}>Semester Reading List</Text>
                    <Text style={[styles.checkDesc, { color: colors.textMuted, marginTop: 2 }]}>17 books currently</Text>
                  </View>
                </View>
                {getCheckbox(folders.semester)}
              </Pressable>

              {/* Research References */}
              <Pressable
                style={[styles.checklistRow, { paddingVertical: spacing.md, borderColor: colors.border }]}
                onPress={() => setFolders((prev) => ({ ...prev, research: !prev.research }))}
              >
                <View style={styles.checkLeft}>
                  <Text style={{ fontSize: 24, marginRight: spacing.md }}>🎓</Text>
                  <View>
                    <Text style={[styles.checkTitle, { color: colors.text }]}>Research References</Text>
                    <Text style={[styles.checkDesc, { color: colors.textMuted, marginTop: 2 }]}>7 books currently</Text>
                  </View>
                </View>
                {getCheckbox(folders.research)}
              </Pressable>

              {/* Exam Prep Guides */}
              <Pressable
                style={[styles.checklistRow, styles.lastChecklistRow, { paddingVertical: spacing.md }]}
                onPress={() => setFolders((prev) => ({ ...prev, exam: !prev.exam }))}
              >
                <View style={styles.checkLeft}>
                  <Text style={{ fontSize: 24, marginRight: spacing.md }}>📝</Text>
                  <View>
                    <Text style={[styles.checkTitle, { color: colors.text }]}>Exam Prep Core Guides</Text>
                    <Text style={[styles.checkDesc, { color: colors.textMuted, marginTop: 2 }]}>5 books currently</Text>
                  </View>
                </View>
                {getCheckbox(folders.exam)}
              </Pressable>
            </View>

            <Button
              title="Done"
              onPress={() => setListVisible(false)}
              style={{ paddingVertical: spacing.md, borderRadius: borderRadius.xl, marginBottom: spacing.lg }}
            />
          </View>
        </View>
      </Modal>
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
  coverSection: {
    alignItems: "center",
  },
  coverPlaceholder: {
    width: 140,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
  },
  coverEmoji: {
    fontSize: 70,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
  },
  metaSection: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  author: {
    fontSize: 16,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  descText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionSection: {
    flexDirection: "column",
  },
  // Ticket Pass styles
  ticketCard: {
    alignItems: "center",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  ticketBadge: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563eb",
  },
  ticketCode: {
    fontSize: 14,
    fontWeight: "800",
  },
  ticketDivider: {
    width: "100%",
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },
  ticketDetails: {
    width: "100%",
  },
  ticketLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  ticketValue: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  ticketDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barcodeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  barcodeLines: {
    flexDirection: "row",
    height: 44,
    alignItems: "stretch",
  },
  barcodeBar: {
    backgroundColor: "#000",
  },
  barcodeNumber: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Bottom Sheet Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(6, 9, 19, 0.4)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
  },
  bottomSheet: {
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  choiceChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  choiceText: {
    fontSize: 13,
  },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDay: { width: "14.28%", height: 30, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  selectedValue: { color: "#7C5CFC", fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 6 },
  timePickerRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  pickerColumn: { flex: 1, position: "relative" },
  dropdownField: { minHeight: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dropdownMenu: { position: "absolute", zIndex: 20, top: 48, left: 0, right: 0, borderWidth: 1, borderRadius: 10, overflow: "hidden", elevation: 5 },
  dropdownOption: { minHeight: 30, alignItems: "center", justifyContent: "center" },
  // Reading List checklist styles
  checklistRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  lastChecklistRow: {
    borderBottomWidth: 0,
  },
  checkLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  checkDesc: {
    fontSize: 12,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
