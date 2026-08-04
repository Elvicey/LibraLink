import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../constants/theme";

interface ExploreSheetProps {
  visible: boolean;
  onClose: () => void;
}

const DESTINATIONS = [
  {
    route: "/ai",
    icon: "sparkles-outline",
    title: "Ask Libra",
    subtitle: "AI search and study help",
    tint: "violet",
  },
  {
    route: "/exam-mode",
    icon: "school-outline",
    title: "AI Exam Mode",
    subtitle: "Practice quizzes from any topic",
    tint: "warning",
  },
  {
    route: "/audio",
    icon: "headset-outline",
    title: "Audiobooks",
    subtitle: "Resume where you left off",
    tint: "primary",
  },
  {
    route: "/borrowed",
    icon: "book-outline",
    title: "Borrowed books",
    subtitle: "Active loans, history and fines",
    tint: "primary",
  },
  {
    route: "/pickup",
    icon: "bag-handle-outline",
    title: "Pickup scheduler",
    subtitle: "Collect your reserved books",
    tint: "success",
  },
] as const;

export default function ExploreSheet({ visible, onClose }: ExploreSheetProps) {
  const router = useRouter();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, isDark);

  // The same tap that opens the sheet can land on the backdrop as it mounts and
  // dismiss it again. Only accept backdrop taps once the sheet is fully shown.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReady(false);
      return;
    }
    // Fallback for platforms where onShow does not fire.
    const timer = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(timer);
  }, [visible]);

  const tintFor = (tint: string) => {
    if (tint === "violet") {
      return {
        bg: isDark ? "rgba(139, 92, 246, 0.16)" : "rgba(139, 92, 246, 0.08)",
        fg: isDark ? "#a78bfa" : "#8b5cf6",
      };
    }
    if (tint === "warning") {
      return { bg: colors.warningLight, fg: colors.warning };
    }
    if (tint === "success") {
      return { bg: colors.successLight, fg: colors.success };
    }
    return { bg: colors.primaryLight, fg: colors.primary };
  };

  const go = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setReady(true)}
    >
      <Pressable style={styles.backdrop} onPress={() => ready && onClose()}>
        {/* Stop taps inside the sheet from closing it */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>Explore</Text>

          {DESTINATIONS.map((item, index) => {
            const tint = tintFor(item.tint);
            return (
              <Pressable
                key={item.route}
                style={[styles.row, index > 0 && styles.rowDivider]}
                onPress={() => go(item.route)}
              >
                <View style={[styles.iconTile, { backgroundColor: tint.bg }]}>
                  <Ionicons name={item.icon as any} size={20} color={tint.fg} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.huge,
      borderTopRightRadius: borderRadius.huge,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.huge,
      borderTopWidth: isDark ? 1 : 0,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "transparent",
    },
    grabber: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderDark,
      marginBottom: spacing.md,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    iconTile: {
      width: 42,
      height: 42,
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    rowSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
