import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BookGridCard from "../../components/BookGridCard";
import { loginColors } from "../../constants/loginTheme";
import { useTheme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { booksService, Book } from "../../services/books";
import { borrowsService } from "../../services/borrows";
import { fineAmount, finesService } from "../../services/fines";
import { notificationsService } from "../../services/users";

const SCREEN_PADDING = 16;
const SLIDE_WIDTH = Dimensions.get("window").width - SCREEN_PADDING * 2;
/** Two cards per row, accounting for the spacing.md gap between them. */
const CARD_WIDTH = (SLIDE_WIDTH - 12) / 2;

const ACCENT = loginColors.teal;
const ACCENT_DARK = loginColors.tealDark;
const ACCENT_LIGHT = "rgba(93, 202, 165, 0.16)";

type HeroSlide = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  route: string;
};

const HERO_SLIDES: HeroSlide[] = [
  {
    eyebrow: "KNUST LIBRARY",
    title: "Every title,\none search away",
    body: "Browse the full catalogue and reserve what you need before you walk in.",
    cta: "Browse catalogue",
    route: "/search",
  },
  {
    eyebrow: "SELF SERVICE",
    title: "Scan to reserve\nin seconds",
    body: "Look up a book's barcode/ISBN and reserve it for pickup yourself.",
    cta: "Open scanner",
    route: "/scan",
  },
  {
    eyebrow: "ASK LIBRA",
    title: "Stuck on where\nto start?",
    body: "Describe your assignment in plain English and get a reading list back.",
    cta: "Ask Libra",
    route: "/ai",
  },
];

