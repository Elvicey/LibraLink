import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/common/Button";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";

const BORROWED = [
  {
    id: "2",
    title: "Introduction to Calculus",
    author: "J. Stewart",
    due: "Due 30 Jun 2026",
    status: "active",
    progress: "3 days left",
  },
  {
    id: "4",
    title: "African Economic Dev.",
    author: "Aryeetey & Fosu",
    due: "Overdue",
    status: "overdue",
    fine: "GHS 1.00",
  },
  {
    id: "5",
    title: "Data Structures in Practice",
    author: "Mark Allen Weiss",
    due: "Pick-up 2:00 PM today",
    status: "ready",
  },
];

function getLoanStatusColor(status: string, colors: any) {
  return status === "overdue"
    ? colors.danger
    : status === "ready"
      ? colors.success
      : colors.primary;
}

function getLoanStatusBg(status: string, colors: any) {
  return status === "overdue"
    ? colors.dangerLight
    : status === "ready"
      ? colors.successLight
      : colors.primaryLight;
}

function LoanCard({ loan, colors, spacing, borderRadius, onRenew, onReturn }: any) {
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
      {/* Header Row: Title & Badge Pill */}
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

      {/* Visual Status Content Block */}
      <View style={styles.infoBlockContainer}>
        {loan.status === "active" && (
          <View style={styles.progressSection}>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              {/* Mocking 11/14 days elapsed (approx 78%) */}
              <View style={[styles.progressBarFill, { width: "78.5%", backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.dueDetails}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.dueText, { color: colors.textMuted }]}>
                {loan.progress} (Due 30 Jun)
              </Text>
            </View>
          </View>
        )}

        {loan.status === "overdue" && (
          <View style={[styles.alertBlock, { backgroundColor: colors.dangerLight, borderColor: "rgba(220, 38, 38, 0.12)" }]}>
            <View style={styles.alertHeader}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
              <Text style={[styles.alertText, { color: colors.danger }]}>
                Overdue · Immediate Action Required
              </Text>
            </View>
            <View style={styles.fineRow}>
              <Text style={[styles.fineLabel, { color: colors.textMuted }]}>Accumulated Fine:</Text>
              <Text style={[styles.fineValue, { color: colors.danger }]}>{loan.fine}</Text>
            </View>
          </View>
        )}

        {loan.status === "ready" && (
          <View style={[styles.readyBlock, { backgroundColor: colors.successLight, borderColor: "rgba(21, 128, 61, 0.12)" }]}>
            <View style={styles.readyHeader}>
              <Ionicons name="sparkles" size={16} color={colors.success} style={{ marginRight: 6 }} />
              <Text style={[styles.readyText, { color: colors.success }]}>
                Ready for Pickup at Campus Desk
              </Text>
            </View>
            <View style={styles.pickupTimeRow}>
              <Ionicons name="alarm-outline" size={14} color={colors.success} style={{ marginRight: 4 }} />
              <Text style={[styles.pickupText, { color: colors.text }]}>
                {loan.due} (Desk C)
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons Row */}
      <View style={styles.cardActions}>
        <Button
          title="Renew"
          onPress={() => onRenew(loan)}
          size="sm"
          variant={loan.status === "overdue" ? "outline" : "primary"}
          icon={<Ionicons name="refresh-outline" size={15} color={loan.status === "overdue" ? colors.primary : colors.textLight} />}
          style={{ flex: 1, marginRight: spacing.sm, borderRadius: borderRadius.lg }}
        />
        <Button
          title="Return"
          onPress={() => onReturn(loan)}
          size="sm"
          variant="outline"
          icon={<Ionicons name="qr-code-outline" size={15} color={colors.primary} />}
          style={{ flex: 1, borderColor: colors.borderDark, borderRadius: borderRadius.lg }}
          textStyle={{ color: colors.text, fontWeight: "700" }}
        />
      </View>
    </View>
  );
}

export default function Borrowed() {
  const { colors, spacing, borderRadius } = useTheme();

  // Selected book context states
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [returnVisible, setReturnVisible] = useState(false);
  const [renewVisible, setRenewVisible] = useState(false);
  const [renewStatus, setRenewStatus] = useState<"loading" | "success">("loading");

  const handleRenewClick = (book: any) => {
    setSelectedBook(book);
    setRenewVisible(true);
    setRenewStatus("loading");
    
    setTimeout(() => {
      setRenewStatus("success");
    }, 1800);
  };

  const handleReturnClick = (book: any) => {
    setSelectedBook(book);
    setReturnVisible(true);
  };

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: spacing.xs }}>
          My Borrowed Books
        </Text>
        <Text style={{ color: colors.textMuted, marginBottom: spacing.lg, fontSize: 15 }}>
          Active loans, overdue alerts, and pick-up status
        </Text>
        
        <FlatList
          data={BORROWED}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
              onRenew={handleRenewClick}
              onReturn={handleReturnClick}
            />
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
                <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: spacing.md }} />
                <Text style={[styles.statusTitle, { color: colors.text }]}>Renewing Book...</Text>
                <Text style={[styles.statusDesc, { color: colors.textMuted, marginTop: spacing.xs }]}>
                  Calculating new due date parameters.
                </Text>
              </View>
            ) : (
              <View style={styles.statusBox}>
                <View style={[styles.successIconCircle, { backgroundColor: colors.successLight, marginBottom: spacing.md }]}>
                  <Text style={[styles.successCheckmarkText, { color: colors.success }]}>✓</Text>
                </View>
                <Text style={[styles.statusTitle, { color: colors.text }]}>Renewal Confirmed</Text>
                <Text style={[styles.statusDesc, { color: colors.textMuted, marginVertical: spacing.md }]}>
                  New due date: <Text style={{ fontWeight: "700", color: colors.text }}>15 Jul 2026</Text>
                </Text>
                <Button
                  title="Done"
                  onPress={() => setRenewVisible(false)}
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
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Contactless Return Pass</Text>
              <Pressable onPress={() => setReturnVisible(false)}>
                <Text style={{ color: colors.textMuted, fontWeight: "700", fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>
            
            {selectedBook && (
              <View style={{ marginVertical: spacing.lg }}>
                <Text style={[styles.returnBookTitle, { color: colors.text }]}>{selectedBook.title}</Text>
                <Text style={[styles.returnBookAuthor, { color: colors.textMuted }]}>by {selectedBook.author}</Text>
                
                <View style={[styles.infoBanner, { backgroundColor: colors.infoLight, borderRadius: borderRadius.md, padding: spacing.md, marginVertical: spacing.md }]}>
                  <Text style={[styles.infoText, { color: colors.info }]}>
                    ℹ Scan this return pass at the library barcode reader near any box drop slot to complete transaction.
                  </Text>
                </View>

                {/* Mock Barcode Block */}
                <View style={[styles.barcodeContainer, { marginTop: spacing.md }]}>
                  <View style={styles.barcodeLines}>
                    {[1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3, 4, 2, 1, 3, 2].map((val, idx) => (
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
                    *RET-{selectedBook.id || "00"}-PASS*
                  </Text>
                </View>
              </View>
            )}

            <Button
              title="Done"
              onPress={() => setReturnVisible(false)}
              style={{ width: "100%", borderRadius: borderRadius.xl, paddingVertical: spacing.md, marginBottom: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
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
