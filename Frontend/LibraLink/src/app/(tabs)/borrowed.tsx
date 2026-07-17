import { FlatList, StyleSheet, Text, View } from "react-native";
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

function LoanCard({ loan, colors, spacing, borderRadius }: any) {
  const statusColor = getLoanStatusColor(loan.status, colors);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text, marginRight: spacing.sm }]}>{loan.title}</Text>
        <Text style={{ color: statusColor, fontWeight: "700", textTransform: "uppercase", fontSize: 12 }}>
          {loan.status}
        </Text>
      </View>
      <Text style={[styles.cardAuthor, { color: colors.textMuted, marginBottom: spacing.md }]}>{loan.author}</Text>
      <View style={[styles.cardFooter, { marginBottom: spacing.md }]}>
        <Text style={[styles.cardNote, { color: colors.textMuted }]}>{loan.progress || loan.due}</Text>
        {loan.fine ? <Text style={{ color: colors.danger, fontWeight: "700", fontSize: 14 }}>{loan.fine}</Text> : null}
      </View>
      <View style={styles.cardActions}>
        <Button
          title="Renew"
          onPress={() => {}}
          size="sm"
          style={{ flex: 1, marginRight: spacing.sm, borderRadius: borderRadius.md }}
        />
        <Button
          title="Return"
          onPress={() => {}}
          size="sm"
          variant="secondary"
          style={{ flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.md }}
          textStyle={{ color: colors.text, fontWeight: "700" }}
        />
      </View>
    </View>
  );
}

export default function Borrowed() {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: spacing.xs }}>
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
            />
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  cardAuthor: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardNote: {
    fontSize: 14,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
