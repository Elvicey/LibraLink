import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function PayFines() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Pay fines</Text>
      <Text style={styles.description}>
        Settle overdue fees quickly and keep your account in good standing.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Outstanding balance</Text>
        <Text style={styles.cardValue}>GHS 1.00</Text>
      </View>
      <Pressable style={styles.payButton}>
        <Text style={styles.payButtonText}>Pay now</Text>
      </Pressable>
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
    marginBottom: 24,
  },
  cardTitle: {
    color: "#6b7280",
    marginBottom: 6,
    fontSize: 13,
    textTransform: "uppercase",
  },
  cardValue: { fontSize: 24, fontWeight: "700" },
  payButton: {
    backgroundColor: "#0b6efd",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  payButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
