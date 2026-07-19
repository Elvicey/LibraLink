import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";

const TRANSACTIONS = [
  { id: "101", user: "Esther A.", book: "Calculus Intro", status: "Overdue", date: "2h ago", isDanger: true },
  { id: "102", user: "Kwame B.", book: "African Econ.", status: "Returned", date: "4h ago", isSuccess: true },
  { id: "103", user: "Abena O.", book: "Data Structures", status: "Borrowed", date: "1d ago", isPrimary: true },
  { id: "104", user: "Yaw D.", book: "Things Fall Apart", status: "Ready", date: "1d ago", isInfo: true },
];

export default function Admin() {
  const router = useRouter();
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();

  const CHART_DATA = [
    { day: "Mon", count: 120, height: 60, color: colors.primary },
    { day: "Tue", count: 180, height: 90, color: colors.primary },
    { day: "Wed", count: 240, height: 120, color: colors.success },
    { day: "Thu", count: 150, height: 75, color: colors.primary },
    { day: "Fri", count: 210, height: 105, color: colors.primary },
    { day: "Sat", count: 90, height: 45, color: colors.warning },
  ];

  const getTxnColor = (txn: any) => {
    if (txn.isDanger) return colors.danger;
    if (txn.isSuccess) return colors.success;
    if (txn.isPrimary) return colors.primary;
    return colors.info;
  };

  const getTxnBg = (txn: any) => {
    if (txn.isDanger) return colors.dangerLight;
    if (txn.isSuccess) return colors.successLight;
    if (txn.isPrimary) return colors.primaryLight;
    return colors.infoLight;
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      {/* Back navigation header */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Admin Dashboard
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Library circulation logs, inventory updates, and KNUST campus metrics.
      </Text>

      {/* Course readings management shortcut */}
      <Pressable
        style={[styles.manageLinkCard, isDark ? styles.cardDark : null, { marginBottom: spacing.lg }]}
        onPress={() => router.push("/course?mode=librarian" as any)}
      >
        <View style={styles.manageLinkRow}>
          <View style={[styles.manageIconCircle, { backgroundColor: isDark ? "rgba(11, 110, 253, 0.16)" : colors.primaryLight }]}>
            <Ionicons name="book-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.manageTextStack}>
            <Text style={[styles.manageTitle, { color: colors.text }]}>Manage Course Textbooks</Text>
            <Text style={[styles.manageSubtitle, { color: colors.textMuted }]}>Assign core textbooks per course list</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </View>
      </Pressable>

      {/* Analytics Summary */}
      <View style={[styles.metricsRow, { gap: spacing.md, marginBottom: spacing.lg }]}>
        <Card style={[styles.metricCard, isDark ? styles.cardDark : null, { padding: spacing.md }]}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Loans</Text>
            <Ionicons name="bar-chart-outline" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>1,248</Text>
          <Text style={[styles.metricChange, { color: colors.success, marginTop: spacing.xs }]}>+12% vs last week</Text>
        </Card>
        <Card style={[styles.metricCard, isDark ? styles.cardDark : null, { padding: spacing.md }]}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Overdue</Text>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          </View>
          <Text style={[styles.metricValue, { color: colors.danger }]}>24</Text>
          <Text style={[styles.metricChange, { color: colors.textMuted, marginTop: spacing.xs }]}>Requires alerts</Text>
        </Card>
      </View>

      {/* Weekly Circulation Traffic chart */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Weekly Circulation Traffic</Text>
      <Card style={[styles.cardBg, isDark ? styles.cardDark : null, { padding: spacing.lg, marginBottom: spacing.lg }]}>
        <View style={[styles.chartColumns, { paddingTop: spacing.lg }]}>
          {CHART_DATA.map((item) => (
            <View key={item.day} style={styles.chartCol}>
              <Text style={[styles.chartCount, { color: colors.textMuted }]}>{item.count}</Text>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: item.height,
                    backgroundColor: item.color,
                    borderRadius: borderRadius.sm,
                    opacity: isDark ? 0.85 : 1,
                  },
                ]}
              />
              <Text style={[styles.chartLabel, { color: colors.textMuted, marginTop: spacing.sm }]}>{item.day}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Transaction Log */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Recent Transactions</Text>
      <Card style={[styles.cardBg, isDark ? styles.cardDark : null, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.xxl }]}>
        {TRANSACTIONS.map((txn, idx) => {
          const txnColor = getTxnColor(txn);
          const txnBg = getTxnBg(txn);
          return (
            <View
              key={txn.id}
              style={[
                styles.txnRow,
                { paddingVertical: spacing.md, borderColor: colors.border },
                idx === TRANSACTIONS.length - 1 && styles.lastTxnRow,
              ]}
            >
              <View style={[styles.txnLeft, { gap: spacing.md }]}>
                {/* Circular styled initials badge */}
                <View style={[styles.avatarMini, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : colors.background }]}>
                  <Text style={[styles.avatarText, { color: colors.text }]}>{txn.user[0]}</Text>
                </View>
                <View>
                  <Text style={[styles.txnUser, { color: colors.text }]}>{txn.user} ({txn.id})</Text>
                  <Text style={[styles.txnBook, { color: colors.textMuted, marginTop: spacing.xs }]}>{txn.book}</Text>
                </View>
              </View>
              
              <View style={styles.txnRight}>
                {/* Visual Status Tag badge */}
                <View style={[styles.statusPill, { backgroundColor: txnBg, marginBottom: spacing.xs }]}>
                  <Text style={[styles.statusText, { color: txnColor }]}>{txn.status.toUpperCase()}</Text>
                </View>
                <Text style={[styles.txnDate, { color: colors.textMuted }]}>{txn.date}</Text>
              </View>
            </View>
          );
        })}
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
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
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricCard: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  metricChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Chart styles
  chartColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
  },
  chartCol: {
    alignItems: "center",
    flex: 1,
  },
  chartCount: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  chartBar: {
    width: 24,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  // Transaction logs
  txnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  lastTxnRow: {
    borderBottomWidth: 0,
  },
  txnLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "800",
    fontSize: 14,
  },
  txnUser: {
    fontSize: 14,
    fontWeight: "700",
  },
  txnBook: {
    fontSize: 13,
  },
  txnRight: {
    alignItems: "flex-end",
  },
  txnDate: {
    fontSize: 12,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cardBg: {
    padding: 16,
  },
  cardDark: {
    backgroundColor: "rgba(24, 28, 51, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
  },
  manageLinkCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  manageLinkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  manageIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  manageTextStack: {
    flex: 1,
  },
  manageTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  manageSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
