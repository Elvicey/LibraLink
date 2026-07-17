import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";

const LISTS = [
  {
    id: "1",
    label: "Semester Reading List",
    detail: "17 books saved for current courses",
    badge: "Active",
    icon: "📚",
  },
  {
    id: "2",
    label: "Research References",
    detail: "7 books saved for final project work",
    badge: "Project",
    icon: "🎓",
  },
  {
    id: "3",
    label: "Exam Prep Core Guides",
    detail: "5 study guides reviewed for midterms",
    badge: "Review",
    icon: "📝",
  },
];

export default function ReadingLists() {
  const router = useRouter();
  const { colors, spacing, borderRadius, typography } = useTheme();

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case "Active":
        return { color: colors.primary, bg: colors.primaryLight };
      case "Project":
        return { color: colors.warning, bg: colors.warningLight };
      default:
        return { color: colors.danger, bg: colors.dangerLight };
    }
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Reading Lists
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Your saved book collections for study, research, and reading goals.
      </Text>

      {LISTS.map((list) => {
        const badgeColors = getBadgeStyle(list.badge);
        return (
          <Card key={list.id} style={[styles.card, { marginBottom: spacing.md, borderColor: colors.border }]}>
            <View style={styles.headerRow}>
              <View style={[styles.titleSection, { gap: spacing.md }]}>
                <Text style={styles.listIcon}>{list.icon}</Text>
                <View style={styles.textStack}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{list.label}</Text>
                  <Text style={[styles.cardValue, { color: colors.textMuted, marginTop: spacing.xs }]}>{list.detail}</Text>
                </View>
              </View>
              <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
                <Text style={[styles.badgeText, { color: badgeColors.color }]}>
                  {list.badge}
                </Text>
              </View>
            </View>
          </Card>
        );
      })}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  backButton: {
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  backText: {
    fontWeight: "700",
    fontSize: 16,
  },
  title: {
    fontWeight: "800",
  },
  description: {
    fontWeight: "500",
  },
  card: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  textStack: {
    flex: 1,
    marginRight: 8,
  },
  listIcon: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardValue: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
