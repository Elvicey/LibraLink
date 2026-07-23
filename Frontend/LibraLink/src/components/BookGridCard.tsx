import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../constants/theme";
import { Book, isBookAvailable } from "../services/books";

interface BookGridCardProps {
  book: Book;
  /** Card width. The caller owns the grid maths, so it decides. */
  width: number;
  /** Overrides the default push to /book/[id]. */
  onPress?: () => void;
}

/**
 * The cover-forward card used by the Home "Discover books" grid and by
 * Search results, so both stay visually identical.
 */
export default function BookGridCard({ book, width, onPress }: BookGridCardProps) {
  const router = useRouter();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, isDark);

  const available = isBookAvailable(book);
  const copies = book.availableCopies ?? 0;

  return (
    <Pressable
      style={[styles.card, { width }]}
      onPress={onPress ?? (() => router.push(`/book/${book.id}` as any))}
    >
      <View style={styles.coverWrapper}>
        {book.coverImageUrl ? (
          <Image source={{ uri: book.coverImageUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <Ionicons name="book" size={32} color={colors.primary} />
        )}
        {!available && (
          <View style={styles.loanBadge}>
            <Text style={styles.loanBadgeText}>On loan</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {book.title}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.meta} numberOfLines={1}>
          {available ? `${copies} ${copies === 1 ? "copy" : "copies"}` : "On loan"}
        </Text>
        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={14} color={colors.textLight} />
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
    },
    coverWrapper: {
      height: 130,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      marginBottom: spacing.md,
    },
    cover: {
      width: "100%",
      height: "100%",
    },
    loanBadge: {
      position: "absolute",
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: colors.danger,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.round,
    },
    loanBadgeText: {
      color: colors.textLight,
      fontSize: 10,
      fontWeight: "800",
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 18,
      minHeight: 36,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.sm,
    },
    meta: {
      flex: 1,
      fontSize: 12,
      color: colors.textMuted,
      marginRight: spacing.sm,
    },
    arrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
