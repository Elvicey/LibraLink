import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { NotificationItem, notificationsService } from "../services/users";

export default function Notifications() {
  const router = useRouter();
  const { userId, token } = useAuth();
  const { colors, spacing, typography, isDark } = useTheme();
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || !token) {
      setError("Sign in to view notifications.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsService.getForUser(userId);
      setAlerts(data);
    } catch (e: any) {
      setError(e?.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const getAlertStyle = (type?: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("overdue") || t.includes("fine") || t.includes("danger")) {
      return {
        card: { borderColor: "rgba(220, 38, 38, 0.15)", backgroundColor: isDark ? "rgba(220, 38, 38, 0.05)" : "#fffdfd" },
        title: { color: colors.danger },
        icon: "⚠️",
      };
    }
    if (t.includes("warn")) {
      return {
        card: { borderColor: "rgba(217, 119, 6, 0.15)", backgroundColor: isDark ? "rgba(217, 119, 6, 0.05)" : "#fffdf6" },
        title: { color: colors.warning },
        icon: "🔔",
      };
    }
    return {
      card: { borderColor: "rgba(37, 99, 235, 0.12)", backgroundColor: isDark ? "rgba(37, 99, 235, 0.05)" : "#f9fbff" },
      title: { color: colors.info },
      icon: "ℹ️",
    };
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Notifications
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Recent alerts, library updates, and system notices.
      </Text>

      {loading && <ActivityIndicator color={colors.primary} />}
      {!!error && <Text style={{ color: colors.danger, marginBottom: spacing.md }}>{error}</Text>}

      {!loading && !error && alerts.length === 0 && (
        <Text style={{ color: colors.textMuted }}>No notifications yet.</Text>
      )}

      {alerts.map((alert) => {
        const customStyle = getAlertStyle(alert.type);
        return (
          <Card key={alert.id} style={[styles.card, { marginBottom: spacing.md, borderWidth: 1.5 }, customStyle.card]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderLeft, { gap: spacing.sm }]}>
                <Text style={styles.icon}>{customStyle.icon}</Text>
                <Text style={[styles.cardTitle, customStyle.title]}>
                  {alert.title || "Notice"}
                </Text>
              </View>
              <Text style={[styles.time, { color: colors.textMuted }]}>
                {alert.createdAt ? String(alert.createdAt).slice(0, 10) : ""}
              </Text>
            </View>
            <Text style={[styles.cardValue, { color: colors.text, paddingLeft: spacing.lg + 4 }]}>
              {alert.message}
            </Text>
          </Card>
        );
      })}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "transparent" },
  backButton: { marginBottom: 12, alignSelf: "flex-start" },
  backText: { fontWeight: "700", fontSize: 16 },
  title: { fontWeight: "800" },
  description: { fontWeight: "500" },
  card: {},
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  icon: { fontSize: 16 },
  cardTitle: { fontSize: 15, fontWeight: "700", flexShrink: 1 },
  time: { fontSize: 12 },
  cardValue: { fontSize: 14, lineHeight: 20 },
});
