import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";
import { podcastsService, PodcastShow } from "../../services/podcasts";

export default function PodcastsBrowseScreen() {
  const router = useRouter();
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const [shows, setShows] = useState<PodcastShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await podcastsService.listShows();
      setShows(data);
    } catch (e: any) {
      setError(e?.message || "Could not load podcasts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShows();
  }, [loadShows]);

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text }]}>
        Podcasts
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize }]}>
        Library shows and episodes from the LibraLink collection.
      </Text>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <Pressable onPress={loadShows} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.textLight || "#fff", fontWeight: "600" }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && shows.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No published podcasts yet.
        </Text>
      )}

      {!loading && !error && shows.map((show) => (
        <Pressable
          key={show.id}
          style={[styles.showCard, { backgroundColor: isDark ? "rgba(24,28,51,0.85)" : colors.surface, borderColor: colors.border }]}
          onPress={() => router.push(`/podcasts/${show.id}` as any)}
        >
          {show.coverImageUrl ? (
            <Image source={{ uri: show.coverImageUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="mic-outline" size={28} color={colors.primary} />
            </View>
          )}
          <View style={styles.showMeta}>
            <Text style={[styles.showTitle, { color: colors.text }]} numberOfLines={2}>
              {show.title}
            </Text>
            {!!show.hostName && (
              <Text style={[styles.hostName, { color: colors.textMuted }]} numberOfLines={1}>
                Hosted by {show.hostName}
              </Text>
            )}
            {!!show.description && (
              <Text style={[styles.showDesc, { color: colors.textMuted }]} numberOfLines={2}>
                {show.description}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.borderDark} />
        </Pressable>
      ))}
    </ScreenWrapper>
  );
}

function createStyles(
  colors: any,
  spacing: any,
  borderRadius: any,
  typography: any,
  _isDark: boolean
) {
  return StyleSheet.create({
    container: { flexGrow: 1 },
    backButton: { marginBottom: spacing.md, alignSelf: "flex-start" },
    backButtonRow: { flexDirection: "row", alignItems: "center", gap: 2 },
    backText: { fontSize: typography.bodyMedium.fontSize, fontWeight: "600" },
    title: { fontWeight: "700", marginBottom: spacing.xs },
    description: { lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg },
    centered: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.md },
    errorText: { textAlign: "center", fontSize: typography.bodyMedium.fontSize },
    retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
    emptyText: { textAlign: "center", marginTop: spacing.xl },
    showCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      marginBottom: spacing.md,
    },
    cover: { width: 64, height: 64, borderRadius: borderRadius.md },
    coverPlaceholder: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    showMeta: { flex: 1, gap: 2 },
    showTitle: { fontSize: typography.bodyLarge?.fontSize || 16, fontWeight: "600" },
    hostName: { fontSize: typography.bodySmall?.fontSize || 13 },
    showDesc: { fontSize: typography.bodySmall?.fontSize || 13, marginTop: 2 },
  });
}
