import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { NotificationItem, notificationsService } from "../services/users";

type Filter = "all" | "unread";

type Tone = "danger" | "warning" | "success" | "info";

/** Maps a backend notification type onto an icon, a colour tone and a destination. */
function describe(type?: string): { icon: string; tone: Tone; route?: string } {
  const t = (type || "").toLowerCase();
  if (t.includes("fine") || t.includes("payment")) {
    return { icon: "cash-outline", tone: "danger", route: "/pay-fines" };
  }
  if (t.includes("overdue")) {
    return { icon: "alert-circle-outline", tone: "danger", route: "/borrowed" };
  }
  if (t.includes("due") || t.includes("renew") || t.includes("warn")) {
    return { icon: "time-outline", tone: "warning", route: "/borrowed" };
  }
  if (t.includes("ready") || t.includes("pickup") || t.includes("reserv")) {
    return { icon: "bag-check-outline", tone: "success", route: "/pickup" };
  }
  if (t.includes("return")) {
    return { icon: "checkmark-circle-outline", tone: "success", route: "/borrowed" };
  }
  return { icon: "information-circle-outline", tone: "info" };
}

/** "Just now" / "3h ago" / "Yesterday" / "12 Mar" — falls back to the raw string. */
function relativeTime(value?: string): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return String(value).slice(0, 10);

  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(then).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function Notifications() {
  const router = useRouter();
  const { userId, token } = useAuth();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, isDark);

  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || !token) {
      setError("Sign in to view notifications.");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await notificationsService.getForUser(userId);
      // Newest first, regardless of the order the backend returns.
      setAlerts(
        [...data].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
      );
    } catch (e: any) {
      setError(e?.message || "Could not load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts]);

  const visible = useMemo(
    () => (filter === "unread" ? alerts.filter((a) => !a.isRead) : alerts),
    [alerts, filter]
  );

  const toneStyles = (tone: Tone) => {
    if (tone === "danger") return { bg: colors.dangerLight, fg: colors.danger };
    if (tone === "warning") return { bg: colors.warningLight, fg: colors.warning };
    if (tone === "success") return { bg: colors.successLight, fg: colors.success };
    return { bg: colors.infoLight, fg: colors.info };
  };

  /** Optimistic — the row updates immediately and reverts if the call fails. */
  const markRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    setAlerts((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, isRead: true } : a))
    );
    try {
      await notificationsService.markRead(item.id);
    } catch {
      setAlerts((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, isRead: false } : a))
      );
    }
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.isRead);
    if (unread.length === 0) return;
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    try {
      await Promise.all(unread.map((a) => notificationsService.markRead(a.id)));
    } catch {
      // Re-fetch so the list reflects whatever actually persisted.
      load();
    }
  };

  const openItem = (item: NotificationItem) => {
    markRead(item);
    const { route } = describe(item.type);
    if (route) router.push(route as any);
  };

  const header = (
    <>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAll}>Mark all</Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      <Text style={styles.subtitle}>
        {unreadCount > 0
          ? `${unreadCount} unread ${unreadCount === 1 ? "alert" : "alerts"}`
          : "You're all caught up"}
      </Text>

      <View style={styles.segment}>
        {(["all", "unread"] as Filter[]).map((key) => (
          <Pressable
            key={key}
            style={[styles.segmentItem, filter === key && styles.segmentItemActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.segmentText, filter === key && styles.segmentTextActive]}>
              {key === "all" ? `All (${alerts.length})` : `Unread (${unreadCount})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  return (
    <ScreenWrapper style={styles.screen}>
      <FlatList
        data={loading ? [] : visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.huge }} />
          ) : error ? null : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={filter === "unread" ? "checkmark-done-outline" : "notifications-off-outline"}
                  size={30}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === "unread" ? "Nothing unread" : "No notifications yet"}
              </Text>
              <Text style={styles.emptyBody}>
                {filter === "unread"
                  ? "Every alert has been read."
                  : "Due dates, holds and fines will show up here."}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const meta = describe(item.type);
          const tone = toneStyles(meta.tone);
          return (
            <Pressable
              style={[styles.row, !item.isRead && styles.rowUnread]}
              onPress={() => openItem(item)}
            >
              <View style={[styles.iconTile, { backgroundColor: tone.bg }]}>
                <Ionicons name={meta.icon as any} size={20} color={tone.fg} />
              </View>

              <View style={styles.rowText}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rowTitle, !item.isRead && styles.rowTitleUnread]} numberOfLines={1}>
                    {item.title || "Notice"}
                  </Text>
                  <Text style={styles.rowTime}>{relativeTime(item.createdAt)}</Text>
                </View>
                <Text style={styles.rowMessage} numberOfLines={3}>
                  {item.message}
                </Text>
                {!!meta.route && (
                  <View style={styles.rowAction}>
                    <Text style={[styles.rowActionText, { color: tone.fg }]}>
                      {meta.route === "/pay-fines"
                        ? "Pay now"
                        : meta.route === "/pickup"
                          ? "View pickup"
                          : "View loans"}
                    </Text>
                    <Ionicons name="chevron-forward" size={13} color={tone.fg} />
                  </View>
                )}
              </View>

              {!item.isRead && <View style={styles.unreadDot} />}
            </Pressable>
          );
        }}
      />
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.huge,
      flexGrow: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    markAll: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 13,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      marginBottom: spacing.lg,
    },
    segment: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      borderRadius: borderRadius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      alignItems: "center",
    },
    segmentItemActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textMuted,
    },
    segmentTextActive: {
      color: colors.textLight,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    rowUnread: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: {
      flex: 1,
    },
    rowTop: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: 3,
    },
    rowTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    rowTitleUnread: {
      fontWeight: "800",
    },
    rowTime: {
      fontSize: 11,
      color: colors.textMuted,
    },
    rowMessage: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
    rowAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      marginTop: spacing.sm,
    },
    rowActionText: {
      fontSize: 12,
      fontWeight: "700",
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginTop: spacing.sm,
    },
    emptyState: {
      alignItems: "center",
      paddingTop: spacing.huge,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    emptyBody: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
      paddingHorizontal: spacing.xl,
    },
  });
