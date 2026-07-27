import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/common/Button";
import {
  AUTH_LIBRARY_OVERLAY,
  AuthLibraryBackground,
  LIGHT_LIBRARY_OVERLAY,
} from "../components/auth/AuthLibraryBackground";
import { loginColors } from "../constants/loginTheme";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { bookAuthorName } from "../services/books";
import { borrowsService, BorrowRecord } from "../services/borrows";
import { Fine, fineAmount, finesService } from "../services/fines";

const ACCENT = loginColors.teal;
const ACCENT_DARK = loginColors.tealDark;

type LoanView = {
  id: string;
  title: string;
  author: string;
  due: string;
  status: string;
  progress?: string;
  fine?: string;
};

function mapBorrow(record: BorrowRecord): LoanView {
  const statusRaw = (record.status || "BORROWED").toUpperCase();
  let status = "active";
  if (statusRaw === "OVERDUE") status = "overdue";
  if (statusRaw === "RETURNED") status = "returned";
  return {
    id: String(record.id),
    title: record.book?.title || "Unknown book",
    author: record.book ? bookAuthorName(record.book) : "Unknown author",
    due: record.dueDate || "—",
    status,
    progress: record.dueDate ? `Due ${record.dueDate}` : undefined,
  };
}

function getLoanStatusColor(status: string, colors: any) {
  if (status === "overdue") return colors.danger;
  if (status === "ready" || status === "returned") return colors.success;
  return ACCENT;
}

function getLoanStatusBg(status: string, colors: any) {
  if (status === "overdue") return colors.dangerLight;
  if (status === "ready" || status === "returned") return colors.successLight;
  return "rgba(93, 202, 165, 0.16)";
}

function LoanCard({ loan, colors, spacing, borderRadius, onRenew, onReturn, showActions = true }: any) {
  const statusColor = getLoanStatusColor(loan.status, colors);
  const statusBg = getLoanStatusBg(loan.status, colors);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text, marginRight: spacing.sm }]}>
          {loan.title}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {loan.status === "ready" ? "READY FOR PICKUP" : loan.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.cardAuthor, { color: colors.textMuted, marginBottom: spacing.md }]}>
        by {loan.author}
      </Text>

      <View style={styles.infoBlockContainer}>
        {loan.status === "active" && (
          <View style={styles.progressSection}>
            <View style={styles.dueDetails}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.dueText, { color: colors.textMuted }]}>
                {loan.progress || `Due ${loan.due}`}
              </Text>
            </View>
          </View>
        )}

        {loan.status === "overdue" && (
          <View style={[styles.alertBlock, { backgroundColor: colors.dangerLight, borderColor: "rgba(220, 38, 38, 0.12)" }]}>
            <View style={styles.alertHeader}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
              <Text style={[styles.alertText, { color: colors.danger }]}>
                Overdue · Due {loan.due}
              </Text>
            </View>
          </View>
        )}

        {loan.status === "returned" && (
          <View style={styles.dueDetails}>
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} style={{ marginRight: 4 }} />
            <Text style={[styles.dueText, { color: colors.textMuted }]}>
              Returned · was due {loan.due}
            </Text>
          </View>
        )}
      </View>

      {showActions && (
      <View style={styles.cardActions}>
        <Button
          title="Renew"
          onPress={() => onRenew(loan)}
          size="sm"
          variant={loan.status === "overdue" ? "outline" : "primary"}
          accentColor={ACCENT}
          icon={<Ionicons name="refresh-outline" size={15} color={loan.status === "overdue" ? ACCENT : ACCENT_DARK} />}
          style={{ flex: 1, marginRight: spacing.sm, borderRadius: borderRadius.lg }}
          textStyle={loan.status === "overdue" ? undefined : { color: ACCENT_DARK }}
        />
        <Button
          title="Return"
          onPress={() => onReturn(loan)}
          size="sm"
          variant="outline"
          accentColor={ACCENT}
          icon={<Ionicons name="qr-code-outline" size={15} color={ACCENT} />}
          style={{ flex: 1, borderColor: colors.borderDark, borderRadius: borderRadius.lg }}
          textStyle={{ color: colors.text, fontWeight: "700" }}
        />
      </View>
      )}
    </View>
  );
}

