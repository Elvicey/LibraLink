import { api } from "./api";
import { API_BASE_URL } from "../config/api";

export interface AudioBookTrackResponse {
  id: number;
  title: string;
  author: string;
  /** The catalogue book this recording belongs to, when one is linked. */
  book?: { id: number; title?: string } | null;
  courseCode?: string;
  audioUrl: string;
  durationSeconds: number;
  /**
   * Named "Bytes" by the backend but actually sent in megabytes (e.g. 18.4).
   * Prefer the normalized `fileSizeMb` below.
   */
  fileSizeBytes?: number;
  /** Normalized size in MB, whichever field the backend populated. */
  fileSizeMb?: number;
  coverImageUrl?: string;
  /** The API sends this as `availableOffline`; normalized here. */
  isAvailableOffline: boolean;
  availableOffline?: boolean;
}

/** Reconciles the backend's field names and units with what the app expects. */
function normalizeTrack(track: AudioBookTrackResponse): AudioBookTrackResponse {
  return {
    ...track,
    fileSizeMb: track.fileSizeMb ?? track.fileSizeBytes,
    isAvailableOffline: track.isAvailableOffline ?? track.availableOffline ?? false,
  };
}

export interface UserAudioProgressResponse {
  id: number;
  userId: number;
  trackId: number;
  currentPositionSeconds: number;
  isCompleted: boolean;
  lastListenedAt?: string;
}

/** An on-demand AI (text-to-speech) narration track. */
export interface TtsTrack {
  id: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | string;
  durationSeconds?: number;
  audioFormat?: string;
  errorMessage?: string;
}

export const audioService = {
  /** Kick off AI narration for a book (reads its text). Returns the new track id + status. */
  generateNarration: (bookId: number, content?: string): Promise<{ trackId: number; status: string }> =>
    api.post<{ trackId: number; status: string }>(
      "/api/audio/convert",
      content ? { bookId, content } : { bookId }
    ),

  /** Poll a narration track's status while it's being generated. */
  getTtsTrack: (trackId: number): Promise<TtsTrack> =>
    api.get<TtsTrack>(`/api/audio/${trackId}`),

  /** Absolute URL for the protected WAV stream (needs an Authorization header to play). */
  narrationStreamUrl: (trackId: number): string => `${API_BASE_URL}/api/audio/${trackId}/stream`,

  /** The caller's narration tracks for a book — used to reuse an already-generated one. */
  getBookTracks: (bookId: number): Promise<TtsTrack[]> =>
    api.get<TtsTrack[]>(`/api/audio/book/${bookId}`),

  /**
   * Fetch all audio tracks from backend catalog.
   */
  getAllTracks: async (): Promise<AudioBookTrackResponse[]> => {
    try {
      const tracks = await api.get<AudioBookTrackResponse[]>("/api/audio-tracks");
      return (tracks || []).map(normalizeTrack);
    } catch (error) {
      console.warn("Failed to fetch audio tracks from backend, returning fallback local demo track:", error);
      return [
        {
          id: 1,
          title: "Data Structures: Linked Lists",
          author: "CS 301 - Dr. O. Asiedu",
          courseCode: "CS 301",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          durationSeconds: 1450,
          fileSizeMb: 18.4,
          isAvailableOffline: true,
        },
      ];
    }
  },

  /**
   * Fetch details for a specific track.
   */
  getTrackById: async (id: number): Promise<AudioBookTrackResponse> => {
    return api.get<AudioBookTrackResponse>(`/api/audio-tracks/${id}`);
  },

  /**
   * Save student's current playback position in seconds to the backend database.
   */
  saveProgress: async (
    trackId: number,
    userId: number,
    positionSeconds: number,
    isCompleted: boolean = false
  ): Promise<UserAudioProgressResponse> => {
    return api.post<UserAudioProgressResponse>(`/api/audio-tracks/${trackId}/progress`, {
      userId,
      positionSeconds,
      isCompleted,
    });
  },

  /**
   * Retrieve saved playback progress for a specific user and track.
   */
  getProgress: async (trackId: number, userId: number): Promise<UserAudioProgressResponse | null> => {
    try {
      return await api.get<UserAudioProgressResponse>(`/api/audio-tracks/${trackId}/progress/user/${userId}`);
    } catch {
      return null;
    }
  },
};
