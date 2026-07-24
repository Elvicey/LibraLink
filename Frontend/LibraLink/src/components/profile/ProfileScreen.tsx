import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import {
  AUTH_LIBRARY_OVERLAY,
  AuthLibraryBackground,
} from "../auth/AuthLibraryBackground";
import { loginColors } from "../../constants/loginTheme";
import { useTheme } from "../../constants/theme";

/** Light scrim so dark text / light cards stay readable over the library photo. */
const LIGHT_LIBRARY_OVERLAY = "rgba(240, 245, 250, 0.78)";

const ACCENT = loginColors.teal;
const ACCENT_DARK = loginColors.tealDark;
const LOGOUT_RED = loginColors.error;
const SUCCESS = loginColors.teal;

type ProfileColors = {
  bgDeep: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderDefault: string;
  iconBoxBg: string;
  roleBadgeBg: string;
  switchTrackOff: string;
  switchTrackOn: string;
  switchThumbOn: string;
  chipBg: string;
  chipText: string;
  chipActiveBg: string;
  chipActiveText: string;
  avatarBg: string;
  avatarStroke: string;
  avatarText: string;
  addBadgeText: string;
  accent: string;
};

function getProfileColors(isDark: boolean): ProfileColors {
  if (isDark) {
    return {
      bgDeep: loginColors.bgDeep,
      bgCard: loginColors.bgCard,
      textPrimary: loginColors.textPrimary,
      textSecondary: loginColors.textSecondary,
      textMuted: loginColors.textMuted,
      borderDefault: loginColors.borderDefault,
      iconBoxBg: "rgba(93, 202, 165, 0.12)",
      roleBadgeBg: "rgba(93, 202, 165, 0.18)",
      switchTrackOff: "rgba(255,255,255,0.18)",
      switchTrackOn: ACCENT_DARK,
      switchThumbOn: ACCENT,
      chipBg: "rgba(255,255,255,0.08)",
      chipText: loginColors.textSecondary,
      chipActiveBg: ACCENT,
      chipActiveText: ACCENT_DARK,
      avatarBg: loginColors.bgLogoMark,
      avatarStroke: ACCENT,
      avatarText: ACCENT,
      addBadgeText: ACCENT_DARK,
      accent: ACCENT,
    };
  }
  return {
    bgDeep: "#F0F5FA",
    bgCard: "rgba(255, 255, 255, 0.92)",
    textPrimary: loginColors.bgDeep,
    textSecondary: "rgba(10, 22, 40, 0.62)",
    textMuted: "rgba(10, 22, 40, 0.42)",
    borderDefault: "rgba(10, 22, 40, 0.10)",
    iconBoxBg: "rgba(93, 202, 165, 0.14)",
    roleBadgeBg: "rgba(93, 202, 165, 0.18)",
    switchTrackOff: "rgba(10, 22, 40, 0.16)",
    switchTrackOn: ACCENT_DARK,
    switchThumbOn: ACCENT,
    chipBg: "rgba(10, 22, 40, 0.06)",
    chipText: "rgba(10, 22, 40, 0.55)",
    chipActiveBg: ACCENT,
    chipActiveText: ACCENT_DARK,
    avatarBg: loginColors.bgDeep,
    avatarStroke: ACCENT,
    avatarText: ACCENT,
    addBadgeText: ACCENT_DARK,
    accent: ACCENT,
  };
}

const UserAvatarIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const EmailIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <Rect x="2" y="4" width="20" height="16" rx="2" />
    <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Svg>
);

const PhoneIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const CardIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Path d="M2 10h20" />
  </Svg>
);

const BookIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
);

const LockIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <Rect x="3" y="11" width="18" height="11" rx="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const ThemeIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <Circle cx="12" cy="12" r="4" />
    <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Svg>
);

const BellIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const LogoutIcon = ({ stroke = LOGOUT_RED }: { stroke?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 17l5-5-5-5" />
    <Path d="M21 12H9" />
  </Svg>
);

const PencilIcon = ({ stroke }: { stroke: string }) => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 20h9" />
    <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </Svg>
);

