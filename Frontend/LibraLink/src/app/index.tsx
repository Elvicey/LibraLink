import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme, lightColors } from "../constants/theme";

const roles = [
  {
    key: "student",
    title: "Student",
    subtitle: "Browse, borrow & manage your library",
    emoji: "🎓",
    route: "/signin",
  },
  {
    key: "lecturer",
    title: "Lecturer",
    subtitle: "Lecture-to-Library & course reading lists",
    emoji: "📖",
    route: "/lecturer-signin",
  },
  {
    key: "librarian",
    title: "Librarian",
    subtitle: "Manage books, loans & inventory",
    emoji: "📚",
    route: "/librarian-signin",
  },
  {
    key: "admin",
    title: "Admin",
    subtitle: "System administration",
    emoji: "⚙️",
    route: "/admin-signin",
  },
];

export default function RoleSelection() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      {/* Decorative background circles */}
      <View style={styles.bgCircles}>
        <View style={[styles.circle, styles.circleBlue, { top: -120, left: -100 }]} />
        <View style={[styles.circle, styles.circleYellow, { top: 60, right: -40 }]} />
        <View style={[styles.circle, styles.circleBlueRing, { bottom: 100, left: -50 }]} />
        <View style={[styles.circle, styles.circleYellowRing, { bottom: -60, right: -30 }]} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>📚</Text>
          <Text style={styles.title}>LibraLink</Text>
          <Text style={styles.subtitle}>Choose your role to continue</Text>
        </View>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <Pressable
              key={role.key}
              style={styles.roleCard}
              onPress={() => router.push(role.route as any)}
            >
              <Text style={styles.roleEmoji}>{role.emoji}</Text>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  bgCircles: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    zIndex: -1,
  },
  circle: {
    position: "absolute",
  },
  circleBlue: {
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
  circleYellow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(245, 186, 19, 0.5)",
  },
  circleYellowRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: "rgba(245, 186, 19, 0.5)",
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.huge + 8,
  },
  logo: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: lightColors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 17,
    color: lightColors.textMuted,
    fontWeight: "500",
  },
  rolesContainer: {
    gap: theme.spacing.md,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1.5,
    borderColor: "rgba(13, 37, 63, 0.08)",
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    shadowColor: "#0d253f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  roleEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.lg,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: lightColors.text,
    marginBottom: 2,
  },
  roleSubtitle: {
    fontSize: 13,
    color: lightColors.textMuted,
  },
  arrow: {
    fontSize: 22,
    color: lightColors.primary,
    fontWeight: "600",
  },
});
