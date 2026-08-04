import { useEffect, useMemo, useState } from "react";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { downloadAsync, cacheDirectory } from "expo-file-system/legacy";
import { useAuth } from "../contexts/AuthContext";
import { audioService, TtsTrack } from "../services/audio";

export type NarrationPhase = "idle" | "generating" | "ready" | "error";

export interface BookNarration {
  phase: NarrationPhase;
  playing: boolean;
  durationSeconds?: number;
  errorMsg: string | null;
  /** Prepare the narration: reuse an existing one if present, else generate. */
  generate: () => Promise<void>;
  /** Force a fresh narration even if one exists (e.g. after the book text was edited). */
  regenerate: () => Promise<void>;
  /** Play/pause once ready (rewinds if the track had finished). */
  togglePlay: () => Promise<void>;
  /** One entry point for a single button: prepare if needed, otherwise play/pause. */
  activate: () => void;
}

/**
 * Owns a book's AI (text-to-speech) narration: generates it on the backend, downloads the WAV
 * to a local file (auth applied during download), and plays it with expo-audio. Kept as a hook
 * so the book screen can drive the same playback from both the narration card and PLAY BOOK.
 */
export function useBookNarration(bookId: number): BookNarration {
  const { token } = useAuth();

  const [phase, setPhase] = useState<NarrationPhase>("idle");
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Play through the iOS silent switch - otherwise a muted phone looks broken (same fix
  // already applied on the standalone /audio screen, just missing here, which is what
  // powers the book-detail narration card and PLAY BOOK).
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // Play a downloaded local file rather than streaming the protected WAV (reliable playback).
  const source = useMemo(
    () => (phase === "ready" && localUri ? localUri : null),
    [phase, localUri]
  );
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  // Download the stored WAV for a track and mark it ready to play (no TTS call).
  const loadTrack = async (id: number, duration?: number) => {
    setDurationSeconds(duration);
    const dest = `${cacheDirectory ?? ""}narration-${id}.wav`;
    const res = await downloadAsync(audioService.narrationStreamUrl(id), dest, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.status !== 200) {
      throw new Error("Could not download the narration audio.");
    }
    setLocalUri(res.uri);
    setPhase("ready");
  };

  const generate = async (force = false) => {
    if (phase === "generating") return;
    setPhase("generating");
    setErrorMsg(null);
    try {
      // Reuse an already-generated narration when possible — no TTS request, no quota used.
      if (!force) {
        const existing = await audioService.getBookTracks(bookId).catch(() => [] as TtsTrack[]);
        const done = existing
          .filter((t) => t.status === "COMPLETED")
          .sort((a, b) => b.id - a.id)[0];
        if (done) {
          await loadTrack(done.id, done.durationSeconds);
          return;
        }
      }

      // Otherwise generate a fresh one and poll until it's ready.
      const { trackId: id } = await audioService.generateNarration(bookId);
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const t = await audioService.getTtsTrack(id);
        if (t.status === "COMPLETED") {
          await loadTrack(id, t.durationSeconds);
          return;
        }
        if (t.status === "FAILED") {
          throw new Error(t.errorMessage || "Narration generation failed.");
        }
      }
      throw new Error("Timed out while generating narration.");
    } catch (e: any) {
      setErrorMsg(e?.message || "Could not generate narration.");
      setPhase("error");
    }
  };

  const regenerate = () => generate(true);

  const togglePlay = async () => {
    if (!player) return;
    if (status?.playing) {
      player.pause();
      return;
    }
    // After a track finishes it sits at the end, so replaying needs a rewind first.
    const atEnd =
      status?.didJustFinish ||
      (status?.duration ? status.currentTime >= status.duration - 0.1 : false);
    if (atEnd) {
      await player.seekTo(0);
    }
    player.play();
  };

  const activate = () => {
    if (phase === "ready") {
      togglePlay();
    } else if (phase !== "generating") {
      generate();
    }
  };

  return {
    phase,
    playing: !!status?.playing,
    durationSeconds,
    errorMsg,
    generate,
    regenerate,
    togglePlay,
    activate,
  };
}
