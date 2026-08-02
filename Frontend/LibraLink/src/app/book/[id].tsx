import { API_BASE_URL } from "../../config/api";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function BookDetail() {
  const params = useLocalSearchParams();
  const { id } = params as { id: string };
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE_URL}/api/books/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setBook(data))
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0b6efd" />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Book not found</Text>
      </View>
    );
  }

  const available = (book.availableCopies || 0) > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{book.title}</Text>
      {book.subtitle ? <Text style={styles.field}>{book.subtitle}</Text> : null}
      <Text style={styles.field}>ISBN: {book.isbn || "N/A"}</Text>
      <Text style={styles.field}>Language: {book.language || "N/A"}</Text>
      <Text style={styles.field}>
        Availability: {available ? `${book.availableCopies} copies` : "Unavailable"}
      </Text>
      {book.description ? (
        <Text style={styles.field}>{book.description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  field: { fontSize: 16, marginBottom: 8 },
});
