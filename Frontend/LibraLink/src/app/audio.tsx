import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { audioService, AudioBookTrackResponse } from "../services/audio";

export default function AudioBookPlayer() {
  const router = useRouter();
  const { userId } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<"1.0x" | "1.25x" | "1.5x" | "2.0x">("1.0x");
  const [isCached, setIsCached] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioBookTrackResponse | null>(null);
  const [currentPositionSeconds, setCurrentPositionSeconds] = useState(515); // Default 08:35 demo
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  useEffect(() => {
    // Fetch audio tracks from backend API
    audioService.getAllTracks().then((tracks) => {
      if (tracks && tracks.length > 0) {
        setCurrentTrack(tracks[0]);
        // Fetch existing playback position for demo user ID 1
        const progressUserId = userId ?? 1;
        audioService.getProgress(tracks[0].id, progressUserId).then((progress) => {
          if (progress && progress.currentPositionSeconds) {
            setCurrentPositionSeconds(progress.currentPositionSeconds);
          }
        });
      }
    });
  }, [userId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlayback = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (currentTrack) {
      audioService
        .saveProgress(currentTrack.id, userId ?? 1, currentPositionSeconds, false)
        .catch(() => {});
    }
  };

  const cycleSpeed = () => {
    if (playbackSpeed === "1.0x") setPlaybackSpeed("1.25x");
    else if (playbackSpeed === "1.25x") setPlaybackSpeed("1.5x");
    else if (playbackSpeed === "1.5x") setPlaybackSpeed("2.0x");
    else setPlaybackSpeed("1.0x");
  };

  const trackTitle = currentTrack?.title || "Data Structures: Linked Lists";
  const trackAuthor = currentTrack?.author || "CS 301 - Dr. O. Asiedu";
  const totalDuration = currentTrack?.durationSeconds || 1450;
  const fileSizeMb = currentTrack?.fileSizeBytes ? `${currentTrack.fileSizeBytes} MB` : "18.4 MB";
  const progressPercent = Math.min(100, Math.max(0, (currentPositionSeconds / totalDuration) * 100));

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      {/* Back button with chevron icon */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Audio Reader
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Listen to textbook translations and lecture summaries offline.
      </Text>

      {/* Album Artwork Circle */}
      <View style={styles.artworkContainer}>
        <View style={[styles.vinylCircle, { backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface, borderColor: colors.border }]}>
          <View style={[styles.vinylCenter, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="headset-outline" size={42} color={colors.primary} />
          </View>
        </View>
      </View>

      {/* Audio Metadata */}
      <View style={styles.metadataSection}>
        <Text style={[styles.audioTitle, { color: colors.text }]}>{trackTitle}</Text>
        <Text style={[styles.audioAuthor, { color: colors.textMuted }]}>{trackAuthor}</Text>
      </View>

      {/* Progress slider bar mock */}
      <View style={styles.progressContainer}>
        <View style={[styles.trackBg, { backgroundColor: colors.border }]}>
          <View style={[styles.trackProgress, { backgroundColor: colors.primary, width: `${progressPercent}%` }]} />
          <View style={[styles.trackThumb, { backgroundColor: colors.primary, left: `${progressPercent}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(currentPositionSeconds)}</Text>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(totalDuration)}</Text>
        </View>
      </View>

      {/* Audio Player Controls */}
      <View style={styles.controlsRow}>
        {/* Speed Selector Trigger */}
        <Pressable style={[styles.circleButton, { borderColor: colors.border }]} onPress={cycleSpeed}>
          <Text style={[styles.speedText, { color: colors.primary }]}>{playbackSpeed}</Text>
        </Pressable>

        {/* Skip Back 15s */}
        <Pressable 
          style={[styles.circleButton, { borderColor: colors.border }]}
          onPress={() => setCurrentPositionSeconds(Math.max(0, currentPositionSeconds - 15))}
        >
          <Ionicons name="play-back-outline" size={20} color={colors.text} />
        </Pressable>

        {/* Play/Pause Toggle */}
        <Pressable style={[styles.playButton, { backgroundColor: colors.primary }]} onPress={togglePlayback}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={24}
            color={colors.textLight}
            style={!isPlaying && { marginLeft: 3 }}
          />
        </Pressable>

        {/* Skip Forward 15s */}
        <Pressable 
          style={[styles.circleButton, { borderColor: colors.border }]}
          onPress={() => setCurrentPositionSeconds(Math.min(totalDuration, currentPositionSeconds + 15))}
        >
          <Ionicons name="play-forward-outline" size={20} color={colors.text} />
        </Pressable>

        {/* Caching Status Icon */}
        <Pressable
          style={[styles.circleButton, { borderColor: isCached ? colors.success : colors.border }]}
          onPress={() => setIsCached(!isCached)}
        >
          <Ionicons
            name={isCached ? "cloud-done-outline" : "cloud-download-outline"}
            size={20}
            color={isCached ? colors.success : colors.textMuted}
          />
        </Pressable>
      </View>

      {/* Offline Caching banner information */}
      <View style={[styles.cacheCard, isDark ? styles.cardDark : null, { borderColor: colors.border }]}>
        <Ionicons
          name={isCached ? "checkmark-circle" : "information-circle-outline"}
          size={20}
          color={isCached ? colors.success : colors.primary}
          style={{ marginRight: spacing.sm }}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.cacheTitle, { color: colors.text }]}>
            {isCached ? "Available Offline" : "Save for offline study"}
          </Text>
          <Text style={[styles.cacheDesc, { color: colors.textMuted }]}>
            {isCached ? `This lecture summary (${fileSizeMb}) is fully saved on your device.` : "Download audio textbook tracks to play without campus WiFi."}
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: "transparent",
    },
    backButton: {
      marginBottom: 16,
      alignSelf: "flex-start",
    },
    backButtonRow: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: -4,
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
    artworkContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: spacing.xl,
    },
    vinylCircle: {
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 8,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    vinylCenter: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: "center",
      justifyContent: "center",
    },
    metadataSection: {
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    audioTitle: {
      fontSize: 18,
      fontWeight: "800",
      textAlign: "center",
    },
    audioAuthor: {
      fontSize: 14,
      marginTop: 4,
      fontWeight: "500",
    },
    progressContainer: {
      marginHorizontal: spacing.sm,
      marginBottom: spacing.lg,
    },
    trackBg: {
      height: 6,
      borderRadius: 3,
      position: "relative",
      width: "100%",
    },
    trackProgress: {
      height: "100%",
      borderRadius: 3,
    },
    trackThumb: {
      width: 14,
      height: 14,
      borderRadius: 7,
      position: "absolute",
      top: -4,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.sm,
    },
    timeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    controlsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      marginBottom: spacing.xl,
      marginHorizontal: spacing.sm,
    },
    circleButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    speedText: {
      fontSize: 12,
      fontWeight: "800",
    },
    playButton: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    cacheCard: {
      flexDirection: "row",
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1.2,
      backgroundColor: colors.surface,
    },
    cardDark: {
      backgroundColor: "rgba(24, 28, 51, 0.85)",
      borderColor: "rgba(255, 255, 255, 0.06)",
      borderWidth: 1,
    },
    cacheTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    cacheDesc: {
      fontSize: 12,
      marginTop: 2,
      lineHeight: 16,
    },
  });
