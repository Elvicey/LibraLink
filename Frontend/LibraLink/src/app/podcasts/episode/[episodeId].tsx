import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import ScreenWrapper from "../../../components/common/ScreenWrapper";
import { useTheme } from "../../../constants/theme";
import {
  getEpisodeNarrationText,
  isPlaceholderMusicUrl,
  LinkedBook,
  podcastsService,
  PodcastEpisode,
} from "../../../services/podcasts";

function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PodcastEpisodeScreen() {
  const router = useRouter();
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>();
  const numericId = Number(episodeId);
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const [episode, setEpisode] = useState<PodcastEpisode | null>(null);
  const [book, setBook] = useState<LinkedBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(numericId)) {
      setError("Invalid episode id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await podcastsService.getEpisode(numericId);
      setEpisode(data);
      if (data.bookId != null) {
        try {
          setBook(await podcastsService.getBook(data.bookId));
        } catch {
          setBook(null);
        }
      } else {
        setBook(null);
      }
    } catch (e: any) {
      setError(e?.message || "Could not load episode.");
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    load();
    return () => {
      Speech.stop();
    };
  }, [load]);

  const handlePlayNarration = () => {
    setPlayError(null);
    if (!episode) return;

    const text = getEpisodeNarrationText(episode, book);
    if (!text) {
      setPlayError("This episode has no book discussion script to narrate.");
      return;
    }

    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    Speech.speak(text, {
      language: "en-US",
      rate: 0.92,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => {
        setSpeaking(false);
        setPlayError("Could not start narration on this device.");
      },
    });
  };

  const handleOpenExternalAudio = async () => {
    setPlayError(null);
    if (!episode?.audioUrl || isPlaceholderMusicUrl(episode.audioUrl)) {
      setPlayError("No external book recording is attached to this episode.");
      return;
    }
    try {
      await Linking.openURL(episode.audioUrl);
    } catch {
      setPlayError("Failed to open external audio.");
    }
  };

  const hasRealExternalAudio =
    !!episode?.audioUrl && !isPlaceholderMusicUrl(episode.audioUrl);

  const authorName = book?.authors?.[0]?.fullName;

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
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <Pressable onPress={load} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.textLight || "#fff", fontWeight: "600" }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && episode && (
        <>
          <View style={[styles.artwork, { backgroundColor: isDark ? "rgba(24,28,51,0.85)" : colors.surface, borderColor: colors.border }]}>
            <View style={[styles.artworkInner, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="book-outline" size={48} color={colors.primary} />
            </View>
          </View>

          {episode.episodeNumber != null && (
            <Text style={[styles.epLabel, { color: colors.primary }]}>
              Episode {episode.episodeNumber}
            </Text>
          )}

          <Text style={[styles.title, { color: colors.text, fontSize: typography.titleMedium.fontSize }]}>
            {episode.title}
          </Text>

          {book ? (
            <View style={[styles.bookChip, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="library-outline" size={16} color={colors.primary} />
              <Text style={[styles.bookChipText, { color: colors.primary }]}>
                About {book.title}{authorName ? ` · ${authorName}` : ""}
              </Text>
            </View>
          ) : (
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              General library episode
            </Text>
          )}

          <Text style={[styles.meta, { color: colors.textMuted }]}>
            About {formatDuration(episode.durationSeconds)} spoken
          </Text>

          {!!episode.description && (
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {episode.description}
            </Text>
          )}

          <Pressable
            style={[styles.playBtn, { backgroundColor: colors.primary }]}
            onPress={handlePlayNarration}
          >
            <Ionicons
              name={speaking ? "stop" : "play"}
              size={22}
              color={colors.textLight || "#fff"}
            />
            <Text style={[styles.playText, { color: colors.textLight || "#fff" }]}>
              {speaking ? "Stop narration" : "Play book discussion"}
            </Text>
          </Pressable>

          {hasRealExternalAudio && (
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={handleOpenExternalAudio}
            >
              <Ionicons name="open-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                Open external recording
              </Text>
            </Pressable>
          )}

          {!!playError && (
            <Text style={[styles.playError, { color: colors.danger }]}> 
              {playError}
            </Text>
          )}
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
    artwork: {
      alignSelf: "center",
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    artworkInner: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    epLabel: { fontWeight: "700", marginBottom: spacing.xs, textAlign: "center" },
    title: { fontWeight: "700", textAlign: "center", marginBottom: spacing.sm },
    bookChip: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.sm,
      maxWidth: "100%",
    },
    bookChipText: { fontWeight: "600", fontSize: 13, flexShrink: 1 },
    meta: { textAlign: "center", marginBottom: spacing.md, fontSize: 13 },
    description: {
      fontSize: typography.bodyMedium.fontSize,
      lineHeight: typography.bodyMedium.lineHeight,
      textAlign: "left",
      marginBottom: spacing.xl,
    },
    playBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
    },
    secondaryBtn: {
      marginTop: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
    },
    playText: { fontWeight: "700", fontSize: 16 },
    playError: { textAlign: "center", marginTop: spacing.md },
  });
}
