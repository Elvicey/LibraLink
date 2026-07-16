import { API_BASE_URL } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export default function Notifications() {
  const router = useRouter();
  const { userId } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE_URL}/api/notifications/user/${userId}`)
      .then((r) => r.json())
      .then((data) => setAlerts(data))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.description}>
        Recent alerts, reminders, and library updates for your account.
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0b6efd" style={{ marginTop: 24 }} />
      ) : (
        alerts.map((alert) => (
          <View key={String(alert.id)} style={styles.card}>
            <Text style={styles.cardTitle}>{alert.title}</Text>
            <Text style={styles.cardValue}>{alert.message}</Text>
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
