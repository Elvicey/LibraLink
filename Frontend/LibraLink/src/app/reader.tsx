import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { booksService } from "../services/books";

export default function Reader() {
  const router = useRouter();
  const { bookId, title } = useLocalSearchParams<{ bookId?: string; title?: string }>();
  const { colors, spacing } = useTheme();

  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(bookId);
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    booksService
      .getContent(id)
      .then((r) => setContent(r.content ?? ""))
      .catch(() => setContent(""))
      .finally(() => setLoading(false));
  }, [bookId]);

  const styles = createStyles(colors, spacing);

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || "Read"}
        </Text>
        <View style={styles.back} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : content && content.trim() ? (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.text}>{content}</Text>
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Ionicons name="book-outline" size={30} color={colors.textMuted} />
          <Text style={styles.empty}>No text has been added for this book yet.</Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.text },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.sm },
    empty: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
    body: { padding: spacing.lg, paddingBottom: spacing.huge ?? 40 },
    text: { color: colors.text, fontSize: 17, lineHeight: 28 },
  });
