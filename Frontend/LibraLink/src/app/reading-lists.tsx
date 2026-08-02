import { API_BASE_URL } from "../config/api";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const CURRENT_COURSE_ID = 1;

export default function ReadingLists() {
  const router = useRouter();
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/reading-lists/course/${CURRENT_COURSE_ID}`)
      .then((r) => r.json())
      .then((data) => setLists(data))
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Reading lists</Text>
      <Text style={styles.description}>
        Your saved book collections for study, research, and reading goals.
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0b6efd" style={{ marginTop: 24 }} />
      ) : (
        lists.map((list) => (
          <View key={String(list.id)} style={styles.card}>
            <Text style={styles.cardTitle}>{list.title}</Text>
            <Text style={styles.cardValue}>{list.description || ""}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f7f9fc" },
  backButton: { marginBottom: 16 },
  backText: { color: "#0b6efd", fontWeight: "700" },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  description: { color: "#4b5563", marginBottom: 20, lineHeight: 22 },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  cardValue: { color: "#4b5563", lineHeight: 20 },
});
