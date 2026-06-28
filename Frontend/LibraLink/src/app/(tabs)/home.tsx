import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const HIGHLIGHTS = [
  { title: "Next due", value: "Calculus in 3 days", color: "#fde68a" },
  { title: "Suggested", value: "AI for Education", color: "#a7f3d0" },
];

const RECOMMENDED = [
  {
    id: "1",
    title: "Library Science Essentials",
    author: "KNUST Collection",
    tag: "Recommended",
  },
  {
    id: "2",
    title: "Exam Strategies 2026",
    author: "O. Asiedu",
    tag: "Top pick",
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.title}>Good morning, Esther</Text>
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
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>Borrowed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>1</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Holds</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <Text style={styles.sectionLink}>See all</Text>
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

      <Text style={styles.sectionTitle}>Today's highlights</Text>
      <View style={styles.highlightRow}>
        {HIGHLIGHTS.map((item) => (
          <View
            key={item.title}
            style={[styles.highlightCard, { backgroundColor: item.color }]}
          >
            <Text style={styles.highlightTitle}>{item.title}</Text>
            <Text style={styles.highlightValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.resourcesCard}>
        <Text style={styles.resourcesTitle}>Continue reading</Text>
        <Text style={styles.resourcesSubtitle}>Pick up where you left off</Text>
        <View style={styles.resourceInfo}>
          <View>
            <Text style={styles.resourceLabel}>
              Data Structures in Practice
            </Text>
            <Text style={styles.resourceMeta}>37% complete</Text>
          </View>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>37%</Text>
          </View>
        </View>
      </View>

      <View style={styles.recommendedSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <Text style={styles.sectionLink}>Refresh</Text>
        </View>
        {RECOMMENDED.map((item) => (
          <Pressable
            key={item.id}
            style={styles.recommendationCard}
            onPress={() => router.push(`/book/${item.id}` as any)}
          >
            <View style={styles.recommendationRow}>
              <Text style={styles.recommendationTag}>{item.tag}</Text>
              <Text style={styles.recommendationAction}>View</Text>
            </View>
            <Text style={styles.recommendationTitle}>{item.title}</Text>
            <Text style={styles.recommendationAuthor}>{item.author}</Text>
          </Pressable>
        ))}
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
  highlightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 4,
  },
  highlightTitle: { color: "#374151", fontWeight: "700", marginBottom: 6 },
  highlightValue: { color: "#1f2937", fontWeight: "700" },
  resourcesCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  resourcesTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  resourcesSubtitle: { color: "#6b7280", marginBottom: 16 },
  resourceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resourceLabel: { fontWeight: "700", fontSize: 15 },
  resourceMeta: { color: "#6b7280", marginTop: 6 },
  progressPill: {
    backgroundColor: "#e0f2fe",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  progressText: { color: "#0b6efd", fontWeight: "700" },
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
