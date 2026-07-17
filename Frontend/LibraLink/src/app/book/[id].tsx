import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";

const ALL_BOOKS: Record<string, { title: string; author: string; tag: string; available: boolean; pages: number; desc: string }> = {
  "1": {
    title: "Things Fall Apart",
    author: "Chinua Achebe",
    tag: "Classic",
    available: true,
    pages: 209,
    desc: "A classic novel written by Nigerian author Chinua Achebe. It is seen as the archetypal modern African novel in English, and one of the first to receive global critical acclaim.",
  },
  "2": {
    title: "Introduction to Calculus",
    author: "J. Stewart",
    tag: "Exam prep",
    available: false,
    pages: 450,
    desc: "Provides a clear and concise introduction to the concepts and methods of calculus. Ideal for KNUST engineering and science undergraduates preparing for semester exams.",
  },
  "3": {
    title: "African Economics",
    author: "A. Smith",
    tag: "Policy",
    available: true,
    pages: 312,
    desc: "An in-depth look at emerging economies in Sub-Saharan Africa, examining fiscal policies, trade relationships, and sustainable growth paradigms.",
  },
  "4": {
    title: "African Economic Dev.",
    author: "Aryeetey & Fosu",
    tag: "Policy",
    available: false,
    pages: 288,
    desc: "Analyzes the strategic policy choices and development opportunities for modern African nations. Widely referenced in economics coursework across West Africa.",
  },
  "5": {
    title: "Data Structures in Practice",
    author: "Mark Allen Weiss",
    tag: "Computing",
    available: true,
    pages: 580,
    desc: "A comprehensive guide to understanding and implementing core data structures and algorithms in programming, focusing on efficiency and real-world implementation.",
  },
};

export default function BookDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params as { id: string };
  const { colors, spacing, borderRadius, typography } = useTheme();

  // Bottom sheets modals toggle visibility states
  const [reserveVisible, setReserveVisible] = useState(false);
  const [listVisible, setListVisible] = useState(false);

  // States for pickup choices
  const [pickupDate, setPickupDate] = useState("Tomorrow");
  const [pickupTime, setPickupTime] = useState("10:00 AM - 12:00 PM");
  const [pickupCampus, setPickupCampus] = useState("KNUST Main Library");
  const [reservedPass, setReservedPass] = useState<{ date: string; time: string; campus: string } | null>(null);

  // States for folders selections
  const [folders, setFolders] = useState({
    semester: false,
    research: false,
    exam: false,
  });

  const book = ALL_BOOKS[id] || {
    title: `Sample Book #${id}`,
    author: "Unknown Author",
    tag: "General",
    available: true,
    pages: 300,
    desc: "No book description is available for this title. Please contact the KNUST library administrator for cataloging updates.",
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
          <Text style={[styles.statLabel, { color: colors.textMuted, marginBottom: spacing.xs }]}>Pages</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{book.pages}</Text>
        </Card>
      </View>

      <View style={{ marginBottom: spacing.xl }}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>Summary</Text>
        <Text style={[styles.descText, { color: colors.textMuted }]}>{book.desc}</Text>
      </View>

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

            <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm }]}>Pickup Date</Text>
            <View style={[styles.choiceRow, { gap: spacing.sm, marginBottom: spacing.md }]}>
              {["Today", "Tomorrow", "In 2 days"].map((d) => (
                <Pressable
                  key={d}
                  style={[
                    styles.choiceChip,
                    { backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius.md },
                    pickupDate === d && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setPickupDate(d)}
                >
                  <Text style={[styles.choiceText, { color: colors.textMuted }, pickupDate === d && { color: colors.primary, fontWeight: "700" }]}>{d}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.text, marginBottom: spacing.sm }]}>Time Slot</Text>
            <View style={[styles.choiceRow, { gap: spacing.sm, marginBottom: spacing.md }]}>
              {["9 AM - 11 AM", "12 PM - 2 PM", "3 PM - 5 PM"].map((t) => (
                <Pressable
                  key={t}
                  style={[
                    styles.choiceChip,
                    { backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius.md },
                    pickupTime === t && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setPickupTime(t)}
                >
                  <Text style={[styles.choiceText, { color: colors.textMuted }, pickupTime === t && { color: colors.primary, fontWeight: "700" }]}>{t}</Text>
                </Pressable>
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
              title="Confirm Reservation"
              onPress={() => {
                setReservedPass({ date: pickupDate, time: pickupTime, campus: pickupCampus });
                setReserveVisible(false);
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
