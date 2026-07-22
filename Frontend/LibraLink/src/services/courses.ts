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
  getCourses: async (institutionId: number): Promise<CourseResponse[]> => {
    return api.get<CourseResponse[]>(`/api/courses/institutions/${institutionId}`, { auth: false });
  },

  getReadingLists: async (courseId: number): Promise<ReadingListResponse[]> => {
    return api.get<ReadingListResponse[]>(`/api/reading-lists/course/${courseId}`);
  },

  getBooks: async (): Promise<BookResponse[]> => {
    return api.get<BookResponse[]>("/api/books", { auth: false });
  },

  addBookToReadingList: async (
    readingListId: number,
    bookId: number,
    notes?: string
  ): Promise<ReadingListItemResponse> => {
    return api.post<ReadingListItemResponse>("/api/reading_list_items", {
      readingListId,
      bookId,
      notes: notes || "Assigned reading",
    });
  },

  createBook: async (title: string, author: string): Promise<BookResponse> => {
    return api.post<BookResponse>("/api/books", {
      title,
      author,
      totalCopies: 5,
      availableCopies: 5,
    });
  },
};
