import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { theme, lightColors } from "../constants/theme";

const roles = [
  {
    id: "student",
    title: "Student / Lecturer",
    description: "Same academic app: browse, borrow, reading lists, and study tools",
    emoji: "🎓",
    color: "#0b6efd",
    route: "/signin",
  },
  {
    id: "staff",
    title: "Librarian / Admin",
    description: "Same staff console: inventory, circulation, and system management",
    emoji: "📚",
    color: "#10b981",
    route: "/librarian-signin",
  },
];

export default function RoleSelect() {
  const router = useRouter();

  return (
    <ScreenWrapper
      scrollable
      statusBarColor="#ffffff"
      statusBarStyle="dark-content"
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <View style={styles.backgroundCirclesContainer}>
        <View style={[styles.circle, styles.circleBlueLarge, { top: -100, left: -100 }]} />
        <View style={[styles.circle, styles.circleYellowMedium, { top: 80, right: -40 }]} />
        <View style={[styles.circle, styles.circleBlueRing, { top: "45%", left: -50 }]} />
        <View style={[styles.circle, styles.circleYellowSmall, { bottom: 120, left: -30 }]} />
        <View style={[styles.circle, styles.circleBlueLarge, { bottom: -120, right: -80 }]} />
        <View style={[styles.circle, styles.circleYellowRing, { top: "25%", right: "15%" }]} />
      </View>

      <View style={styles.glassCard}>
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconBadgeText}>📚</Text>
          </View>
          <Text style={styles.title}>Welcome to LibraLink</Text>
          <Text style={styles.subtitle}>Choose your role to continue</Text>
        </View>

        <View style={styles.roleList}>
          {roles.map((role) => (
            <Pressable
              key={role.id}
              style={[styles.roleCard, { borderLeftColor: role.color }]}
              onPress={() => router.push(role.route as any)}
            >
              <View style={[styles.roleIconContainer, { backgroundColor: `${role.color}15` }]}>
                <Text style={styles.roleEmoji}>{role.emoji}</Text>
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              <Text style={[styles.arrow, { color: role.color }]}>→</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#ffffff",
  },
  container: {
    padding: theme.spacing.lg,
    justifyContent: "center",
    minHeight: "100%",
    position: "relative",
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1.5,
    borderColor: "rgba(13, 37, 63, 0.08)",
    borderRadius: theme.borderRadius.huge,
    padding: theme.spacing.xl,
    shadowColor: "#0d253f",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: "center",
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(11, 110, 253, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  iconBadgeText: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: lightColors.text,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    color: lightColors.textMuted,
    fontSize: theme.typography.bodyLarge.fontSize,
    textAlign: "center",
  },
  roleList: {
    gap: theme.spacing.md,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(13, 37, 63, 0.06)",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    shadowColor: "#0d253f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: lightColors.text,
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 13,
    color: lightColors.textMuted,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: theme.spacing.sm,
  },
  backgroundCirclesContainer: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    zIndex: -1,
  },
  circle: {
    position: "absolute",
  },
  circleBlueLarge: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(13, 37, 63, 0.5)",
  },
  circleBlueRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "rgba(13, 37, 63, 0.5)",
  },
  circleYellowMedium: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(245, 186, 19, 0.5)",
  },
  circleYellowSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 186, 19, 0.5)",
  },
  circleYellowRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: "rgba(245, 186, 19, 0.5)",
  },
});