export default function Borrowed() {
  const router = useRouter();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const { userId, token } = useAuth();
  const [tab, setTab] = useState<"active" | "history" | "fines">("active");
  const [activeLoans, setActiveLoans] = useState<LoanView[]>([]);
  const [historyLoans, setHistoryLoans] = useState<LoanView[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [returnVisible, setReturnVisible] = useState(false);
  const [returnStatus, setReturnStatus] = useState<"idle" | "loading" | "success">("idle");
  const [returnError, setReturnError] = useState<string | null>(null);
  const [renewVisible, setRenewVisible] = useState(false);
  const [renewStatus, setRenewStatus] = useState<"loading" | "success" | "error">("loading");
  const [renewError, setRenewError] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || !token) {
      setActiveLoans([]);
      setHistoryLoans([]);
      setFines([]);
      setError("Sign in to see your borrowed books and history.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [current, history, userFines] = await Promise.all([
        borrowsService.getCurrent(userId),
        borrowsService.getHistory(userId),
        finesService.getForUser(userId).catch(() => [] as Fine[]),
      ]);
      setActiveLoans(current.map(mapBorrow));
      setHistoryLoans(history.map(mapBorrow));
      setFines(userFines);
    } catch (e: any) {
      setError(e?.message || "Could not load borrowed books.");
      setActiveLoans([]);
      setHistoryLoans([]);
      setFines([]);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRenewClick = async (book: any) => {
    setSelectedBook(book);
    setRenewVisible(true);
    setRenewStatus("loading");
    setRenewError(null);
    setNewDueDate(null);
    try {
      const updated = await borrowsService.renew(Number(book.id));
      setNewDueDate(updated.dueDate || null);
      setRenewStatus("success");
      load();
    } catch (e: any) {
      setRenewError(e?.message || "Could not renew this loan.");
      setRenewStatus("error");
    }
  };

  const handleReturnClick = (book: any) => {
    setSelectedBook(book);
    setReturnStatus("idle");
    setReturnError(null);
    setReturnVisible(true);
  };

  const doReturn = async () => {
    if (!selectedBook) return;
    setReturnStatus("loading");
    setReturnError(null);
    try {
      await borrowsService.return(Number(selectedBook.id));
      setReturnStatus("success");
      load();
    } catch (e: any) {
      setReturnError(e?.message || "Could not return this book.");
      setReturnStatus("idle");
    }
  };

  const loans = tab === "active" ? activeLoans : historyLoans;
  const unpaidFines = fines.filter((f) => (f.status || "").toUpperCase() !== "PAID");
  const unpaidTotal = unpaidFines.reduce((sum, f) => sum + fineAmount(f), 0);

  const segments: { key: typeof tab; label: string }[] = [
    { key: "active", label: `Active (${activeLoans.length})` },
    { key: "history", label: `History (${historyLoans.length})` },
    { key: "fines", label: `Fines (${unpaidFines.length})` },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AuthLibraryBackground
        overlayColor={isDark ? AUTH_LIBRARY_OVERLAY : LIGHT_LIBRARY_OVERLAY}
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
      <View style={[styles.container, { padding: spacing.lg }]}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", marginLeft: -spacing.sm, marginBottom: spacing.sm }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: spacing.xs }}>
          My Borrowed Books
        </Text>
        <Text style={{ color: colors.textMuted, marginBottom: spacing.md, fontSize: 15 }}>
          Active loans and full borrowing history
        </Text>

        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
          {segments.map((segment) => (
            <Pressable
              key={segment.key}
              onPress={() => setTab(segment.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: borderRadius.lg,
                backgroundColor: tab === segment.key ? ACCENT : colors.surface,
                borderWidth: 1,
                borderColor: tab === segment.key ? ACCENT : colors.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 13,
                  color: tab === segment.key ? ACCENT_DARK : colors.text,
                }}
              >
                {segment.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading && <ActivityIndicator color={ACCENT} style={{ marginTop: spacing.xl }} />}
        {!!error && !loading && (
          <Text style={{ color: colors.danger, marginBottom: spacing.md }}>{error}</Text>
        )}
        
        {tab === "fines" ? (
          <>
            <FlatList
              data={fines}
              keyExtractor={(item) => `fine-${item.id}`}
              renderItem={({ item }) => {
                const paid = (item.status || "").toUpperCase() === "PAID";
                return (
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.surface,
                        borderRadius: borderRadius.xl,
                        padding: spacing.lg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, { color: colors.text, marginRight: spacing.sm }]}>
                        GHS {fineAmount(item).toFixed(2)}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: paid ? colors.successLight : colors.dangerLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: paid ? colors.success : colors.danger },
                          ]}
                        >
                          {paid ? "PAID" : "UNPAID"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.cardAuthor, { color: colors.textMuted }]}>
                      {item.reason || "Late return"}
                    </Text>
                    {!!item.dueDate && (
                      <View style={[styles.dueDetails, { marginTop: spacing.sm }]}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={colors.textMuted}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.dueText, { color: colors.textMuted }]}>
                          Due {item.dueDate}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                !loading ? (
                  <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: spacing.xl }}>
                    No fines. Nice work.
                  </Text>
                ) : null
              }
            />
            {unpaidTotal > 0 && (
              <Button
                title={`Pay GHS ${unpaidTotal.toFixed(2)}`}
                onPress={() => router.push("/pay-fines" as any)}
                accentColor={ACCENT}
                icon={<Ionicons name="card-outline" size={16} color={ACCENT_DARK} />}
                style={{ borderRadius: borderRadius.lg, marginTop: spacing.sm }}
                textStyle={{ color: ACCENT_DARK }}
              />
            )}
          </>
        ) : (
          <FlatList
            data={loans}
            keyExtractor={(item) => `${tab}-${item.id}`}
            renderItem={({ item }) => (
              <LoanCard
                loan={item}
                colors={colors}
                spacing={spacing}
                borderRadius={borderRadius}
                onRenew={handleRenewClick}
                onReturn={handleReturnClick}
                showActions={tab === "active" && item.status !== "returned"}
              />
            )}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !loading ? (
                <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: spacing.xl }}>
                  {tab === "active"
                    ? "No active loans right now."
                    : "No borrowing history yet. When you borrow books, they will appear here."}
                </Text>
              ) : null
            }
          />
        )}
      </View>

      {/* 1. STATEFUL RENEW MODAL */}
      <Modal
        visible={renewVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRenewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setRenewVisible(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg }]}>
            {renewStatus === "loading" ? (
              <View style={styles.statusBox}>
                <ActivityIndicator size="large" color={ACCENT} style={{ marginBottom: spacing.md }} />
                <Text style={[styles.statusTitle, { color: colors.text }]}>Renewing Book...</Text>
                <Text style={[styles.statusDesc, { color: colors.textMuted, marginTop: spacing.xs }]}>
                  Calculating new due date parameters.
                </Text>
              </View>
            ) : renewStatus === "error" ? (
              <View style={styles.statusBox}>
                <Text style={[styles.statusTitle, { color: colors.danger }]}>Renewal not possible</Text>
                <Text style={[styles.statusDesc, { color: colors.textMuted, marginVertical: spacing.md }]}>
                  {renewError}
                </Text>
                <Button
                  title="Close"
                  onPress={() => setRenewVisible(false)}
                  accentColor={ACCENT}
                  textStyle={{ color: ACCENT_DARK }}
                  style={{ width: "100%", borderRadius: borderRadius.xl, paddingVertical: spacing.md }}
                />
              </View>
            ) : (
              <View style={styles.statusBox}>
                <View style={[styles.successIconCircle, { backgroundColor: colors.successLight, marginBottom: spacing.md }]}>
                  <Text style={[styles.successCheckmarkText, { color: colors.success }]}>✓</Text>
                </View>
                <Text style={[styles.statusTitle, { color: colors.text }]}>Renewal Confirmed</Text>
                <Text style={[styles.statusDesc, { color: colors.textMuted, marginVertical: spacing.md }]}>
                  New due date: <Text style={{ fontWeight: "700", color: colors.text }}>{newDueDate || "updated"}</Text>
                </Text>
                <Button
                  title="Done"
                  onPress={() => setRenewVisible(false)}
                  accentColor={ACCENT}
                  textStyle={{ color: ACCENT_DARK }}
                  style={{ width: "100%", borderRadius: borderRadius.xl, paddingVertical: spacing.md }}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. RETURN DROP-BOX BARCODE PASS SHEET */}
      <Modal
        visible={returnVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReturnVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setReturnVisible(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {returnStatus === "success" ? "Book Returned" : "Return Book"}
              </Text>
              <Pressable onPress={() => setReturnVisible(false)}>
                <Text style={{ color: colors.textMuted, fontWeight: "700", fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>

            {returnStatus === "success" ? (
              <View style={[styles.statusBox, { marginVertical: spacing.lg }]}>
                <View style={[styles.successIconCircle, { backgroundColor: colors.successLight, marginBottom: spacing.md }]}>
                  <Text style={[styles.successCheckmarkText, { color: colors.success }]}>✓</Text>
                </View>
                <Text style={[styles.statusTitle, { color: colors.text }]}>Returned successfully</Text>
                <Text style={[styles.statusDesc, { color: colors.textMuted, marginVertical: spacing.sm, textAlign: "center" }]}>
                  “{selectedBook?.title}” has been returned. Any overdue fine now shows under Fines.
                </Text>
                <Button
                  title="Done"
                  onPress={() => setReturnVisible(false)}
                  accentColor={ACCENT}
                  textStyle={{ color: ACCENT_DARK }}
                  style={{ width: "100%", borderRadius: borderRadius.xl, paddingVertical: spacing.md, marginTop: spacing.sm }}
                />
              </View>
            ) : (
              <>
                {selectedBook && (
                  <View style={{ marginVertical: spacing.lg }}>
                    <Text style={[styles.returnBookTitle, { color: colors.text }]}>{selectedBook.title}</Text>
                    <Text style={[styles.returnBookAuthor, { color: colors.textMuted }]}>by {selectedBook.author}</Text>

                    <View style={[styles.infoBanner, { backgroundColor: colors.infoLight, borderRadius: borderRadius.md, padding: spacing.md, marginVertical: spacing.md }]}>
                      <Text style={[styles.infoText, { color: colors.info }]}>
                        ℹ Confirm to return this book now. If it is past due, an overdue fine will be added automatically.
                      </Text>
                    </View>

                    {!!returnError && (
                      <Text style={{ color: colors.danger, marginBottom: spacing.sm }}>{returnError}</Text>
                    )}
                  </View>
                )}

                <Button
                  title={returnStatus === "loading" ? "Returning..." : "Confirm return"}
                  onPress={doReturn}
                  disabled={returnStatus === "loading"}
                  accentColor={ACCENT}
                  textStyle={{ color: ACCENT_DARK }}
                  style={{ width: "100%", borderRadius: borderRadius.xl, paddingVertical: spacing.md, marginBottom: spacing.md }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    // Clear the floating tab bar
    paddingBottom: 110,
  },
  card: {
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  cardAuthor: {
    fontSize: 14,
  },
  infoBlockContainer: {
    marginBottom: 16,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  // Active progress style
  progressSection: {
    marginVertical: 4,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  dueDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Overdue block style
  alertBlock: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  alertText: {
    fontSize: 13,
    fontWeight: "700",
  },
  fineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fineLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  fineValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  // Ready block style
  readyBlock: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
  },
  readyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  readyText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pickupTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickupText: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  // Modal styles
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
    fontSize: 18,
    fontWeight: "800",
  },
  statusBox: {
    alignItems: "center",
    paddingVertical: 24,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  statusDesc: {
    fontSize: 15,
    textAlign: "center",
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  successCheckmarkText: {
    fontSize: 32,
    fontWeight: "800",
  },
  // Return pass styles
  returnBookTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  returnBookAuthor: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 4,
  },
  infoBanner: {
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.15)",
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
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
});
