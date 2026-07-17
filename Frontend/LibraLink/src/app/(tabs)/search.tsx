import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import BookCard from "../../components/BookCard";
import Input from "../../components/common/Input";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";

const SAMPLE_BOOKS = [
  {
    id: "1",
    title: "Things Fall Apart",
    author: "Chinua Achebe",
    available: true,
    tag: "Classic",
  },
  {
    id: "2",
    title: "Introduction to Calculus",
    author: "J. Stewart",
    available: false,
    tag: "Exam prep",
  },
  {
    id: "3",
    title: "African Economics",
    author: "A. Smith",
    available: true,
    tag: "Policy",
  },
];

const CATEGORIES = [
  { label: "Science", emoji: "🧬", query: "Calculus" },
  { label: "Literature", emoji: "📖", query: "Things Fall Apart" },
  { label: "Computing", emoji: "💻", query: "Data" },
  { label: "Economics", emoji: "📈", query: "Economics" },
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "available" | "loan">("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const { colors, spacing, borderRadius, typography } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography);

  const filtered = useMemo(() => {
    return SAMPLE_BOOKS.filter((b) => {
      const matchesSearch = `${b.title} ${b.author} ${b.tag}`
        .toLowerCase()
        .includes(query.toLowerCase());
      
      if (activeFilter === "available") {
        return matchesSearch && b.available;
      }
      if (activeFilter === "loan") {
        return matchesSearch && !b.available;
      }
      return matchesSearch;
    });
  }, [query, activeFilter]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return SAMPLE_BOOKS.filter(
      (b) =>
        b.title.toLowerCase().includes(query.toLowerCase()) &&
        b.title.toLowerCase() !== query.toLowerCase()
    ).map((b) => b.title);
  }, [query]);

  return (
    <ScreenWrapper style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Search Catalogue</Text>
          <Text style={styles.subtitle}>
            Find books, resources, and exam materials instantly
          </Text>
        </View>

        {/* Search Wrapper with Overlay Dropdown */}
        <View style={styles.searchWrapper}>
          <Input
            placeholder="Search by title, author or subject"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            containerStyle={styles.searchContainer}
          />
          {showDropdown && suggestions.length > 0 && (
            <View style={styles.dropdown}>
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

        {/* Category Browsing Grid */}
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.label}
              style={styles.categoryTile}
              onPress={() => setQuery(cat.query)}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={styles.catLabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterPill,
              activeFilter === "all" && styles.activePill,
            ]}
            onPress={() => setActiveFilter("all")}
          >
            <Text style={[styles.filterPillText, activeFilter === "all" && styles.activePillText]}>
              All ({SAMPLE_BOOKS.length})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterPill,
              activeFilter === "available" && styles.activePill,
            ]}
            onPress={() => setActiveFilter("available")}
          >
            <Text style={[styles.filterPillText, activeFilter === "available" && styles.activePillText]}>
              Available ({SAMPLE_BOOKS.filter((b) => b.available).length})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterPill,
              activeFilter === "loan" && styles.activePill,
            ]}
            onPress={() => setActiveFilter("loan")}
          >
            <Text style={[styles.filterPillText, activeFilter === "loan" && styles.activePillText]}>
              On Loan ({SAMPLE_BOOKS.filter((b) => !b.available).length})
            </Text>
          </Pressable>
        </View>

        {/* Search Results */}
        <Text style={styles.resultsTitle}>Search results</Text>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BookCard book={item} />}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any) =>
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
      marginBottom: spacing.md,
    },
    dropdown: {
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
      padding: spacing.md,
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
    catEmoji: {
      fontSize: 22,
    },
    catLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    filterRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.md,
      zIndex: 1,
    },
    filterPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm - 2,
      borderRadius: borderRadius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activePill: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterPillText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: "600",
    },
    activePillText: {
      color: colors.textLight,
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
  });
