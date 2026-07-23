import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/common/Card";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { borrowsService } from "../../services/borrows";
import { usersService } from "../../services/users";

export default function Profile() {
  const router = useRouter();
  const { userId, firstName, lastName, email, roles, clearSession, setSession, token } = useAuth();
  const { colors, spacing, borderRadius, typography, isDark, toggleTheme } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const [borrowedCount, setBorrowedCount] = useState(0);
  const [displayName, setDisplayName] = useState(firstName || "Student");
  const [displayEmail, setDisplayEmail] = useState(email || "");

  const load = useCallback(async () => {
    if (!userId || !token) return;
    try {
      const [user, history] = await Promise.all([
        usersService.getById(userId).catch(() => null),
        borrowsService.getHistory(userId).catch(() => []),
      ]);
      if (user) {
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Student";
        setDisplayName(user.firstName || name);
        setDisplayEmail(user.email || "");
        await setSession({
          token,
          userId,
          roles,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          institutionId: user.institutionId ?? null,
        });
      }
      setBorrowedCount(history.length);
    } catch {
      // keep cached auth values
    }
  }, [userId, token, roles, setSession]);

  useEffect(() => {
    if (firstName) setDisplayName(firstName);
    if (email) setDisplayEmail(email);
    load();
  }, [firstName, email, load]);

  const initial = (displayName || "S").charAt(0).toUpperCase();
  const roleLabel = roles.includes("LIBRARIAN")
    ? "Librarian"
    : roles.includes("LECTURER")
      ? "Lecturer"
      : roles.includes("ADMIN")
        ? "Admin"
        : "Student";

  return (
    <ScreenWrapper
      scrollable
      edges={["left", "right"]}
      statusBarColor="transparent"
      contentContainerStyle={styles.container}
    >
      <ImageBackground
        source={require("../../../assets/images/onboarding-bg.jpg")}
        style={styles.coverBanner}
        resizeMode="cover"
      >
        <View style={styles.coverOverlay} />
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
          <Text style={[styles.title, { color: colors.text }]}>
            {[firstName, lastName].filter(Boolean).join(" ") || displayName}
          </Text>
          <Text style={styles.email}>{displayEmail}</Text>
          <Text style={styles.statusBadge}>
            {roles.includes("LIBRARIAN") || roles.includes("ADMIN")
              ? "Staff member"
              : roles.includes("LECTURER")
                ? "Lecturer · academic app"
                : "Student · academic app"}
          </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Ionicons name="book" size={22} color={colors.primary} style={{ marginBottom: spacing.xs }} />
            <Text style={styles.summaryValue}>{borrowedCount}</Text>
            <Text style={styles.summaryLabel}>Borrow records</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Ionicons name="person" size={22} color={colors.success} style={{ marginBottom: spacing.xs }} />
            <Text style={styles.summaryValue}>{roleLabel}</Text>
            <Text style={styles.summaryLabel}>Account role</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Ionicons name="library" size={22} color={colors.warning} style={{ marginBottom: spacing.xs }} />
            <Text style={styles.summaryValue}>{userId ?? "—"}</Text>
            <Text style={styles.summaryLabel}>User ID</Text>
          </Card>
        </View>

        {/* Library Actions settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Library actions</Text>
          <View style={styles.menuSection}>
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/borrowed" as any)}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="receipt-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Borrowing history</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.borderDark} />
              </View>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/course" as any)}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="list-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Reading lists</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.borderDark} />
              </View>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/notifications" as any)}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="notifications-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.borderDark} />
              </View>
            </Pressable>

            <Pressable
              style={[styles.menuItem, styles.lastMenuItem]}
              onPress={() => router.push("/pay-fines" as any)}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="card-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Pay fines</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.borderDark} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Phase 2 extensions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Extensions</Text>
          <View style={styles.menuSection}>
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/audio" as any)}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="headset-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Audio Reader</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.borderDark} />
              </View>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/podcasts" as any)}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="mic-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Podcasts</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.borderDark} />
              </View>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/exam-mode" as any)}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="sparkles-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                  <Text style={styles.menuText}>AI Exam Mode</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.borderDark} />
              </View>
            </Pressable>

            <Pressable
              style={[styles.menuItem, styles.lastMenuItem]}
              onPress={() => router.push("/pickup" as any)}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="calendar-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Pick-Up Scheduler</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.borderDark} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Account actions settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account settings</Text>
          <View style={styles.menuSection}>
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/profile-details" as any)}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Profile details</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.borderDark} />
              </View>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/security" as any)}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Security</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.borderDark} />
              </View>
            </Pressable>

            {/* Dark Mode Custom Switch */}
            <View style={[styles.menuItem, styles.menuItemRow]}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="moon-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                <Text style={styles.menuText}>Dark Mode</Text>
              </View>
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

            {/* Sign Out Action Row */}
            <Pressable
              style={[styles.menuItem, styles.lastMenuItem]}
              onPress={async () => {
                await clearSession();
                router.replace("/role-select" as any);
              }}
            >
              <View style={styles.menuItemRow}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} style={styles.menuIcon} />
                  <Text style={[styles.menuText, styles.signOutText]}>Sign out</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      // Clear the floating tab bar
      paddingBottom: 110,
    },
    coverBanner: {
      height: 120, // Reduced height to keep layout compact
      width: "100%",
      position: "relative",
    },
    coverOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: isDark ? "rgba(6, 9, 19, 0.45)" : "rgba(11, 110, 253, 0.22)", // Translucent branding overlay
    },
    content: {
      paddingHorizontal: spacing.lg,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-end", // Align contents to the bottom of the row container
      marginBottom: spacing.xl,
      marginTop: 0, // Sits naturally below the banner
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
      borderWidth: 4,
      borderColor: colors.surface,
      marginTop: -40, // Only the avatar overlaps the banner
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    avatarInitial: {
      color: colors.textLight,
      fontSize: 32,
      fontWeight: "800",
    },
    userInfo: {
      flex: 1,
      paddingBottom: spacing.xs, // Sits on the clean background below the banner
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
      lineHeight: 28,
    },
    email: {
      color: colors.textMuted,
      marginTop: 2,
      fontSize: 14,
    },
    statusBadge: {
      marginTop: spacing.xs,
      alignSelf: "flex-start",
      backgroundColor: isDark ? "rgba(59, 130, 246, 0.18)" : colors.primaryLight,
      color: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.round,
      fontWeight: "700",
      fontSize: 12,
      overflow: "hidden",
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
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "transparent",
      borderWidth: isDark ? 1 : 0,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
    },
    summaryLabel: {
      color: colors.textMuted,
      marginTop: spacing.sm,
      fontSize: 11,
      textAlign: "center",
      lineHeight: 14,
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
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "transparent",
      borderWidth: isDark ? 1 : 0,
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
      width: "100%",
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    menuIcon: {
      marginRight: spacing.md,
      width: 24,
      textAlign: "center",
    },
    menuText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    signOutText: {
      color: colors.danger,
    },
    // Switch styling overrides
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
