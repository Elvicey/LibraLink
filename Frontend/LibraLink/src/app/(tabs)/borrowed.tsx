import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

function getLoanStatusStyle(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "OVERDUE" || s === "LATE") {
    return { color: "#dc2626", fontWeight: "700" as const };
  }
  if (s === "RETURNED") {
    return { color: "#15803d", fontWeight: "700" as const };
  }
  return { color: "#0b6efd", fontWeight: "700" as const };
}

function LoanCard({ loan }: any) {
  const book = loan.book || {};
  const dueDate = loan.dueDate || "";
  const status = (loan.status || "BORROWED").toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{book.title || "Untitled"}</Text>
        <Text style={getLoanStatusStyle(status)}>{status}</Text>
      </View>
      <Text style={styles.cardAuthor}>{book.isbn || ""}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardNote}>
          {dueDate ? `Due ${dueDate}` : "No due date"}
        </Text>
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
  const { userId } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE_URL}/api/borrow-records/user/${userId}`)
      .then((r) => r.json())
      .then((data) => setRecords(data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Borrowed Books</Text>
      <Text style={styles.subtitle}>
        Active loans, overdue alerts, and pick-up status
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0b6efd" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <LoanCard loan={item} />}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
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
