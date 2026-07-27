import { api } from "./api";
import { Book } from "./books";

/**
 * The signed-in user's personal saved-books list, backing the bookmark control on
 * the book detail screen and the Reading Lists screen.
 *
 * Writes are attributed server-side to the authenticated caller, so add/remove
 * take no userId.
 */
export const bookmarksService = {
  /** The user's saved books, newest first. */
  list: (userId: number): Promise<Book[]> =>
    api.get<Book[]>(`/api/bookmarks/user/${userId}`),

  isBookmarked: async (userId: number, bookId: number): Promise<boolean> => {
    try {
      const res = await api.get<{ bookmarked: boolean }>(
        `/api/bookmarks/user/${userId}/book/${bookId}`
      );
      return !!res?.bookmarked;
    } catch {
      return false;
    }
  },

  add: (bookId: number): Promise<unknown> =>
    api.post("/api/bookmarks", { bookId }),

  remove: (bookId: number): Promise<unknown> =>
    api.delete(`/api/bookmarks/book/${bookId}`),
};
