import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  const { colors, spacing, borderRadius, typography } = useTheme();

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

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Admin Dashboard
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Library circulation logs, inventory updates, and campus metrics.
      </Text>

      {/* Analytics Summary */}
      <View style={[styles.metricsRow, { gap: spacing.md, marginBottom: spacing.lg }]}>
        <Card style={[styles.metricCard, { padding: spacing.md }]}>
          <Text style={[styles.metricLabel, { color: colors.textMuted, marginBottom: spacing.xs }]}>Total Loans</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>1,248</Text>
          <Text style={[styles.metricChange, { color: colors.success, marginTop: spacing.xs }]}>+12% vs last week</Text>
        </Card>
        <Card style={[styles.metricCard, { padding: spacing.md }]}>
          <Text style={[styles.metricLabel, { color: colors.textMuted, marginBottom: spacing.xs }]}>Overdue</Text>
          <Text style={[styles.metricValue, { color: colors.danger }]}>24</Text>
          <Text style={[styles.metricChange, { color: colors.success, marginTop: spacing.xs }]}>Requires alerts</Text>
        </Card>
      </View>

      {/* Stylized Flexbox Column Chart */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginVertical: spacing.md }]}>Weekly Circulation Traffic</Text>
      <Card style={{ padding: spacing.lg, marginBottom: spacing.sm }}>
        <View style={[styles.chartColumns, { paddingTop: spacing.lg }]}>
          {CHART_DATA.map((item) => (
            <View key={item.day} style={styles.chartCol}>
              <Text style={[styles.chartCount, { color: colors.textMuted }]}>{item.count}</Text>
              <View
                style={[
                  styles.chartBar,
                  { height: item.height, backgroundColor: item.color, borderRadius: borderRadius.sm },
                ]}
              />
              <Text style={[styles.chartLabel, { color: colors.textMuted, marginTop: spacing.sm }]}>{item.day}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Transaction Log */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginVertical: spacing.md }]}>Recent Transactions</Text>
      <Card style={{ padding: spacing.md, marginBottom: spacing.xxl }}>
        {TRANSACTIONS.map((txn, idx) => {
          const txnColor = getTxnColor(txn);
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
                <View style={[styles.avatarMini, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{txn.user[0]}</Text>
                </View>
                <View>
                  <Text style={[styles.txnUser, { color: colors.text }]}>{txn.user} ({txn.id})</Text>
                  <Text style={[styles.txnBook, { color: colors.textMuted, marginTop: spacing.xs }]}>{txn.book}</Text>
                </View>
              </View>
              <View style={styles.txnRight}>
                <View style={[styles.statusBadge, { backgroundColor: txnColor + "12", borderRadius: borderRadius.sm }]}>
                  <Text style={[styles.statusText, { color: txnColor }]}>
                    {txn.status}
                  </Text>
                </View>
                <Text style={[styles.txnDate, { color: colors.textMuted, marginTop: spacing.xs }]}>{txn.date}</Text>
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
  metricsRow: {
    flexDirection: "row",
  },
  metricCard: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  metricChange: {
    fontSize: 11,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
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
    width: 20,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
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
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "700",
    fontSize: 14,
  },
  txnUser: {
    fontSize: 14,
    fontWeight: "700",
  },
  txnBook: {
    fontSize: 12,
  },
  txnRight: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  txnDate: {
    fontSize: 11,
  },
});
