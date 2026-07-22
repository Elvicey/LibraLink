import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BookCard from "../../components/BookCard";
import Input from "../../components/common/Input";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";
import Card from "../../components/common/Card";
import { bookAuthorName, booksService, Book, inferSubject, isBookAvailable } from "../../services/books";

const SUBJECT_OPTIONS = ["All", "Science", "Literature", "Computing", "Economics"];
const AVAILABILITY_OPTIONS = ["All", "Available", "On Loan"];

const CATEGORIES = [
  { label: "Science", emoji: "🧬", subject: "Science", tint: "rgba(11, 110, 253, 0.08)" },
  { label: "Literature", emoji: "📖", subject: "Literature", tint: "rgba(139, 92, 246, 0.08)" },
  { label: "Computing", emoji: "💻", subject: "Computing", tint: "rgba(6, 182, 212, 0.08)" },
  { label: "Economics", emoji: "📈", subject: "Economics", tint: "rgba(245, 158, 11, 0.08)" },
];

type SearchBook = {
  id: string;
  title: string;
  author: string;
  available: boolean;
  tag: string;
};

function toSearchBook(book: Book): SearchBook {
  return {
    id: String(book.id),
    title: book.title,
    author: bookAuthorName(book),
    available: isBookAvailable(book),
    tag: inferSubject(book),
  };
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<SearchBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedAuthor, setSelectedAuthor] = useState("All");
  const [selectedAvailability, setSelectedAvailability] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [activeDropdown, setActiveDropdown] = useState<"subject" | "author" | "availability" | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await booksService.list();
      setBooks(data.map(toSearchBook));
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
    const names = Array.from(new Set(books.map((b) => b.author))).sort();
    return ["All", ...names];
  }, [books]);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch = `${b.title} ${b.author} ${b.tag}`
        .toLowerCase()
        .includes(query.toLowerCase());
      
      const matchesSubject =
        selectedSubject === "All" || b.tag === selectedSubject;
      const matchesCategory =
        !selectedCategory || b.tag === selectedCategory;
      const matchesAuthor = selectedAuthor === "All" || b.author === selectedAuthor;
      
      let matchesAvailability = true;
      if (selectedAvailability === "Available") {
        matchesAvailability = b.available;
      } else if (selectedAvailability === "On Loan") {
        matchesAvailability = !b.available;
      }
      
      return matchesSearch && matchesSubject && matchesCategory && matchesAuthor && matchesAvailability;
    });
  }, [books, query, selectedSubject, selectedCategory, selectedAuthor, selectedAvailability]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(query.toLowerCase()) &&
        b.title.toLowerCase() !== query.toLowerCase()
    ).map((b) => b.title).slice(0, 6);
  }, [books, query]);

  const getDropdownOptions = () => {
    if (activeDropdown === "subject") return SUBJECT_OPTIONS;
    if (activeDropdown === "author") return authorOptions;
    return AVAILABILITY_OPTIONS;
  };

  const getActiveValue = () => {
    if (activeDropdown === "subject") return selectedSubject;
    if (activeDropdown === "author") return selectedAuthor;
    return selectedAvailability;
  };

  const handleSelectOption = (option: string) => {
    if (activeDropdown === "subject") setSelectedSubject(option);
    else if (activeDropdown === "author") setSelectedAuthor(option);
    else if (activeDropdown === "availability") setSelectedAvailability(option);
    setActiveDropdown(null);
  };

  const startVoiceMock = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setQuery("Calculus J. Stewart");
      setSelectedSubject("All");
      setSelectedAuthor("All");
      setSelectedAvailability("All");
    }, 2200);
  };

  const listHeader = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Search Catalogue</Text>
        <Text style={styles.subtitle}>
          Find books, resources, and exam materials instantly
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 }}>
          {loading ? "Loading catalogue…" : `${filtered.length} of ${books.length} books`}
        </Text>
      </View>

      <View style={styles.searchWrapper}>
        <Input
          placeholder="Search by title, author or subject"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          containerStyle={styles.searchContainer}
          leftIcon={<Ionicons name="search-outline" size={20} color={colors.textMuted} />}
          rightIcon={
            query ? (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : (
              <Pressable onPress={startVoiceMock}>
                <Ionicons name="mic-outline" size={20} color={colors.primary} />
              </Pressable>
            )
          }
        />
        {showDropdown && suggestions.length > 0 && (
          <View style={styles.suggestionsList}>
            {suggestions.map((sug, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.dropdownItem,
                  idx < suggestions.length - 1 && styles.dropdownItemBorder,
                ]}
                onPress={() => {
                  setQuery(sug);
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.dropdownText}>🔍  {sug}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterPill, selectedSubject !== "All" && styles.activePill]}
          onPress={() => setActiveDropdown("subject")}
        >
          <Text style={[styles.filterPillText, selectedSubject !== "All" && styles.activePillText]}>
            Subject: {selectedSubject} ▾
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterPill, selectedAuthor !== "All" && styles.activePill]}
          onPress={() => setActiveDropdown("author")}
        >
          <Text style={[styles.filterPillText, selectedAuthor !== "All" && styles.activePillText]}>
            Author: {selectedAuthor.length > 12 ? `${selectedAuthor.slice(0, 12)}…` : selectedAuthor} ▾
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterPill, selectedAvailability !== "All" && styles.activePill]}
          onPress={() => setActiveDropdown("availability")}
        >
          <Text style={[styles.filterPillText, selectedAvailability !== "All" && styles.activePillText]}>
            Status: {selectedAvailability} ▾
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Browse Categories</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.label}
            style={[
              styles.categoryTile,
              selectedCategory === cat.subject && { borderColor: colors.primary, borderWidth: 1.5 },
            ]}
            onPress={() => {
              setSelectedCategory((prev) => (prev === cat.subject ? null : cat.subject));
              setQuery("");
              setSelectedSubject("All");
              setSelectedAuthor("All");
              setSelectedAvailability("All");
            }}
          >
            <View style={[styles.catEmojiWrapper, { backgroundColor: cat.tint }]}>
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
            </View>
            <Text style={styles.catLabel}>{cat.label}</Text>
          </Pressable>
        ))}
      </View>
      {!!selectedCategory && (
        <Pressable onPress={() => setSelectedCategory(null)} style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>
            Showing {selectedCategory} · Clear filter
          </Text>
        </Pressable>
      )}

      <Text style={styles.resultsTitle}>Search results</Text>
      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
      {!!error && !loading && (
        <Text style={[styles.emptyText, { color: colors.danger }]}>{error}</Text>
      )}
    </>
  );

  return (
    <ScreenWrapper style={styles.safeArea}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.listContent, { padding: spacing.lg }]}
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookCard book={item} />}
        ListHeaderComponent={listHeader}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No books match the selected filters.
            </Text>
          ) : null
        }
      />

      <Modal
        visible={activeDropdown !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActiveDropdown(null)}>
          <View style={[styles.modalSheet, isDark ? styles.modalSheetDark : null]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Select {activeDropdown === "subject" ? "Subject" : activeDropdown === "author" ? "Author" : "Availability"}
              </Text>
              <Pressable onPress={() => setActiveDropdown(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetContent}>
              {getDropdownOptions().map((opt) => {
                const isSelected = getActiveValue() === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[
                      styles.sheetOption,
                      isSelected && { backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => handleSelectOption(opt)}
                  >
                    <Text style={[styles.optionText, isSelected && { color: colors.primary, fontWeight: "700" }, { color: colors.text }]}>
                      {opt}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={isListening} transparent animationType="fade">
        <View style={styles.voiceOverlay}>
          <Card style={[styles.voiceCard, isDark ? styles.cardDark : null]}>
            <Text style={[styles.voiceTitle, { color: colors.text }]}>Listening...</Text>
            <Text style={[styles.voiceDesc, { color: colors.textMuted }]}>
              Say a book title, author, or subject.
            </Text>
            <View style={[styles.pulseCircle, { borderColor: colors.primaryLight }]}>
              <View style={[styles.pulseInner, { backgroundColor: colors.primary }]}>
                <Ionicons name="mic" size={32} color={colors.textLight} />
              </View>
            </View>
            <Text style={[styles.speechHint, { color: colors.primary }]}>"Calculus by J. Stewart"</Text>
          </Card>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    header: {
      marginBottom: spacing.md,
    },
    title: {
      fontSize: typography.titleMedium.fontSize,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: typography.bodyMedium.fontSize,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    searchWrapper: {
      position: "relative",
      zIndex: 100,
    },
    searchContainer: {
      marginBottom: spacing.sm,
    },
    suggestionsList: {
      position: "absolute",
      top: 50,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: borderRadius.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
      zIndex: 200,
    },
    dropdownItem: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    dropdownItemBorder: {
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    dropdownText: {
      fontSize: 15,
      color: colors.text,
      fontWeight: "600",
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.md,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      marginBottom: spacing.lg,
      zIndex: 1,
    },
    categoryTile: {
      width: "47%",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      shadowColor: "#000",
      shadowOpacity: 0.02,
      shadowRadius: 6,
      elevation: 1,
      borderWidth: 1,
      borderColor: colors.border,
    },
    catEmojiWrapper: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    catEmoji: {
      fontSize: 18,
    },
    catLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    filterRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.lg,
      zIndex: 50,
    },
    filterPill: {
      flex: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm - 2,
      borderRadius: borderRadius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    activePill: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    filterPillText: {
      fontSize: 11,
      color: colors.text,
      fontWeight: "600",
    },
    activePillText: {
      color: colors.primary,
      fontWeight: "700",
    },
    resultsTitle: {
      fontSize: typography.titleSmall.fontSize,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.md,
      zIndex: 1,
    },
    list: {
      flex: 1,
      zIndex: 1,
    },
    listContent: {
      paddingBottom: spacing.xxl,
    },
    emptyText: {
      textAlign: "center",
      paddingVertical: spacing.xxl,
      fontSize: 14,
      fontStyle: "italic",
    },
    // Modal selection sheet styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.lg,
      maxHeight: "60%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    modalSheetDark: {
      backgroundColor: "#181c33",
      borderColor: "rgba(255, 255, 255, 0.08)",
      borderTopWidth: 1,
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.md,
      marginBottom: spacing.sm,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: "800",
    },
    sheetContent: {
      paddingBottom: spacing.xl,
    },
    sheetOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
    },
    optionText: {
      fontSize: 15,
      fontWeight: "500",
    },
    // Voice Modal styles
    voiceOverlay: {
      flex: 1,
      backgroundColor: "rgba(6, 9, 19, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    voiceCard: {
      padding: spacing.xl,
      alignItems: "center",
      width: "85%",
    },
    cardDark: {
      backgroundColor: "rgba(24, 28, 51, 0.85)",
      borderColor: "rgba(255, 255, 255, 0.06)",
      borderWidth: 1,
    },
    voiceTitle: {
      fontSize: 18,
      fontWeight: "800",
    },
    voiceDesc: {
      fontSize: 13,
      marginTop: spacing.xs,
      textAlign: "center",
    },
    pulseCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 6,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: spacing.xl,
    },
    pulseInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    speechHint: {
      fontSize: 14,
      fontStyle: "italic",
      fontWeight: "700",
    },
  });
