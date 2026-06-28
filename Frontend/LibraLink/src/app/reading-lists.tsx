import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const LISTS = [
  {
    id: "1",
    label: "Semester reading list",
    detail: "17 titles for current courses",
  },
  {
    id: "2",
    label: "Research references",
    detail: "7 books saved for project work",
  },
  { id: "3", label: "Exam prep", detail: "5 essential guides" },
];

export default function ReadingLists() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Reading lists</Text>
      <Text style={styles.description}>
        Your saved book collections for study, research, and reading goals.
      </Text>
      {LISTS.map((list) => (
        <View key={list.id} style={styles.card}>
          <Text style={styles.cardTitle}>{list.label}</Text>
          <Text style={styles.cardValue}>{list.detail}</Text>
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
