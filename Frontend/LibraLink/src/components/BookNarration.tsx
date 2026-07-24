import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../constants/theme";
import type { BookNarration as BookNarrationState } from "../hooks/useBookNarration";

function fmt(seconds?: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Presentational card for a book's AI narration; state/playback lives in useBookNarration. */
export default function BookNarration({ narration }: { narration: BookNarrationState }) {
  const { colors, spacing, borderRadius } = useTheme();
  const { phase, playing, durationSeconds, errorMsg, generate, regenerate, togglePlay } = narration;
  const styles = createStyles(colors, spacing, borderRadius);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconTile}>
          <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>AI narration</Text>
          <Text style={styles.subtitle}>Listen to this book read aloud by AI.</Text>
        </View>
      </View>

      {phase === "ready" ? (
        <>
          <Pressable style={styles.playRow} onPress={togglePlay}>
            <View style={styles.playCircle}>
              <Ionicons name={playing ? "pause" : "play"} size={20} color={colors.textLight} />
            </View>
            <Text style={styles.playLabel}>{playing ? "Pause" : "Play narration"}</Text>
            <Text style={styles.duration}>{fmt(durationSeconds)}</Text>
          </Pressable>
          <Pressable onPress={regenerate} hitSlop={8} style={styles.regenerateBtn}>
            <Ionicons name="refresh-outline" size={13} color={colors.textMuted} />
            <Text style={styles.regenerateText}>Regenerate</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={[styles.generateBtn, phase === "generating" && styles.generateBtnDisabled]}
          onPress={generate}
          disabled={phase === "generating"}
        >
          {phase === "generating" ? (
            <>
              <ActivityIndicator size="small" color={colors.textLight} />
              <Text style={styles.generateText}>Preparing narration…</Text>
            </>
          ) : (
            <>
              <Ionicons name="headset-outline" size={17} color={colors.textLight} />
              <Text style={styles.generateText}>{phase === "error" ? "Try again" : "Generate AI narration"}</Text>
            </>
          )}
        </Pressable>
      )}

      {phase === "error" && errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
    </View>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginTop: spacing.lg,
    },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontSize: 15, fontWeight: "800", color: colors.text },
    subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    generateBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
    },
    generateBtnDisabled: { opacity: 0.7 },
    generateText: { color: colors.textLight, fontSize: 14, fontWeight: "800" },
    playRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    playCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    playLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.text },
    duration: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
    regenerateBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      marginTop: spacing.sm,
      paddingVertical: 2,
    },
    regenerateText: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
    errorText: { color: colors.danger, fontSize: 12, marginTop: spacing.sm },
  });
