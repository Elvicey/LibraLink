import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ALERTS = [
  {
    id: "1",
    title: "Due soon",
    message: "Your Calculus book is due in 3 days.",
  },
  {
    id: "2",
    title: "New resource added",
    message: "AI study guide for economics is available.",
  },
  {
    id: "3",
    title: "Fine reminder",
    message: "You have a pending fine for an overdue loan.",
  },
];

export default function Notifications() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.description}>
        Recent alerts, reminders, and library updates for your account.
      </Text>
      {ALERTS.map((alert) => (
        <View key={alert.id} style={styles.card}>
          <Text style={styles.cardTitle}>{alert.title}</Text>
          <Text style={styles.cardValue}>{alert.message}</Text>
        </View>
      ))}
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
