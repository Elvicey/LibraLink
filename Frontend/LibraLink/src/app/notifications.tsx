import { API_BASE_URL } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";

const ALERTS: { id: string; title: string; message: string; type: string; time: string; icon: string }[] = [];

export default function Notifications() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "danger":
        return {
          card: { borderColor: "rgba(220, 38, 38, 0.15)", backgroundColor: isDark ? "rgba(220, 38, 38, 0.05)" : "#fffdfd" },
          title: { color: colors.danger },
        };
      case "warning":
        return {
          card: { borderColor: "rgba(217, 119, 6, 0.15)", backgroundColor: isDark ? "rgba(217, 119, 6, 0.05)" : "#fffdf6" },
          title: { color: colors.warning },
        };
      default:
        return {
          card: { borderColor: "rgba(37, 99, 235, 0.12)", backgroundColor: isDark ? "rgba(37, 99, 235, 0.05)" : "#f9fbff" },
          title: { color: colors.info },
        };
    }
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

      {ALERTS.map((alert) => {
        const customStyle = getAlertStyle(alert.type);
        return (
          <Card key={alert.id} style={[styles.card, { marginBottom: spacing.md, borderWidth: 1.5 }, customStyle.card]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderLeft, { gap: spacing.sm }]}>
                <Text style={styles.icon}>{alert.icon}</Text>
                <Text style={[styles.cardTitle, customStyle.title]}>
                  {alert.title}
                </Text>
              </View>
              <Text style={[styles.time, { color: colors.textMuted }]}>{alert.time}</Text>
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
  card: {},
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardValue: {
    lineHeight: 20,
    fontSize: 14,
  },
});
