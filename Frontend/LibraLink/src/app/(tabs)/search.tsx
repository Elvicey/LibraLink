import { API_BASE_URL } from "../../config/api";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import BookCard from "../../components/BookCard";

export default function Search() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/books`)
      .then((r) => r.json())
      .then((data) => setBooks(data))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      books.filter((b) =>
        `${b.title} ${b.description || ""} ${b.isbn || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, books],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Catalogue</Text>
        <Text style={styles.subtitle}>
          Find books, resources, and exam materials instantly
        </Text>
      </View>

      <TextInput
        placeholder="Search by title, author or subject"
        style={styles.input}
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.quickRow}>
        <View style={styles.quickTile}>
          <Text style={styles.quickTitle}>Scan to borrow</Text>
          <Text style={styles.quickText}>Use QR or ISBN</Text>
        </View>
        <View style={styles.quickTile}>
          <Text style={styles.quickTitle}>AI search</Text>
          <Text style={styles.quickText}>Ask in plain English</Text>
        </View>
      </View>

      <Text style={styles.resultsTitle}>Search results</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0b6efd" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <BookCard book={item} />}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f9fc" },
  header: { marginBottom: 18 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: "#6b7280", fontSize: 15, lineHeight: 22 },
  input: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    backgroundColor: "white",
    marginBottom: 18,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  quickTile: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 4,
  },
  quickTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  quickText: { color: "#6b7280" },
  resultsTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  list: { width: "100%" },
});