export interface ProfileUserData {
  name: string;
  initials: string | null;
  role: string;
  emailVerified: boolean;
  booksBorrowed: number | string;
  activeHolds: number | string;
  daysActive: number | string;
  email: string;
  phone: string;
  studentId: string;
  programme: string;
  indexNumber: string;
  institution: string;
  lastPasswordChange: string;
}

const EMPTY_USER: ProfileUserData = {
  name: "No name set",
  initials: null,
  role: "Student",
  emailVerified: false,
  booksBorrowed: "-",
  activeHolds: "-",
  daysActive: "-",
  email: "Not set",
  phone: "Not set",
  studentId: "Not set",
  programme: "Not set",
  indexNumber: "Not set",
  institution: "Not linked",
  lastPasswordChange: "Update your credentials",
};

interface ProfileScreenProps {
  isPopulated?: boolean;
  user?: Partial<ProfileUserData> | null;
  onEditProfile?: () => void;
  onLogout?: () => void;
  onChangePassword?: () => void;
}

export default function ProfileScreen({
  isPopulated = true,
  user: userOverrides,
  onEditProfile,
  onLogout,
  onChangePassword,
}: ProfileScreenProps) {
  const { isDark, themeMode, setThemeMode } = useTheme();
  const c = useMemo(() => getProfileColors(isDark), [isDark]);
  const styles = useMemo(() => createStyles(c), [c]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(isPopulated);

  const selectedTheme: "light" | "dark" =
    themeMode === "dark" || (themeMode === "system" && isDark) ? "dark" : "light";

  const user: ProfileUserData = isPopulated
    ? { ...EMPTY_USER, ...userOverrides, emailVerified: userOverrides?.emailVerified ?? true }
    : EMPTY_USER;

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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Account</Text>
          <TouchableOpacity style={styles.logoutHeaderBtn} onPress={onLogout} activeOpacity={0.8}>
            <LogoutIcon />
            <Text style={styles.logoutHeaderText}>Log out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={onEditProfile}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            {user.initials ? (
              <Text style={styles.avatarText}>{user.initials}</Text>
            ) : (
              <UserAvatarIcon stroke={c.avatarStroke} />
            )}
            <View style={styles.addBadge}>
              <PencilIcon stroke={c.addBadgeText} />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>

          {isPopulated ? (
            <View style={styles.verifiedRow}>
              <View style={styles.greenDot} />
              <Text style={styles.verifiedText}>Email verified</Text>
            </View>
          ) : (
            <Text style={styles.emptySubtitle}>Complete your profile to get started</Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.booksBorrowed}</Text>
            <Text style={styles.statLabel}>Books{"\n"}borrowed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.activeHolds}</Text>
            <Text style={styles.statLabel}>Active holds</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.daysActive}</Text>
            <Text style={styles.statLabel}>Days active</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PERSONAL INFO</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <EmailIcon stroke={c.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={[styles.infoValue, !isPopulated && styles.textMuted]}>{user.email}</Text>
            </View>
            {isPopulated && user.emailVerified ? <View style={styles.smallGreenDot} /> : null}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <PhoneIcon stroke={c.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={[styles.infoValue, !isPopulated && styles.textMuted]}>{user.phone}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.iconBox}>
              <CardIcon stroke={c.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Student ID</Text>
              <Text style={[styles.infoValue, !isPopulated && styles.textMuted]}>{user.studentId}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>STUDENT DETAILS</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <BookIcon stroke={c.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Programme</Text>
              <Text style={[styles.infoValue, !isPopulated && styles.textMuted]}>{user.programme}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <CardIcon stroke={c.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Index number</Text>
              <Text style={[styles.infoValue, !isPopulated && styles.textMuted]}>{user.indexNumber}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.iconBox}>
              <BookIcon stroke={c.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Institution</Text>
              <Text style={[styles.infoValue, !isPopulated && styles.textMuted]}>{user.institution}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <BellIcon stroke={c.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoValueBold}>Notifications</Text>
              <Text style={styles.infoSubText}>Due dates, reservations</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: c.switchTrackOff, true: c.switchTrackOn }}
              thumbColor={notificationsEnabled ? c.switchThumbOn : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity style={styles.infoRow} activeOpacity={0.7} onPress={onChangePassword}>
            <View style={styles.iconBox}>
              <LockIcon stroke={c.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoValueBold}>Change password</Text>
              <Text style={styles.infoSubText}>{user.lastPasswordChange}</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.iconBox}>
              <ThemeIcon stroke={c.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoValueBold}>Theme</Text>
              <Text style={styles.infoSubText}>Light or dark appearance</Text>
            </View>
            <View style={styles.themeChips}>
              <TouchableOpacity
                style={[styles.themeChip, selectedTheme === "light" && styles.themeChipActive]}
                onPress={() => setThemeMode("light")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    selectedTheme === "light" && styles.themeChipTextActive,
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeChip, selectedTheme === "dark" && styles.themeChipActive]}
                onPress={() => setThemeMode("dark")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    selectedTheme === "dark" && styles.themeChipTextActive,
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(c: ProfileColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bgDeep,
    },
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: c.textPrimary,
    },
    editBtn: {
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 16,
    },
    editBtnText: {
      color: c.accent,
      fontSize: 13,
      fontWeight: "600",
    },
    logoutHeaderBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: LOGOUT_RED,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 14,
    },
    logoutHeaderText: {
      color: LOGOUT_RED,
      fontSize: 13,
      fontWeight: "600",
    },
    profileHeader: {
      alignItems: "center",
      marginBottom: 24,
    },
    avatarWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.avatarBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.accent,
      position: "relative",
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 26,
      fontWeight: "700",
      color: c.avatarText,
    },
    addBadge: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    addBadgeText: {
      fontSize: 14,
      fontWeight: "bold",
      color: c.addBadgeText,
      lineHeight: 16,
    },
    userName: {
      fontSize: 20,
      fontWeight: "700",
      color: c.textPrimary,
      marginBottom: 6,
    },
    roleBadge: {
      backgroundColor: c.roleBadgeBg,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 8,
    },
    roleText: {
      color: c.accent,
      fontSize: 12,
      fontWeight: "600",
    },
    verifiedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    greenDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: SUCCESS,
    },
    verifiedText: {
      color: SUCCESS,
      fontSize: 12,
    },
    emptySubtitle: {
      color: c.textSecondary,
      fontSize: 12,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.bgCard,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: "center",
      borderWidth: 0.5,
      borderColor: c.borderDefault,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: "700",
      color: c.accent,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 14,
    },
    sectionCard: {
      backgroundColor: c.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 0.5,
      borderColor: c.borderDefault,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: c.accent,
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: c.borderDefault,
      gap: 12,
    },
    iconBox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: c.iconBoxBg,
      alignItems: "center",
      justifyContent: "center",
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 11,
      color: c.textSecondary,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: "600",
      color: c.textPrimary,
    },
    infoValueBold: {
      fontSize: 14,
      fontWeight: "600",
      color: c.textPrimary,
    },
    infoSubText: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 1,
    },
    smallGreenDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: SUCCESS,
    },
    textMuted: {
      color: c.textMuted,
      fontWeight: "normal",
    },
    themeChips: {
      flexDirection: "row",
      gap: 6,
    },
    themeChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: c.chipBg,
    },
    themeChipActive: {
      backgroundColor: c.chipActiveBg,
    },
    themeChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: c.chipText,
    },
    themeChipTextActive: {
      color: c.chipActiveText,
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.bgCard,
      borderRadius: 12,
      height: 48,
      gap: 8,
      borderWidth: 0.5,
      borderColor: c.borderDefault,
      marginTop: 8,
    },
    logoutText: {
      color: LOGOUT_RED,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
