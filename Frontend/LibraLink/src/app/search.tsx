import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BookGridCard from "../components/BookGridCard";
import {
  AUTH_LIBRARY_OVERLAY,
  AuthLibraryBackground,
  LIGHT_LIBRARY_OVERLAY,
} from "../components/auth/AuthLibraryBackground";
import { loginColors } from "../constants/loginTheme";
import { useTheme } from "../constants/theme";
import {
  bookAuthorName,
  booksService,
  Book,
  inferSubject,
  isBookAvailable,
} from "../services/books";

const SCREEN_PADDING = 16;
const GRID_GAP = 12;
const CARD_WIDTH =
  (Dimensions.get("window").width - SCREEN_PADDING * 2 - GRID_GAP) / 2;

const ACCENT = loginColors.teal;
const ACCENT_DARK = loginColors.tealDark;
const ACCENT_LIGHT = "rgba(93, 202, 165, 0.16)";

const SUBJECT_OPTIONS = ["All", "Science", "Literature", "Computing", "Economics", "General"];
const AVAILABILITY_OPTIONS = ["All", "Available", "On Loan"];

const CATEGORIES = [
  { label: "Science", icon: "flask-outline", subject: "Science" },
  { label: "Literature", icon: "book-outline", subject: "Literature" },
  { label: "Computing", icon: "laptop-outline", subject: "Computing" },
  { label: "Economics", icon: "trending-up-outline", subject: "Economics" },
] as const;

type Dropdown = "subject" | "author" | "availability";

