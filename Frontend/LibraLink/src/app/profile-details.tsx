import { API_BASE_URL } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export default function ProfileDetails() {
  const router = useRouter();
  const { userId } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE_URL}/api/users/${userId}`)
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "User";
  const email = user?.email || "";
  const campus = user?.institution?.name || "N/A";

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Profile details</Text>
      <Text style={styles.description}>
        Manage your contact information, preferred campus, and account details.
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0b6efd" style={{ marginTop: 24 }} />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Name</Text>
            <Text style={styles.cardValue}>{fullName}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Email</Text>
            <Text style={styles.cardValue}>{email}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Campus</Text>
            <Text style={styles.cardValue}>{campus}</Text>
          </View>
        </>
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
  cardTitle: {
    color: "#6b7280",
    marginBottom: 6,
    fontSize: 13,
    textTransform: "uppercase",
  },
  cardValue: { fontSize: 16, fontWeight: "700" },
});
