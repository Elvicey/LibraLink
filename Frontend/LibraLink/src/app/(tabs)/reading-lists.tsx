import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BookGridCard from "../../components/BookGridCard";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { Book } from "../../services/books";
import { bookmarksService } from "../../services/bookmarks";

const SCREEN_PADDING = 16;
const GRID_GAP = 12;
const CARD_WIDTH =
  (Dimensions.get("window").width - SCREEN_PADDING * 2 - GRID_GAP) / 2;

export default function ReadingLists() {
  const router = useRouter();
  const { userId, token } = useAuth();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, isDark);

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || !token) {
      setBooks([]);
      setError("Sign in to see your reading list.");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      setBooks(await bookmarksService.list(userId));
    } catch (e: any) {
      setError(e?.message || "Could not load your reading list.");
      setBooks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, token]);

  // Re-fetches on focus too, so a book bookmarked on the detail screen appears
  // as soon as the user comes back here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const header = (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Reading list</Text>
      </View>

      <Text style={styles.subtitle}>
        {books.length > 0
          ? `${books.length} ${books.length === 1 ? "book" : "books"} saved`
          : "Books you bookmark are kept here"}
      </Text>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  return (
    <ScreenWrapper style={styles.screen}>
      <FlatList
        data={loading ? [] : books}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => <BookGridCard book={item} width={CARD_WIDTH} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.huge }} />
          ) : error ? null : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bookmark-outline" size={30} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptyBody}>
                Tap the bookmark at the top of any book to keep it here for later.
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push("/search" as any)}>
                <Text style={styles.emptyButtonText}>Browse catalogue</Text>
              </Pressable>
            </View>
          )
        }
      />
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
    },
    listContent: {
      paddingHorizontal: SCREEN_PADDING,
      // Clears the floating tab bar
      paddingBottom: 110,
      flexGrow: 1,
    },
    column: {
      gap: GRID_GAP,
      marginBottom: GRID_GAP,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.sm,
      paddingTop: spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: spacing.lg,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      marginBottom: spacing.md,
    },
    emptyState: {
      alignItems: "center",
      paddingTop: spacing.huge,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    emptyBody: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 19,
      paddingHorizontal: spacing.xl,
    },
    emptyButton: {
      marginTop: spacing.lg,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.round,
    },
    emptyButtonText: {
      color: colors.textLight,
      fontWeight: "700",
      fontSize: 14,
    },
  });
