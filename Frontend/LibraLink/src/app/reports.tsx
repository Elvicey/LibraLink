import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { booksService } from "../services/books";
import { borrowsService } from "../services/borrows";
import { fineAmount, finesService } from "../services/fines";
import { notificationsService } from "../services/users";
import { inferSubject } from "../services/books";

export default function ReportsScreen() {
  const router = useRouter();
  const { userId, token, firstName } = useAuth();
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogueCount, setCatalogueCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [bySubject, setBySubject] = useState<Record<string, number>>({});
  const [activeLoans, setActiveLoans] = useState(0);
  const [overdueLoans, setOverdueLoans] = useState(0);
  const [borrowHistory, setBorrowHistory] = useState(0);
  const [unpaidFines, setUnpaidFines] = useState(0);
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [notifications, setNotifications] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const books = await booksService.list();
      setCatalogueCount(books.length);
      setAvailableCount(books.filter((b) => (b.availableCopies ?? 0) > 0).length);
      const subjectCounts: Record<string, number> = {
        Science: 0,
        Computing: 0,
        Economics: 0,
        Literature: 0,
        General: 0,
      };
      books.forEach((b) => {
        const subject = inferSubject(b);
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      });
      setBySubject(subjectCounts);

      if (userId && token) {
        const [current, history, fines, notifs] = await Promise.all([
          borrowsService.getCurrent(userId).catch(() => []),
          borrowsService.getHistory(userId).catch(() => []),
          finesService.getForUser(userId).catch(() => []),
          notificationsService.getForUser(userId).catch(() => []),
        ]);
        setActiveLoans(current.length);
        setOverdueLoans(current.filter((b) => (b.status || "").toUpperCase() === "OVERDUE").length);
        setBorrowHistory(history.length);
        const unpaid = fines.filter((f) => (f.status || "").toUpperCase() !== "PAID");
        setUnpaidFines(unpaid.length);
        setUnpaidTotal(unpaid.reduce((sum, f) => sum + fineAmount(f), 0));
        setNotifications(notifs.length);
      }
    } catch (e: any) {
      setError(e?.message || "Could not load report.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const generatedAt = useMemo(() => new Date().toLocaleString(), [loading]);

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { color: colors.text, fontSize: typography.titleMedium.fontSize }]}>
        Library Report
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {firstName ? `${firstName}'s activity summary` : "Your LibraLink activity summary"} · {generatedAt}
      </Text>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />}
      {!!error && <Text style={{ color: colors.danger, marginBottom: spacing.md }}>{error}</Text>}

      {!loading && !error && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Catalogue overview</Text>
          <View style={styles.grid}>
            <Card style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: colors.primary }]}>{catalogueCount}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total books</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: colors.success }]}>{availableCount}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Available now</Text>
            </Card>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Books by subject</Text>
          {Object.entries(bySubject)
            .filter(([key]) => key !== "General" || (bySubject.General || 0) > 0)
            .map(([subject, count]) => (
              <Card key={subject} style={styles.rowCard}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{subject}</Text>
                <Text style={[styles.rowValue, { color: colors.primary }]}>{count}</Text>
              </Card>
            ))}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your borrowing</Text>
          <View style={styles.grid}>
            <Card style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: colors.primary }]}>{activeLoans}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Active loans</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: colors.danger }]}>{overdueLoans}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Overdue</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{borrowHistory}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>All records</Text>
            </Card>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fines & alerts</Text>
          <Card style={styles.rowCard}>
            <View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Unpaid fines</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>{unpaidFines} open fine(s)</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.danger }]}>
              GHS {unpaidTotal.toFixed(2)}
            </Text>
          </Card>
          <Card style={styles.rowCard}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Notifications</Text>
            <Text style={[styles.rowValue, { color: colors.primary }]}>{notifications}</Text>
          </Card>

          <Pressable
            style={[styles.cta, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/pay-fines" as any)}
          >
            <Text style={{ color: colors.textLight, fontWeight: "700" }}>Go to Pay Fines</Text>
          </Pressable>
          <Pressable
            style={[styles.ctaOutline, { borderColor: colors.border }]}
            onPress={load}
          >
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Refresh report</Text>
          </Pressable>
        </>
      )}
    </ScreenWrapper>
  );
}

function createStyles(colors: any, spacing: any, borderRadius: any, typography: any, _isDark: boolean) {
  return StyleSheet.create({
    container: { flexGrow: 1 },
    backButton: { marginBottom: spacing.md, alignSelf: "flex-start" },
    backRow: { flexDirection: "row", alignItems: "center", gap: 2 },
    backText: { fontWeight: "600", fontSize: 16 },
    title: { fontWeight: "800", marginBottom: spacing.xs },
    subtitle: { marginBottom: spacing.lg, lineHeight: 20 },
    sectionTitle: { fontWeight: "700", fontSize: 16, marginTop: spacing.md, marginBottom: spacing.sm },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
    metricCard: { flexGrow: 1, minWidth: "30%", alignItems: "center", paddingVertical: spacing.md },
    metricValue: { fontSize: 24, fontWeight: "800" },
    metricLabel: { fontSize: 12, marginTop: 4, textAlign: "center" },
    rowCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
      paddingVertical: spacing.md,
    },
    rowTitle: { fontWeight: "700", fontSize: 15 },
    rowValue: { fontWeight: "800", fontSize: 16 },
    cta: {
      marginTop: spacing.lg,
      alignItems: "center",
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
    },
    ctaOutline: {
      marginTop: spacing.sm,
      marginBottom: spacing.xxl,
      alignItems: "center",
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
    },
  });
}
