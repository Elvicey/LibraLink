import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { audioService, AudioBookTrackResponse } from "../services/audio";

const SPEEDS = [1.0, 1.25, 1.5, 2.0];
const SKIP_SECONDS = 15;
/**
 * Module-level so the reference is stable. Passing an object literal here
 * makes useAudioPlayer rebuild the player on every render, which re-emits
 * status, which renders again — an infinite loop that wedges the screen.
 */
const PLAYER_OPTIONS = { updateInterval: 500 };

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatSize(megabytes?: number): string | null {
  if (!megabytes || megabytes <= 0) return null;
  if (megabytes < 1) return `${Math.round(megabytes * 1024)} KB`;
  return `${megabytes.toFixed(1)} MB`;
}

export default function AudioBookPlayer() {
  const router = useRouter();
  const { userId } = useAuth();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, isDark);

  const [tracks, setTracks] = useState<AudioBookTrackResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [barWidth, setBarWidth] = useState(0);

  const currentTrack = tracks[currentIndex];
  const player = useAudioPlayer(currentTrack?.audioUrl ?? null, PLAYER_OPTIONS);
  const status = useAudioPlayerStatus(player);

  // Guards the one-time seek to the saved position each time a track loads.
  const restoredForTrack = useRef<number | null>(null);

  // Play through the iOS silent switch — otherwise a muted phone looks broken.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    audioService
      .getAllTracks()
      .then((data) => setTracks(data ?? []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  const progressUserId = userId ?? 1;

  // Resume where the student left off, once the new track reports as loaded.
  useEffect(() => {
    if (!currentTrack || !status.isLoaded) return;
    if (restoredForTrack.current === currentTrack.id) return;
    restoredForTrack.current = currentTrack.id;

    audioService
      .getProgress(currentTrack.id, progressUserId)
      .then((saved) => {
        const position = saved?.currentPositionSeconds ?? 0;
        if (position > 0) player.seekTo(position);
      })
      .catch(() => {});
  }, [currentTrack, status.isLoaded, player, progressUserId]);

  // The native player is released before unmount cleanup runs, so reading
  // player.currentTime there throws. Mirror the position into a ref instead.
  const positionRef = useRef(0);
  useEffect(() => {
    if (status.currentTime > 0) positionRef.current = status.currentTime;
  }, [status.currentTime]);

  const saveProgress = useCallback(
    (completed = false) => {
      if (!currentTrack) return;
      audioService
        .saveProgress(currentTrack.id, progressUserId, Math.floor(positionRef.current), completed)
        .catch(() => {});
    },
    [currentTrack, progressUserId]
  );

  // Checkpoint every 15s of playback so a crash loses very little.
  useEffect(() => {
    if (!status.playing) return;
    const timer = setInterval(() => saveProgress(false), 15000);
    return () => clearInterval(timer);
  }, [status.playing, saveProgress]);

  // Persist the final position on real unmount only. Held in a ref so that
  // changing tracks does not re-run the teardown. The ref is updated in an
  // effect, never during render — React Compiler is enabled on this project.
  const saveOnExit = useRef(saveProgress);
  useEffect(() => {
    saveOnExit.current = saveProgress;
  }, [saveProgress]);
  useEffect(() => () => saveOnExit.current(false), []);

  useEffect(() => {
    if (status.didJustFinish) saveProgress(true);
  }, [status.didJustFinish, saveProgress]);

  const duration = status.duration || currentTrack?.durationSeconds || 0;
  const position = status.currentTime || 0;
  const progressPercent = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
      saveProgress(false);
    } else {
      player.play();
    }
  };

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    player.setPlaybackRate(SPEEDS[next]);
  };

  const skip = (seconds: number) => {
    const target = Math.min(
      Math.max(0, player.currentTime + seconds),
      duration || player.currentTime
    );
    player.seekTo(target);
  };

  const selectTrack = (index: number) => {
    if (index === currentIndex) return;
    saveProgress(false);
    player.pause();
    restoredForTrack.current = null;
    positionRef.current = 0;
    setCurrentIndex(index);
  };

  const onBarLayout = (event: LayoutChangeEvent) =>
    setBarWidth(event.nativeEvent.layout.width);

  const seekFromTap = (locationX: number) => {
    if (!barWidth || !duration) return;
    const ratio = Math.min(1, Math.max(0, locationX / barWidth));
    player.seekTo(ratio * duration);
  };

  const sizeLabel = formatSize(currentTrack?.fileSizeMb);

  if (loading) {
    return (
      <ScreenWrapper style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!currentTrack) {
    return (
      <ScreenWrapper style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Audiobooks</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons name="headset-outline" size={30} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No audio tracks yet</Text>
          <Text style={styles.emptyBody}>
            Lecture summaries and audio textbooks will appear here once the library
            publishes them.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Audiobooks</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Artwork */}
        <View style={styles.artwork}>
          {currentTrack.coverImageUrl ? (
            <Image
              source={{ uri: currentTrack.coverImageUrl }}
              style={styles.artworkImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="headset" size={56} color={colors.primary} />
          )}
        </View>

        {/* Metadata */}
        <View style={styles.meta}>
          {!!currentTrack.courseCode && (
            <View style={styles.coursePill}>
              <Text style={styles.coursePillText}>{currentTrack.courseCode}</Text>
            </View>
          )}
          <Text style={styles.trackTitle} numberOfLines={2}>
            {currentTrack.title}
          </Text>
          <Text style={styles.trackAuthor} numberOfLines={1}>
            {currentTrack.author}
          </Text>
        </View>

        {/* Scrubber */}
        <Pressable
          style={styles.barTouchable}
          onLayout={onBarLayout}
          onPress={(event) => seekFromTap(event.nativeEvent.locationX)}
        >
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${progressPercent}%` }]} />
            <View style={[styles.barThumb, { left: `${progressPercent}%` }]} />
          </View>
        </Pressable>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>
            {status.isBuffering && !status.playing ? "Buffering…" : formatTime(duration)}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable style={styles.smallButton} onPress={cycleSpeed}>
            <Text style={styles.speedText}>{SPEEDS[speedIndex].toFixed(2).replace(/0$/, "")}x</Text>
          </Pressable>

          <Pressable style={styles.smallButton} onPress={() => skip(-SKIP_SECONDS)}>
            <Ionicons name="play-back" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            style={[styles.playButton, !status.isLoaded && styles.playButtonDisabled]}
            onPress={togglePlayback}
            disabled={!status.isLoaded}
          >
            {!status.isLoaded ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Ionicons
                name={status.playing ? "pause" : "play"}
                size={26}
                color={colors.textLight}
                style={!status.playing && { marginLeft: 3 }}
              />
            )}
          </Pressable>

          <Pressable style={styles.smallButton} onPress={() => skip(SKIP_SECONDS)}>
            <Ionicons name="play-forward" size={20} color={colors.text} />
          </Pressable>

          <View
            style={[
              styles.smallButton,
              currentTrack.isAvailableOffline && { borderColor: colors.success },
            ]}
          >
            <Ionicons
              name={currentTrack.isAvailableOffline ? "cloud-done-outline" : "cloud-outline"}
              size={20}
              color={currentTrack.isAvailableOffline ? colors.success : colors.textMuted}
            />
          </View>
        </View>

        {/* Offline status */}
        <View style={styles.infoCard}>
          <Ionicons
            name={currentTrack.isAvailableOffline ? "checkmark-circle" : "wifi-outline"}
            size={19}
            color={currentTrack.isAvailableOffline ? colors.success : colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>
              {currentTrack.isAvailableOffline ? "Available offline" : "Streaming"}
            </Text>
            <Text style={styles.infoBody}>
              {currentTrack.isAvailableOffline
                ? `Saved on your device${sizeLabel ? ` · ${sizeLabel}` : ""}.`
                : `Plays over the network${sizeLabel ? ` · ${sizeLabel}` : ""}.`}
            </Text>
          </View>
        </View>

        {/* Track list */}
        {tracks.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>In this library</Text>
            {tracks.map((track, index) => {
              const active = index === currentIndex;
              return (
                <Pressable
                  key={track.id}
                  style={[styles.trackRow, active && styles.trackRowActive]}
                  onPress={() => selectTrack(index)}
                >
                  <View style={[styles.trackThumb, active && styles.trackThumbActive]}>
                    {active && status.playing ? (
                      <Ionicons name="volume-high" size={17} color={colors.textLight} />
                    ) : track.coverImageUrl ? (
                      <Image
                        source={{ uri: track.coverImageUrl }}
                        style={styles.trackThumbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name="musical-notes-outline"
                        size={17}
                        color={active ? colors.textLight : colors.primary}
                      />
                    )}
                  </View>

                  <View style={styles.trackRowText}>
                    <Text
                      style={[styles.trackRowTitle, active && styles.trackRowTitleActive]}
                      numberOfLines={1}
                    >
                      {track.title}
                    </Text>
                    <Text style={styles.trackRowMeta} numberOfLines={1}>
                      {track.courseCode ? `${track.courseCode} · ` : ""}
                      {formatTime(track.durationSeconds)}
                    </Text>
                  </View>

                  <Ionicons
                    name={active && status.playing ? "pause-circle" : "play-circle"}
                    size={26}
                    color={active ? colors.primary : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.huge,
    },
    artwork: {
      alignSelf: "center",
      width: 190,
      height: 190,
      borderRadius: borderRadius.huge,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    artworkImage: {
      width: "100%",
      height: "100%",
    },
    meta: {
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    coursePill: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.md,
      paddingVertical: 3,
      borderRadius: borderRadius.round,
      marginBottom: spacing.sm,
    },
    coursePillText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "800",
    },
    trackTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.xs,
    },
    trackAuthor: {
      fontSize: 13,
      color: colors.textMuted,
    },
    barTouchable: {
      paddingVertical: spacing.sm,
    },
    barTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      justifyContent: "center",
    },
    barFill: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    barThumb: {
      position: "absolute",
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: colors.primary,
      marginLeft: -6,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.xl,
    },
    timeText: {
      fontSize: 12,
      color: colors.textMuted,
      fontVariant: ["tabular-nums"],
    },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.xl,
    },
    smallButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    speedText: {
      color: colors.primary,
      fontWeight: "800",
      fontSize: 12,
    },
    playButton: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    playButtonDisabled: {
      opacity: 0.6,
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    infoBody: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    trackRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    trackRowActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    trackThumb: {
      width: 42,
      height: 42,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    trackThumbActive: {
      backgroundColor: colors.primary,
    },
    trackThumbImage: {
      width: "100%",
      height: "100%",
    },
    trackRowText: {
      flex: 1,
    },
    trackRowTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    trackRowTitleActive: {
      color: colors.primary,
    },
    trackRowMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
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
      lineHeight: 19,
    },
  });
