import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

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

function getLoanStatusStyle(status: string) {
  return {
    color:
      status === "overdue"
        ? "#dc2626"
        : status === "ready"
          ? "#15803d"
          : "#0b6efd",
    fontWeight: "700" as const,
  };
}

function LoanCard({ loan }: any) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{loan.title}</Text>
        <Text style={getLoanStatusStyle(loan.status)}>{loan.status}</Text>
      </View>
      <Text style={styles.cardAuthor}>{loan.author}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardNote}>{loan.progress || loan.due}</Text>
        {loan.fine ? <Text style={styles.cardFine}>{loan.fine}</Text> : null}
      </View>
      <View style={styles.cardActions}>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionText}>Renew</Text>
        </Pressable>
        <Pressable style={styles.actionButtonSecondary}>
          <Text style={styles.actionTextSecondary}>Return</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Borrowed() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Borrowed Books</Text>
      <Text style={styles.subtitle}>
        Active loans, overdue alerts, and pick-up status
      </Text>
      <FlatList
        data={BORROWED}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LoanCard loan={item} />}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f9fc" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#6b7280", marginBottom: 16 },
  list: { width: "100%" },
  card: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 24,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  cardAuthor: { color: "#4b5563", marginBottom: 12 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardNote: { color: "#6b7280" },
  cardFine: { color: "#dc2626", fontWeight: "700" },
  cardActions: { flexDirection: "row", justifyContent: "space-between" },
  actionButton: {
    flex: 1,
    backgroundColor: "#0b6efd",
    borderRadius: 16,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: "center",
  },
  actionText: { color: "white", fontWeight: "700" },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionTextSecondary: { color: "#1f2937", fontWeight: "700" },
});
