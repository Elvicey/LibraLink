import { useLocalSearchParams, useRouter } from "expo-router";
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
import {
  podcastsService,
  PodcastEpisode,
  PodcastShow,
} from "../../services/podcasts";

function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PodcastShowDetailScreen() {
  const router = useRouter();
  const { showId } = useLocalSearchParams<{ showId: string }>();
  const numericId = Number(showId);
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const [show, setShow] = useState<PodcastShow | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(numericId)) {
      setError("Invalid show id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [showData, episodeData] = await Promise.all([
        podcastsService.getShow(numericId),
        podcastsService.listEpisodes(numericId),
      ]);
      setShow(showData);
      setEpisodes(episodeData);
    } catch (e: any) {
      setError(e?.message || "Could not load show.");
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </View>
      </Pressable>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error || "#c0392b" }]}>{error}</Text>
          <Pressable onPress={load} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.textLight || "#fff", fontWeight: "600" }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && show && (
        <>
          <View style={styles.headerRow}>
            {show.coverImageUrl ? (
              <Image source={{ uri: show.coverImageUrl }} style={styles.cover} />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="mic-outline" size={36} color={colors.primary} />
              </View>
            )}
            <View style={styles.headerMeta}>
              <Text style={[styles.title, { color: colors.text, fontSize: typography.titleMedium.fontSize }]}>
                {show.title}
              </Text>
              {!!show.hostName && (
                <Text style={{ color: colors.textMuted }}>Hosted by {show.hostName}</Text>
              )}
            </View>
          </View>

          {!!show.description && (
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {show.description}
            </Text>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Episodes ({episodes.length})
          </Text>

          {episodes.length === 0 && (
            <Text style={{ color: colors.textMuted }}>No published episodes yet.</Text>
          )}

          {episodes.map((ep) => (
            <Pressable
              key={ep.id}
              style={[styles.episodeRow, { borderColor: colors.border, backgroundColor: isDark ? "rgba(24,28,51,0.85)" : colors.surface }]}
              onPress={() => router.push(`/podcasts/episode/${ep.id}` as any)}
            >
              <View style={[styles.epBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  {ep.episodeNumber ?? "·"}
                </Text>
              </View>
              <View style={styles.epMeta}>
                <Text style={[styles.epTitle, { color: colors.text }]} numberOfLines={2}>
                  {ep.title}
                </Text>
                {!!ep.durationSeconds && (
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    {formatDuration(ep.durationSeconds)}
                  </Text>
                )}
              </View>
              <Ionicons name="play-circle-outline" size={28} color={colors.primary} />
            </Pressable>
          ))}
        </>
      )}
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
    centered: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.md },
    errorText: { textAlign: "center" },
    retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
    headerRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
    cover: { width: 96, height: 96, borderRadius: borderRadius.lg },
    coverPlaceholder: {
      width: 96,
      height: 96,
      borderRadius: borderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    headerMeta: { flex: 1, justifyContent: "center", gap: 4 },
    title: { fontWeight: "700" },
    description: {
      fontSize: typography.bodyMedium.fontSize,
      lineHeight: typography.bodyMedium.lineHeight,
      marginBottom: spacing.lg,
    },
    sectionTitle: { fontWeight: "700", fontSize: 16, marginBottom: spacing.md },
    episodeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      marginBottom: spacing.sm,
    },
    epBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    epMeta: { flex: 1, gap: 2 },
    epTitle: { fontWeight: "600", fontSize: 15 },
  });
}