export default function Home() {
  const router = useRouter();
  const { firstName, userId, token } = useAuth();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, isDark);

  const [recommended, setRecommended] = useState<Book[]>([]);
  const [borrowedCount, setBorrowedCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [unpaidFineTotal, setUnpaidFineTotal] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const books = await booksService.list();
      setRecommended(books.slice(0, 8));

      if (userId && token) {
        const [borrows, fines, notifs] = await Promise.all([
          borrowsService.getCurrent(userId).catch(() => []),
          finesService.getForUser(userId).catch(() => []),
          notificationsService.getForUser(userId).catch(() => []),
        ]);
        setBorrowedCount(borrows.length);
        setOverdueCount(borrows.filter((b) => (b.status || "").toUpperCase() === "OVERDUE").length);
        setUnpaidFineTotal(
          fines
            .filter((f) => (f.status || "").toUpperCase() !== "PAID")
            .reduce((sum, f) => sum + fineAmount(f), 0)
        );
        setUnreadNotifs(notifs.filter((n) => !n.isRead).length);
      }
    } catch {
      setRecommended([]);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  // Reload whenever the tab regains focus (also fires on first mount), so returning from
  // Pay Fines / after a borrow reflects the new fine total and counts without a manual refresh.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onHeroScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    if (next !== heroIndex) setHeroIndex(next);
  };

  const initial = (firstName || "S").charAt(0).toUpperCase();
  const gridBooks = recommended.slice(0, 6);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.wordmark}>
              <Ionicons name="library" size={20} color={ACCENT} />
              <Text style={styles.wordmarkText}>LibraLink</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={styles.bellButton}
                onPress={() => router.push("/notifications" as any)}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.text} />
                {unreadNotifs > 0 && <View style={styles.bellBadge} />}
              </Pressable>
              <Pressable
                style={styles.avatar}
                onPress={() => router.push("/profile" as any)}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </Pressable>
            </View>
          </View>

          {/* Search row */}
          <View style={styles.searchRow}>
            <Pressable style={styles.searchBar} onPress={() => router.push("/search" as any)}>
              <Ionicons name="search-outline" size={19} color={colors.textMuted} />
              <Text style={styles.searchPlaceholder}>Search title, author, ISBN</Text>
            </Pressable>
            <Pressable style={styles.scanButton} onPress={() => router.push("/scan" as any)}>
              <Ionicons name="scan-outline" size={21} color={ACCENT_DARK} />
            </Pressable>
          </View>

          {/* Hero carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SLIDE_WIDTH}
            decelerationRate="fast"
            onScroll={onHeroScroll}
            scrollEventThrottle={16}
            style={styles.heroScroll}
          >
            {HERO_SLIDES.map((slide) => (
              <View key={slide.eyebrow} style={styles.heroSlide}>
                <View style={styles.heroCard}>
                  <Text style={styles.heroEyebrow}>{slide.eyebrow}</Text>
                  <Text style={styles.heroTitle}>{slide.title}</Text>
                  <Text style={styles.heroBody}>{slide.body}</Text>
                  <Pressable
                    style={styles.heroCta}
                    onPress={() => router.push(slide.route as any)}
                  >
                    <Text style={styles.heroCtaText}>{slide.cta}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Carousel dots */}
          <View style={styles.dotsRow}>
            {HERO_SLIDES.map((slide, index) => (
              <View
                key={slide.eyebrow}
                style={[styles.dot, index === heroIndex && styles.dotActive]}
              />
            ))}
          </View>

          {/* Fines alert — only when money is owed */}
          {unpaidFineTotal > 0 && (
            <Pressable style={styles.fineStrip} onPress={() => router.push("/pay-fines" as any)}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <View style={styles.fineText}>
                <Text style={styles.fineTitle}>GHS {unpaidFineTotal.toFixed(2)} unpaid</Text>
                <Text style={styles.fineSubtitle}>
                  {overdueCount === 1 ? "1 book overdue" : `${overdueCount} books overdue`}
                </Text>
              </View>
              <View style={styles.finePill}>
                <Text style={styles.finePillText}>Pay</Text>
              </View>
            </Pressable>
          )}

          {/* Compact stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="book-outline" size={19} color={ACCENT} />
              <Text style={styles.statValue}>{borrowedCount}</Text>
              <Text style={styles.statLabel}>Borrowed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={19} color={colors.warning} />
              <Text style={[styles.statValue, overdueCount > 0 && { color: colors.danger }]}>
                {overdueCount}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>

          {/* Discover books */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover books</Text>
            <Pressable onPress={() => router.push("/search" as any)}>
              <Text style={styles.seeMore}>See more</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={ACCENT} style={{ marginVertical: spacing.xl }} />
          ) : gridBooks.length === 0 ? (
            <Text style={styles.emptyText}>No books in the catalogue yet.</Text>
          ) : (
            <View style={styles.grid}>
              {gridBooks.map((book) => (
                <BookGridCard
                  key={book.id}
                  book={book}
                  width={CARD_WIDTH}
                  accentColor={ACCENT}
                  accentSoftColor={ACCENT_LIGHT}
                  accentTextColor={ACCENT_DARK}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: spacing.sm,
      // Clear the floating tab bar
      paddingBottom: 110,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    wordmark: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    wordmarkText: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    bellButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    bellBadge: {
      position: "absolute",
      top: 9,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: ACCENT,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: ACCENT_DARK,
      fontWeight: "800",
      fontSize: 15,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.round,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    searchPlaceholder: {
      color: colors.textMuted,
      fontSize: 15,
    },
    scanButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ACCENT,
      alignItems: "center",
      justifyContent: "center",
    },
    heroScroll: {
      // Same width as a slide so pagingEnabled snaps exactly, with no peek
      borderRadius: borderRadius.huge,
    },
    heroSlide: {
      width: SLIDE_WIDTH,
    },
    heroCard: {
      backgroundColor: ACCENT_DARK,
      borderRadius: borderRadius.huge,
      padding: spacing.xl,
    },
    heroEyebrow: {
      color: colors.textLight,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.2,
      opacity: 0.85,
      marginBottom: spacing.sm,
    },
    heroTitle: {
      color: colors.textLight,
      fontSize: 22,
      fontWeight: "800",
      lineHeight: 28,
      marginBottom: spacing.sm,
    },
    heroBody: {
      color: colors.textLight,
      fontSize: 13,
      lineHeight: 19,
      opacity: 0.9,
      marginBottom: spacing.lg,
    },
    heroCta: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.round,
    },
    heroCtaText: {
      color: ACCENT,
      fontWeight: "700",
      fontSize: 14,
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.borderDark,
    },
    dotActive: {
      width: 18,
      backgroundColor: ACCENT,
    },
    fineStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.dangerLight,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    fineText: {
      flex: 1,
    },
    fineTitle: {
      color: colors.danger,
      fontWeight: "800",
      fontSize: 14,
    },
    fineSubtitle: {
      color: colors.danger,
      fontSize: 12,
      marginTop: 2,
      opacity: 0.85,
    },
    finePill: {
      backgroundColor: colors.danger,
      paddingHorizontal: spacing.lg,
      paddingVertical: 6,
      borderRadius: borderRadius.round,
    },
    finePillText: {
      color: colors.textLight,
      fontWeight: "700",
      fontSize: 13,
    },
    statsRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    statValue: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      marginTop: spacing.xs,
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
    },
    seeMore: {
      color: ACCENT,
      fontSize: 13,
      fontWeight: "700",
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      marginVertical: spacing.lg,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
  });
