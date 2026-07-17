import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../../components/common/Card";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";

export default function Profile() {
  const router = useRouter();
  const { colors, spacing, borderRadius, typography, isDark, toggleTheme } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography);

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>E</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.title}>Esther Asamoah</Text>
          <Text style={styles.email}>esther@knust.edu.gh</Text>
          <Text style={styles.statusBadge}>Student member</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>14</Text>
          <Text style={styles.summaryLabel}>Borrowed this semester</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>96%</Text>
          <Text style={styles.summaryLabel}>On-time return rate</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>3</Text>
          <Text style={styles.summaryLabel}>Active holds</Text>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Library actions</Text>
        <View style={styles.menuSection}>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/borrowed" as any)}
          >
            <Text style={styles.menuText}>Borrowing history</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/reading-lists" as any)}
          >
            <Text style={styles.menuText}>Reading lists</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/notifications" as any)}
          >
            <Text style={styles.menuText}>Notifications</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/pay-fines" as any)}
          >
            <Text style={styles.menuText}>Pay fines</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account settings</Text>
        <View style={styles.menuSection}>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/profile-details" as any)}
          >
            <Text style={styles.menuText}>Profile details</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/security" as any)}
          >
            <Text style={styles.menuText}>Security</Text>
          </Pressable>
          <View style={[styles.menuItem, styles.menuItemRow]}>
            <Text style={styles.menuText}>Dark Mode</Text>
            <Pressable
              style={[
                styles.switchBase,
                isDark
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.borderDark },
              ]}
              onPress={toggleTheme}
            >
              <View
                style={[
                  styles.switchThumb,
                  { backgroundColor: colors.textLight },
                  isDark ? styles.switchThumbActive : styles.switchThumbInactive,
                ]}
              />
            </Pressable>
          </View>
          <Pressable
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={() => router.replace("/signin" as any)}
          >
            <Text style={[styles.menuText, styles.signOutText]}>Sign out</Text>
          </Pressable>
        </View>
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
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    avatarInitial: {
      color: colors.textLight,
      fontSize: 28,
      fontWeight: "800",
    },
    userInfo: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
    },
    email: {
      color: colors.textMuted,
      marginTop: spacing.xs,
      fontSize: 14,
    },
    statusBadge: {
      marginTop: spacing.sm,
      alignSelf: "flex-start",
      backgroundColor: colors.primaryLight,
      color: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: borderRadius.round,
      fontWeight: "700",
      fontSize: 13,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.xl,
      gap: spacing.xs,
    },
    summaryCard: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: "center",
      minWidth: 90,
    },
    summaryValue: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
    },
    summaryLabel: {
      color: colors.textMuted,
      marginTop: spacing.sm,
      fontSize: 12,
      textAlign: "center",
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.md,
    },
    menuSection: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.02,
      shadowRadius: 8,
      elevation: 1,
    },
    menuItem: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    lastMenuItem: {
      borderBottomWidth: 0,
    },
    menuItemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    menuText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    signOutText: {
      color: colors.danger,
    },
    // Switch styles
    switchBase: {
      width: 48,
      height: 28,
      borderRadius: 14,
      padding: 2,
      justifyContent: "center",
    },
    switchThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    switchThumbActive: {
      alignSelf: "flex-end",
    },
    switchThumbInactive: {
      alignSelf: "flex-start",
    },
  });
