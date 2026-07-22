import { API_BASE_URL } from "../config/api";

export interface PodcastShow {
  id: number;
  title: string;
  description?: string;
  coverImageUrl?: string;
  hostName?: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PodcastEpisode {
  id: number;
  showId: number;
  bookId?: number | null;
  title: string;
  description?: string;
  audioUrl?: string;
  durationSeconds?: number;
  episodeNumber?: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

async function requestJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string; error?: string }).message
      || (data as { error?: string }).error
      || `Request failed (${res.status})`);
  }
  return data as T;
}

export const podcastsService = {
  listShows: (): Promise<PodcastShow[]> =>
    requestJson<PodcastShow[]>("/api/podcasts"),

  getShow: (showId: number): Promise<PodcastShow> =>
    requestJson<PodcastShow>(`/api/podcasts/${showId}`),

  listEpisodes: (showId: number): Promise<PodcastEpisode[]> =>
    requestJson<PodcastEpisode[]>(`/api/podcasts/${showId}/episodes`),

  getEpisode: (episodeId: number): Promise<PodcastEpisode> =>
    requestJson<PodcastEpisode>(`/api/podcasts/episodes/${episodeId}`),

  listByBook: (bookId: number): Promise<PodcastEpisode[]> =>
    requestJson<PodcastEpisode[]>(`/api/podcasts/book/${bookId}`),
};
