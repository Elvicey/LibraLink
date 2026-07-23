import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { booksService, Book } from "../services/books";
import {
  PickupSlotResponse,
  ReservationResponse,
  reservationsService,
  slotWindowFromLabel,
} from "../services/reservations";

const DATES = ["Today", "Tomorrow", "In 2 days"];
const TIMES = ["9 AM - 11 AM", "12 PM - 2 PM", "3 PM - 5 PM"];
const DESKS = ["Main Library", "Engineering", "Science Library"];

export default function BookPickup() {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const { userId, token, roles } = useAuth();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, isDark);
  const isStaff = roles.includes("LIBRARIAN") || roles.includes("ADMIN");

  const [slots, setSlots] = useState<PickupSlotResponse[]>([]);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling state — only relevant when arriving with a bookId.
  const [pendingBook, setPendingBook] = useState<Book | null>(null);
  const [date, setDate] = useState(DATES[1]);
  const [time, setTime] = useState(TIMES[0]);
  const [desk, setDesk] = useState(DESKS[0]);
  const [confirming, setConfirming] = useState(false);

  // Set once the incoming book has been scheduled, so the card collapses. Clearing
  // the route param itself is unreliable, so track it locally.
  const [scheduled, setScheduled] = useState(false);

  const numericBookId = Number(bookId);
  const hasPending = Number.isFinite(numericBookId) && !!bookId && !scheduled;

  const load = useCallback(async () => {
    if (!userId || !token) {
      setSlots([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [slotList, reservationList] = await Promise.all([
        reservationsService.getPickupsForUser(userId),
        reservationsService.getForUser(userId).catch(() => [] as ReservationResponse[]),
      ]);
      setSlots(slotList);
      setReservations(reservationList);
    } catch (e: any) {
      Alert.alert("Could not load pickups", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!hasPending) {
      setPendingBook(null);
      return;
    }
    booksService
      .getById(numericBookId)
      .then(setPendingBook)
      .catch(() => setPendingBook(null));
  }, [hasPending, numericBookId]);

  /** reservationId -> book title, so a slot can name its book. */
  const titleByReservation = useMemo(() => {
    const map = new Map<number, string>();
    reservations.forEach((r) => {
      if (r.book?.title) map.set(r.id, r.book.title);
    });
    return map;
  }, [reservations]);

  const confirm = async () => {
    if (!userId || !token) {
      Alert.alert("Sign in required", "Please sign in to reserve this book.");
      return;
    }
    if (!Number.isFinite(numericBookId)) {
      Alert.alert("Invalid book", "Could not reserve this title.");
      return;
    }
    setConfirming(true);
    try {
      const reservation = await reservationsService.create(
        userId,
        numericBookId,
        `Pickup at ${desk} · ${date} · ${time}`
      );
      const window = slotWindowFromLabel(time);
      const pickup = await reservationsService.schedulePickup({
        userId,
        reservationId: reservation.id,
        slotStart: window.slotStart,
        slotEnd: window.slotEnd,
      });

      // Collapse the scheduling card, then show the newly created slot.
      setScheduled(true);
      setPendingBook(null);
      await load();

      Alert.alert(
        "Pickup scheduled",
        pickup.qrCode
          ? `Show QR ${pickup.qrCode.slice(0, 8)}… at the ${desk} desk.`
          : `Collect from the ${desk} desk during your slot.`
      );
    } catch (e: any) {
      Alert.alert("Reservation failed", e?.message || "Please try another slot.");
    } finally {
      setConfirming(false);
    }
  };

  const chipRow = (
    options: string[],
    selected: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.chipRow}>
      {options.map((option) => (
        <Pressable
          key={option}
          style={[styles.chip, selected === option && styles.chipActive]}
          onPress={() => onSelect(option)}
        >
          <Text style={[styles.chipText, selected === option && styles.chipTextActive]}>
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ScreenWrapper style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Pick-Up Scheduler</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Scheduling card — shown when arriving from a book */}
        {hasPending && (
          <View style={styles.scheduleCard}>
            <Text style={styles.scheduleEyebrow}>SCHEDULE THIS PICKUP</Text>
            <Text style={styles.scheduleTitle} numberOfLines={2}>
              {pendingBook?.title || "Loading title…"}
            </Text>

            <Text style={styles.fieldLabel}>Pickup date</Text>
            {chipRow(DATES, date, setDate)}

            <Text style={styles.fieldLabel}>Time slot</Text>
            {chipRow(TIMES, time, setTime)}

            <Text style={styles.fieldLabel}>Campus desk</Text>
            {chipRow(DESKS, desk, setDesk)}

            <Pressable
              style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
              onPress={confirm}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color={colors.textLight} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm reservation</Text>
              )}
            </Pressable>
          </View>
        )}

        <Text style={styles.description}>
          Your reservation pickup slots. Collect at the desk with your QR code.
        </Text>

        {isStaff && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={19} color={colors.primary} />
            <Text style={styles.infoText}>
              Use Scan Barcode in the Admin console to collect scheduled pickups via QR.
            </Text>
          </View>
        )}

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />}

        {!loading && slots.length === 0 && !hasPending && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bag-handle-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No pickup slots yet</Text>
            <Text style={styles.emptyBody}>
              Open a book, tap Read Book, and choose "Reserve a physical copy".
            </Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push("/search" as any)}>
              <Text style={styles.emptyButtonText}>Browse catalogue</Text>
            </Pressable>
          </View>
        )}

        {!loading &&
          slots.map((slot) => (
            <View key={slot.id} style={styles.slotCard}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotTitle} numberOfLines={1}>
                  {titleByReservation.get(slot.reservationId) || `Reservation #${slot.reservationId}`}
                </Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{slot.status || "SCHEDULED"}</Text>
                </View>
              </View>

              <View style={styles.slotRow}>
                <Ionicons name="time-outline" size={15} color={colors.textMuted} />
                <Text style={styles.slotMeta}>
                  {slot.slotStart || slot.scheduledAt || "—"} → {slot.slotEnd || "—"}
                </Text>
              </View>

              {!!slot.qrCode && (
                <View style={styles.qrRow}>
                  <Ionicons name="qr-code-outline" size={15} color={colors.primary} />
                  <Text style={styles.qrText} numberOfLines={1}>
                    {slot.qrCode}
                  </Text>
                </View>
              )}
            </View>
          ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: -spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.huge,
    },
    description: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textMuted,
      marginBottom: spacing.lg,
    },
    scheduleCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
    scheduleEyebrow: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    scheduleTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.lg,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.round,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : colors.border,
      backgroundColor: colors.background,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
    },
    chipTextActive: {
      color: colors.textLight,
      fontWeight: "700",
    },
    confirmButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md + 2,
      borderRadius: borderRadius.round,
      alignItems: "center",
      marginTop: spacing.xs,
    },
    confirmButtonDisabled: {
      opacity: 0.7,
    },
    confirmButtonText: {
      color: colors.textLight,
      fontWeight: "800",
      fontSize: 15,
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : colors.border,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
    },
    slotCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : colors.border,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    slotHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    slotTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    statusPill: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.round,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.primary,
    },
    slotRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    slotMeta: {
      flex: 1,
      fontSize: 12,
      color: colors.textMuted,
    },
    qrRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: spacing.sm,
    },
    qrText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    emptyState: {
      alignItems: "center",
      paddingTop: spacing.xl,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    emptyBody: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 19,
      paddingHorizontal: spacing.lg,
    },
    emptyButton: {
      marginTop: spacing.lg,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.round,
    },
    emptyButtonText: {
      color: colors.textLight,
      fontWeight: "700",
      fontSize: 14,
    },
  });
