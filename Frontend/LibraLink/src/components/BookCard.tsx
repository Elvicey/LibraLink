import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function BookCard({ book }: { book: any }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.meta}>{book.isbn || ""}</Text>
      </View>
      <Link href={`/book/${book.id}` as any} style={styles.link}>
        <Text style={styles.linkText}>Open</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "600" },
  meta: { color: "#666" },
  link: { padding: 8, backgroundColor: "#f1f5f9", borderRadius: 6 },
  linkText: { color: "#0b6efd" },
});
