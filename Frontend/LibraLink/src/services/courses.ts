import { api } from "./api";

export interface CourseResponse {
  id: number;
  institutionId: number;
  name: string;
  code: string;
  description?: string;
  status: string;
}

export interface ReadingListResponse {
  id: number;
  courseId: number;
  createdBy?: number;
  title: string;
  description?: string;
  semester?: string;
  academicYear?: string;
  isPublished: boolean;
}

export interface ReadingListItemResponse {
  id: number;
  readingListId: number;
  bookId: number;
  notes?: string;
}

export interface BookResponse {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  publishYear?: number;
  totalCopies?: number;
  availableCopies?: number;
}

export const coursesService = {
  /**
   * Fetches all courses registered under a specific institution ID.
   */
  getCourses: async (institutionId: number): Promise<CourseResponse[]> => {
    return api.get<CourseResponse[]>(`/api/courses/institutions/${institutionId}`);
  },

  /**
   * Fetches reading lists associated with a course.
   */
  getReadingLists: async (courseId: number): Promise<ReadingListResponse[]> => {
    return api.get<ReadingListResponse[]>(`/api/reading-lists/course/${courseId}`);
  },

  /**
   * Fetches all library catalog books.
   */
  getBooks: async (): Promise<BookResponse[]> => {
    return api.get<BookResponse[]>("/api/books");
  },

  /**
   * Assigns a textbook item to a specific reading list.
   */
  addBookToReadingList: async (
    readingListId: number,
    bookId: number,
    notes?: string
  ): Promise<ReadingListItemResponse> => {
    const body = {
      readingListId,
      bookId,
      notes: notes || "Assigned reading",
    };
    return api.post<ReadingListItemResponse>("/api/reading_list_items", body);
  },

  /**
   * Convenience helper to create a brand new textbook catalog entry.
   */
  createBook: async (title: string, author: string): Promise<BookResponse> => {
    const body = {
      title,
      author,
      totalCopies: 5,
      availableCopies: 5,
    };
    return api.post<BookResponse>("/api/books", body);
  },
};
