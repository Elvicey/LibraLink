import { API_BASE_URL } from "../../config/api";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/books`)
      .then((r) => r.json())
      .then((data) => setBooks(data))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  const recommended = books.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.title}>Good morning</Text>
          <Text style={styles.subtitle}>Your library journey starts here.</Text>
        </View>
        <Text style={styles.heroBadge}>Student</Text>
      </View>

      <Pressable
        style={styles.searchCard}
        onPress={() => router.push("/search" as any)}
      >
        <Text style={styles.searchLabel}>Search the catalogue</Text>
        <Text style={styles.searchText}>
          Tap to find books, journals, or notes
        </Text>
      </Pressable>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>-</Text>
          <Text style={styles.statLabel}>Borrowed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>-</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>-</Text>
          <Text style={styles.statLabel}>Holds</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
      </View>

      <View style={styles.quickActions}>
        <Pressable
          style={[styles.quickButton, styles.quickPrimary]}
          onPress={() => router.push("/search" as any)}
        >
          <Text style={styles.quickTitle}>Scan to borrow</Text>
          <Text style={styles.quickSubtitle}>Self-service checkout</Text>
        </Pressable>
        <Pressable
          style={[styles.quickButton, styles.quickSecondary]}
          onPress={() => router.push("/ai" as any)}
        >
          <Text style={styles.quickTitle}>Ask Libra</Text>
          <Text style={styles.quickSubtitle}>Get learning suggestions</Text>
        </Pressable>
      </View>

      <View style={styles.recommendedSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#0b6efd" />
        ) : (
          recommended.map((item) => (
            <Pressable
              key={String(item.id)}
              style={styles.recommendationCard}
              onPress={() => router.push(`/book/${item.id}` as any)}
            >
              <View style={styles.recommendationRow}>
                <Text style={styles.recommendationTag}>Available</Text>
                <Text style={styles.recommendationAction}>View</Text>
              </View>
              <Text style={styles.recommendationTitle}>{item.title}</Text>
              <Text style={styles.recommendationAuthor}>
                {item.isbn || ""}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f7f9fc" },
  heroCard: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: "#6b7280", fontSize: 15, lineHeight: 22 },
  heroBadge: {
    color: "#1d4ed8",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    fontWeight: "700",
  },
  searchCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  searchLabel: { color: "#0b6efd", fontWeight: "700", marginBottom: 6 },
  searchText: { color: "#4b5563", fontSize: 16 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 18,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { color: "#6b7280", marginTop: 6, textAlign: "center" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  sectionLink: { color: "#0b6efd", fontWeight: "700", fontSize: 14 },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 4,
  },
  quickPrimary: { backgroundColor: "#eff6ff" },
  quickSecondary: { backgroundColor: "#eef2ff" },
  quickTitle: { fontWeight: "700", marginBottom: 6, color: "#111827" },
  quickSubtitle: { color: "#4b5563" },
  recommendedSection: { marginTop: 20 },
  recommendationCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  recommendationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  recommendationTag: {
    color: "#0b6efd",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
  },
  recommendationAction: {
    color: "#0b6efd",
    fontWeight: "700",
  },
  recommendationTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  recommendationAuthor: { color: "#6b7280" },
});
