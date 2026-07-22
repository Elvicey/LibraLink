import { api } from "./api";

export interface AudioBookTrackResponse {
  id: number;
  title: string;
  author: string;
  courseCode?: string;
  audioUrl: string;
  durationSeconds: number;
  fileSizeBytes?: number;
  coverImageUrl?: string;
  isAvailableOffline: boolean;
}

export interface UserAudioProgressResponse {
  id: number;
  userId: number;
  trackId: number;
  currentPositionSeconds: number;
  isCompleted: boolean;
  lastListenedAt?: string;
}

export const audioService = {
  /**
   * Fetch all audio tracks from backend catalog.
   */
  getAllTracks: async (): Promise<AudioBookTrackResponse[]> => {
    try {
      return await api.get<AudioBookTrackResponse[]>("/api/audio-tracks");
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
          fileSizeBytes: 18.4,
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
