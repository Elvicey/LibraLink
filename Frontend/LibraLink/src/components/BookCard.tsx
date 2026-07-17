import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../constants/theme";

export default function BookCard({ book }: { book: any }) {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View style={[styles.card, { paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderColor: colors.border }]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{book.title}</Text>
        <Text style={[styles.meta, { color: colors.textMuted, marginTop: spacing.xs }]}>{book.author}</Text>
      </View>
      <Link href={`/book/${book.id}` as any} style={[styles.link, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.sm }]}>
        <Text style={[styles.linkText, { color: colors.primary }]}>Open</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderBottomWidth: 1,
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    fontSize: 14,
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkText: {
    fontWeight: "700",
    fontSize: 14,
  },
});
