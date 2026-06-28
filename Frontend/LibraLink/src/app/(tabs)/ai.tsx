import { useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const SUGGESTIONS = [
  "Recommend books for a project",
  "Find study guides for economics",
  "Summarize my reading list",
  "Suggest career development reads",
];

const RECOMMENDATIONS = [
  {
    id: "1",
    title: "Mindset",
    author: "Carol S. Dweck",
    note: "Recommended for growth and motivation",
  },
  {
    id: "2",
    title: "Lean Startup",
    author: "Eric Ries",
    note: "AI suggests this for entrepreneurship learners",
  },
  {
    id: "3",
    title: "Algorithms Unlocked",
    author: "Thomas H. Cormen",
    note: "Great for coding and exam prep",
  },
];

export default function AI() {
  const [prompt, setPrompt] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ask Libra</Text>
      <Text style={styles.subtitle}>
        Use natural language queries to discover books, summaries, and study
        help.
      </Text>

      <TextInput
        placeholder="Ask Libralink something..."
        value={prompt}
        onChangeText={setPrompt}
        style={styles.input}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Try one of these prompts</Text>
        <View style={styles.promptRow}>
          {SUGGESTIONS.map((item) => (
            <Pressable key={item} style={styles.promptChip}>
              <Text style={styles.promptText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI reading recommendations</Text>
        <FlatList
          data={RECOMMENDATIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.recommendationCard}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardAuthor}>{item.author}</Text>
              <Text style={styles.cardNote}>{item.note}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          style={styles.list}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f9fc" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: {
    color: "#6b7280",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  input: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    backgroundColor: "white",
    marginBottom: 24,
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  promptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  promptChip: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  promptText: { color: "#111827", fontSize: 14 },
  list: { width: "100%" },
  recommendationCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  cardAuthor: { color: "#4b5563", marginBottom: 8 },
  cardNote: { color: "#6b7280", lineHeight: 20 },
});
