import { API_BASE_URL } from "../../config/api";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";

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
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    return "Good evening";
  };

  const highlightsList = [
    {
      title: "Next due",
      value: "Calculus in 3 days",
      icon: "calendar-outline",
      bg: isDark ? "rgba(245, 158, 11, 0.12)" : "#fffbeb",
      border: isDark ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.15)",
      color: isDark ? "#fbbf24" : colors.warning,
    },
    {
      title: "Suggested",
      value: "AI for Education",
      icon: "bulb-outline",
      bg: isDark ? "rgba(34, 197, 94, 0.12)" : "#eefbf2",
      border: isDark ? "rgba(34, 197, 94, 0.25)" : "rgba(34, 197, 94, 0.15)",
      color: isDark ? "#4ade80" : colors.success,
    },
  ];

  return (
    <ScreenWrapper scrollable style={styles.screen} contentContainerStyle={styles.container}>
      {/* Background Ambient Glow Orbs */}
      <View
        style={[
          styles.orb,
          {
            backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(11, 110, 253, 0.05)",
            top: "5%",
            right: "-15%",
            shadowColor: colors.primary,
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            backgroundColor: isDark ? "rgba(139, 92, 246, 0.12)" : "rgba(139, 92, 246, 0.04)",
            bottom: "20%",
            left: "-15%",
            shadowColor: "#8b5cf6",
          },
        ]}
      />

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
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
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

      {/* Interactive Search Bar input layout */}
      <Pressable
        style={styles.searchBar}
        onPress={() => router.push("/search" as any)}
      >
        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
        <Text style={styles.searchPlaceholder}>Search by title, author or subject</Text>
        <Ionicons name="scan-outline" size={20} color={colors.primary} style={{ marginLeft: "auto" }} />
      </Pressable>

      {/* Quick Stats Grid */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="book-outline" size={20} color={colors.primary} style={{ marginBottom: spacing.xs }} />
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>Borrowed</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} style={{ marginBottom: spacing.xs }} />
          <Text style={[styles.statValue, { color: colors.danger }]}>1</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="bookmark-outline" size={20} color={colors.warning} style={{ marginBottom: spacing.xs }} />
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
          onPress={() => router.push("/scan" as any)}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: isDark ? "rgba(59, 130, 246, 0.16)" : colors.primaryLight }]}>
            <Ionicons name="scan-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.quickTextWrapper}>
            <Text style={styles.quickTitle}>Scan to borrow</Text>
            <Text style={styles.quickSubtitle}>Self-service checkout</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.quickButton, styles.quickSecondary]}
          onPress={() => router.push("/ai" as any)}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: isDark ? "rgba(139, 92, 246, 0.16)" : "rgba(139, 92, 246, 0.06)" }]}>
            <Ionicons name="sparkles-outline" size={22} color={isDark ? "#a78bfa" : "#8b5cf6"} />
          </View>
          <View style={styles.quickTextWrapper}>
            <Text style={styles.quickTitle}>Ask Libra</Text>
            <Text style={styles.quickSubtitle}>Get learning suggestions</Text>
          </View>
        </Pressable>
      </View>

      {/* Today's Highlights Section */}
      <Text style={styles.sectionTitle}>Today's highlights</Text>
      <View style={styles.highlightRow}>
        {highlightsList.map((item) => (
          <View
            key={item.title}
            style={[
              styles.highlightCard,
              {
                backgroundColor: item.bg,
                borderColor: item.border,
                borderWidth: 1.5,
              },
            ]}
          >
            <View style={styles.highlightHeader}>
              <Ionicons name={item.icon as any} size={16} color={item.color} style={{ marginRight: 6 }} />
              <Text style={[styles.highlightTitle, { color: item.color }]}>{item.title}</Text>
            </View>
            <Text style={[styles.highlightValue, { color: colors.text }]}>{item.value}</Text>
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
            <Text style={styles.resourceMeta}>50% complete</Text>
          </View>
          
          {/* Custom Circular Progress Arc */}
          <View style={styles.circularProgressContainer}>
            <View style={styles.progressTrack} />
            <View style={styles.progressSegment} />
            <Text style={styles.progressPercent}>50%</Text>
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

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
    },
    container: {
      padding: spacing.lg,
      position: "relative",
    },
    orb: {
      position: "absolute",
      width: 200,
      height: 200,
      borderRadius: 100,
      opacity: 0.22,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 50,
      elevation: 0,
      zIndex: 0,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
      zIndex: 1,
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
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
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
    bellBadge: {
      position: "absolute",
      top: 10,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
      borderWidth: 1.5,
      borderColor: isDark ? "#181c33" : colors.surface,
    },
    heroCard: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 1,
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "transparent",
      borderWidth: isDark ? 1 : 0,
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
      overflow: "hidden",
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderWidth: 1.2,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
      zIndex: 1,
    },
    searchPlaceholder: {
      color: colors.textMuted,
      fontSize: 15,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
      gap: spacing.sm,
      zIndex: 1,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "transparent",
      borderWidth: isDark ? 1 : 0,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.lg,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.02,
      shadowRadius: 6,
      elevation: 1,
    },
    statValue: {
      fontSize: 20,
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
      marginBottom: spacing.xs,
      zIndex: 1,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginVertical: spacing.sm,
      zIndex: 1,
    },
    quickActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
      gap: spacing.sm,
      zIndex: 1,
    },
    quickButton: {
      flex: 1,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
    },
    quickPrimary: {
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
    },
    quickSecondary: {
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
    },
    quickIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },
    quickTextWrapper: {
      flex: 1,
    },
    quickTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    quickSubtitle: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
    highlightRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
      gap: spacing.sm,
      zIndex: 1,
    },
    highlightCard: {
      flex: 1,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
    },
    highlightHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    highlightTitle: {
      fontSize: 13,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    highlightValue: {
      fontWeight: "700",
      fontSize: 14,
    },
    resourcesCard: {
      marginBottom: spacing.lg,
      zIndex: 1,
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "transparent",
      borderWidth: isDark ? 1 : 0,
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
    // Circular Progress Arc styles
    circularProgressContainer: {
      width: 52,
      height: 52,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    progressTrack: {
      position: "absolute",
      width: "100%",
      height: "100%",
      borderRadius: 26,
      borderWidth: 4.5,
      borderColor: colors.border,
    },
    progressSegment: {
      position: "absolute",
      width: "100%",
      height: "100%",
      borderRadius: 26,
      borderWidth: 4.5,
      borderColor: colors.primary,
      borderTopColor: "transparent",
      borderRightColor: "transparent",
      transform: [{ rotate: "45deg" }],
    },
    progressPercent: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.text,
    },
    recommendedSection: {
      marginTop: spacing.md,
      marginBottom: spacing.xl,
      zIndex: 1,
    },
    carouselContainer: {
      paddingRight: spacing.lg,
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    carouselCard: {
      width: 170,
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
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
      overflow: "hidden",
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
