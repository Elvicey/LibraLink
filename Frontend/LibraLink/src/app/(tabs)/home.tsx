import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";

const HIGHLIGHTS = [
  { title: "Next due", value: "Calculus in 3 days", color: "#fde68a" },
  { title: "Suggested", value: "AI for Education", color: "#a7f3d0" },
];

const RECOMMENDED = [
  {
    id: "1",
    title: "Library Science Essentials",
    author: "KNUST Collection",
    tag: "Recommended",
    emoji: "📚",
  },
  {
    id: "2",
    title: "Exam Strategies 2026",
    author: "O. Asiedu",
    tag: "Top pick",
    emoji: "📝",
  },
  {
    id: "3",
    title: "Introduction to Calculus",
    author: "J. Stewart",
    tag: "Science",
    emoji: "📐",
  },
];

export default function Home() {
  const router = useRouter();
  const { colors, spacing, borderRadius, typography } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.userName}>Esther Asamoah</Text>
        </View>
        <Pressable
          style={styles.bellButton}
          onPress={() => router.push("/notifications" as any)}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.bellBadge} />
        </Pressable>
      </View>

      {/* Hero Card */}
      <Card style={styles.heroCard}>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>Your Learning Companion</Text>
          <Text style={styles.subtitle}>Settle fines, reserve items, and check out instantly.</Text>
        </View>
        <Text style={styles.heroBadge}>Student</Text>
      </Card>

      {/* Search Bar Card */}
      <Pressable
        style={styles.searchCard}
        onPress={() => router.push("/search" as any)}
      >
        <Text style={styles.searchLabel}>Search the catalogue</Text>
        <Text style={styles.searchText}>
          Tap to find books, journals, or notes
        </Text>
      </Pressable>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>Borrowed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.danger }]}>1</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Holds</Text>
        </View>
      </View>

      {/* Quick Actions Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
      </View>

      {/* Quick Actions Buttons */}
      <View style={styles.quickActions}>
        <Pressable
          style={[styles.quickButton, styles.quickPrimary]}
          onPress={() => router.push("/search" as any)}
        >
          <Text style={styles.quickTitle}>Scan to borrow</Text>
          <Text style={styles.quickSubtitle}>Self-service checkout</Text>
        </Pressable>
        <Pressable
          style={[styles.quickButton, styles.quickSecondary]}
          onPress={() => router.push("/ai" as any)}
        >
          <Text style={styles.quickTitle}>Ask Libra</Text>
          <Text style={styles.quickSubtitle}>Get learning suggestions</Text>
        </Pressable>
      </View>

      {/* Today's Highlights Section */}
      <Text style={styles.sectionTitle}>Today's highlights</Text>
      <View style={styles.highlightRow}>
        {HIGHLIGHTS.map((item) => (
          <View
            key={item.title}
            style={[styles.highlightCard, { backgroundColor: item.color }]}
          >
            <Text style={styles.highlightTitle}>{item.title}</Text>
            <Text style={styles.highlightValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Continue Reading Card */}
      <Card style={styles.resourcesCard}>
        <Text style={styles.resourcesTitle}>Continue reading</Text>
        <Text style={styles.resourcesSubtitle}>Pick up where you left off</Text>
        <View style={styles.resourceInfo}>
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Text style={styles.resourceLabel}>
              Data Structures in Practice
            </Text>
            <Text style={styles.resourceMeta}>37% complete</Text>
          </View>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>37%</Text>
          </View>
        </View>
      </Card>

      {/* Recommended Section (Horizontal Carousel) */}
      <View style={styles.recommendedSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
        >
          {RECOMMENDED.map((item) => (
            <Pressable
              key={item.id}
              style={styles.carouselCard}
              onPress={() => router.push(`/book/${item.id}` as any)}
            >
              <View style={styles.carouselCardHeader}>
                <Text style={styles.carouselEmoji}>{item.emoji}</Text>
                <Text style={styles.carouselTag}>{item.tag}</Text>
              </View>
              <Text style={styles.carouselTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.carouselAuthor} numberOfLines={1}>
                {item.author}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any) =>
  StyleSheet.create({
    container: {
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    greetingText: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: "500",
    },
    userName: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      marginTop: 2,
    },
    bellButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      position: "relative",
      shadowColor: "#000",
      shadowOpacity: 0.02,
      shadowRadius: 4,
      elevation: 1,
    },
    bellIcon: {
      fontSize: 18,
    },
    bellBadge: {
      position: "absolute",
      top: 10,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
    heroCard: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    heroTextContainer: {
      flex: 1,
      marginRight: spacing.sm,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 18,
    },
    heroBadge: {
      color: colors.primary,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.round,
      fontWeight: "700",
      fontSize: 12,
    },
    searchCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    searchLabel: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 14,
      marginBottom: spacing.xs,
    },
    searchText: {
      color: colors.textMuted,
      fontSize: 15,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.02,
      shadowRadius: 6,
      elevation: 1,
    },
    statValue: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
    },
    statLabel: {
      color: colors.textMuted,
      marginTop: spacing.xs,
      fontSize: 12,
      textAlign: "center",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginVertical: spacing.sm,
    },
    quickActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    quickButton: {
      flex: 1,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
    },
    quickPrimary: {
      backgroundColor: colors.primaryLight,
    },
    quickSecondary: {
      backgroundColor: colors.secondaryLight,
    },
    quickTitle: {
      fontSize: 15,
      fontWeight: "700",
      marginBottom: spacing.xs,
      color: colors.text,
    },
    quickSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
    },
    highlightRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    highlightCard: {
      flex: 1,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
    },
    highlightTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: spacing.xs,
    },
    highlightValue: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 13,
    },
    resourcesCard: {
      marginBottom: spacing.lg,
    },
    resourcesTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    resourcesSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: spacing.md,
    },
    resourceInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    resourceLabel: {
      fontWeight: "700",
      fontSize: 14,
      color: colors.text,
    },
    resourceMeta: {
      color: colors.textMuted,
      marginTop: spacing.xs,
      fontSize: 12,
    },
    progressPill: {
      backgroundColor: colors.primaryLight,
      borderRadius: borderRadius.round,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    progressText: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 12,
    },
    recommendedSection: {
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    carouselContainer: {
      paddingRight: spacing.lg,
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    carouselCard: {
      width: 170,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    carouselCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    carouselEmoji: {
      fontSize: 24,
    },
    carouselTag: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      color: colors.primary,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    carouselTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.xs,
      lineHeight: 18,
    },
    carouselAuthor: {
      fontSize: 12,
      color: colors.textMuted,
    },
  });