export default function Search() {
  const router = useRouter();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, isDark);

  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedAuthor, setSelectedAuthor] = useState("All");
  const [selectedAvailability, setSelectedAvailability] = useState("All");
  const [activeDropdown, setActiveDropdown] = useState<Dropdown | null>(null);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBooks(await booksService.list());
    } catch (e: any) {
      setError(e?.message || "Could not load books.");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const authorOptions = useMemo(() => {
    const names = Array.from(new Set(books.map(bookAuthorName))).sort();
    return ["All", ...names];
  }, [books]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((book) => {
      const author = bookAuthorName(book);
      const subject = inferSubject(book);
      const available = isBookAvailable(book);

      const matchesQuery =
        !q || `${book.title} ${author} ${subject} ${book.isbn || ""}`.toLowerCase().includes(q);
      const matchesSubject = selectedSubject === "All" || subject === selectedSubject;
      const matchesAuthor = selectedAuthor === "All" || author === selectedAuthor;
      const matchesAvailability =
        selectedAvailability === "All" ||
        (selectedAvailability === "Available" ? available : !available);

      return matchesQuery && matchesSubject && matchesAuthor && matchesAvailability;
    });
  }, [books, query, selectedSubject, selectedAuthor, selectedAvailability]);

  const activeFilterCount =
    (selectedSubject !== "All" ? 1 : 0) +
    (selectedAuthor !== "All" ? 1 : 0) +
    (selectedAvailability !== "All" ? 1 : 0);

  const clearFilters = () => {
    setSelectedSubject("All");
    setSelectedAuthor("All");
    setSelectedAvailability("All");
  };

  const dropdownOptions = () => {
    if (activeDropdown === "subject") return SUBJECT_OPTIONS;
    if (activeDropdown === "author") return authorOptions;
    return AVAILABILITY_OPTIONS;
  };

  const dropdownValue = () => {
    if (activeDropdown === "subject") return selectedSubject;
    if (activeDropdown === "author") return selectedAuthor;
    return selectedAvailability;
  };

  const selectOption = (option: string) => {
    if (activeDropdown === "subject") setSelectedSubject(option);
    else if (activeDropdown === "author") setSelectedAuthor(option);
    else if (activeDropdown === "availability") setSelectedAvailability(option);
    setActiveDropdown(null);
  };

  const truncate = (value: string, max: number) =>
    value.length > max ? `${value.slice(0, max)}…` : value;

  const header = (
    <>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search field */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={19} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Title, author, subject or ISBN"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Pressable
          style={[styles.chip, selectedSubject !== "All" && styles.chipActive]}
          onPress={() => setActiveDropdown("subject")}
        >
          <Text style={[styles.chipText, selectedSubject !== "All" && styles.chipTextActive]}>
            {selectedSubject === "All" ? "Subject" : selectedSubject}
          </Text>
          <Ionicons
            name="chevron-down"
            size={13}
            color={selectedSubject !== "All" ? ACCENT_DARK : colors.textMuted}
          />
        </Pressable>

        <Pressable
          style={[styles.chip, selectedAuthor !== "All" && styles.chipActive]}
          onPress={() => setActiveDropdown("author")}
        >
          <Text style={[styles.chipText, selectedAuthor !== "All" && styles.chipTextActive]}>
            {selectedAuthor === "All" ? "Author" : truncate(selectedAuthor, 14)}
          </Text>
          <Ionicons
            name="chevron-down"
            size={13}
            color={selectedAuthor !== "All" ? ACCENT_DARK : colors.textMuted}
          />
        </Pressable>

        <Pressable
          style={[styles.chip, selectedAvailability !== "All" && styles.chipActive]}
          onPress={() => setActiveDropdown("availability")}
        >
          <Text style={[styles.chipText, selectedAvailability !== "All" && styles.chipTextActive]}>
            {selectedAvailability === "All" ? "Status" : selectedAvailability}
          </Text>
          <Ionicons
            name="chevron-down"
            size={13}
            color={selectedAvailability !== "All" ? ACCENT_DARK : colors.textMuted}
          />
        </Pressable>

        {activeFilterCount > 0 && (
          <Pressable style={styles.clearChip} onPress={clearFilters}>
            <Ionicons name="close" size={13} color={colors.danger} />
            <Text style={styles.clearChipText}>Clear</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Categories — only worth showing before the user has narrowed anything */}
      {!query && activeFilterCount === 0 && (
        <>
          <Text style={styles.sectionTitle}>Browse by subject</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.label}
                style={styles.categoryTile}
                onPress={() => setSelectedSubject(cat.subject)}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={cat.icon as any} size={20} color={ACCENT} />
                </View>
                <Text style={styles.categoryLabel} numberOfLines={1}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>
          {query || activeFilterCount > 0 ? "Results" : "All books"}
        </Text>
        {!loading && (
          <Text style={styles.resultsCount}>
            {filtered.length} of {books.length}
          </Text>
        )}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  return (
    <View style={styles.screen}>
      <AuthLibraryBackground
        overlayColor={isDark ? AUTH_LIBRARY_OVERLAY : LIGHT_LIBRARY_OVERLAY}
      />
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <FlatList
          data={loading ? [] : filtered}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={header}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <BookGridCard
              book={item}
              width={CARD_WIDTH}
              accentColor={ACCENT}
              accentSoftColor={ACCENT_LIGHT}
              accentTextColor={ACCENT_DARK}
            />
          )}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={ACCENT} style={{ marginTop: spacing.xl }} />
            ) : error ? null : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="search-outline" size={28} color={ACCENT} />
                </View>
                <Text style={styles.emptyTitle}>No matches</Text>
                <Text style={styles.emptyBody}>
                  Try a different spelling, or clear the filters to see the whole catalogue.
                </Text>
                {activeFilterCount > 0 && (
                  <Pressable style={styles.emptyButton} onPress={clearFilters}>
                    <Text style={styles.emptyButtonText}>Clear filters</Text>
                  </Pressable>
                )}
              </View>
            )
          }
        />

        {/* Filter picker */}
        <Modal
          visible={activeDropdown !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveDropdown(null)}
        >
          <Pressable style={styles.backdrop} onPress={() => setActiveDropdown(null)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.grabber} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {activeDropdown === "subject"
                    ? "Subject"
                    : activeDropdown === "author"
                      ? "Author"
                      : "Availability"}
                </Text>
                <Pressable onPress={() => setActiveDropdown(null)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView style={styles.sheetScroll}>
                {dropdownOptions().map((option) => {
                  const selected = dropdownValue() === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.sheetOption, selected && styles.sheetOptionActive]}
                      onPress={() => selectOption(option)}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextActive]}>
                        {option}
                      </Text>
                      {selected && <Ionicons name="checkmark" size={18} color={ACCENT} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
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
    listContent: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: spacing.sm,
      paddingBottom: spacing.huge,
      flexGrow: 1,
    },
    column: {
      gap: GRID_GAP,
      marginBottom: GRID_GAP,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.md,
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
      paddingVertical: spacing.md - 2,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      // Strips the default vertical padding Android adds to TextInput
      paddingVertical: 0,
    },
    chipRow: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      paddingRight: spacing.lg,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
    },
    chipActive: {
      backgroundColor: ACCENT,
      borderColor: ACCENT,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
    },
    chipTextActive: {
      color: ACCENT_DARK,
      fontWeight: "700",
    },
    clearChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.round,
      backgroundColor: colors.dangerLight,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    clearChipText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.danger,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    categoryRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    categoryTile: {
      flex: 1,
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: ACCENT_LIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.text,
    },
    resultsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    resultsCount: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      marginBottom: spacing.md,
    },
    emptyState: {
      alignItems: "center",
      paddingTop: spacing.xl,
    },
    emptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: ACCENT_LIGHT,
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
      paddingHorizontal: spacing.xl,
      lineHeight: 19,
    },
    emptyButton: {
      marginTop: spacing.lg,
      backgroundColor: ACCENT,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.round,
    },
    emptyButtonText: {
      color: ACCENT_DARK,
      fontWeight: "700",
      fontSize: 14,
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.huge,
      borderTopRightRadius: borderRadius.huge,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.huge,
      maxHeight: "70%",
    },
    grabber: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderDark,
      marginBottom: spacing.md,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    sheetScroll: {
      flexGrow: 0,
    },
    sheetOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
    },
    sheetOptionActive: {
      backgroundColor: ACCENT_LIGHT,
    },
    optionText: {
      fontSize: 15,
      color: colors.text,
    },
    optionTextActive: {
      color: ACCENT,
      fontWeight: "700",
    },
  });
