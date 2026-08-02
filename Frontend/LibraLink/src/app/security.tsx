import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Security() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Security</Text>
      <Text style={styles.description}>
        Update your password, manage sign-in options, and keep your library
        account secure.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Password</Text>
        <Text style={styles.cardValue}>Last changed 12 days ago</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Two-factor authentication</Text>
        <Text style={styles.cardValue}>Recommended for secure access</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trusted devices</Text>
        <Text style={styles.cardValue}>3 devices connected</Text>
      </View>
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
