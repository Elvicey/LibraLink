import { api } from "./api";
import { Book, booksService } from "./books";

export interface Institution {
  institutionId: number;
  name: string;
  shortName?: string;
}

export interface CourseResponse {
  id: number;
  name: string;
  code?: string;
  description?: string;
  status?: string;
  institution?: Institution;
  books?: Book[];
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
  publishedAt?: string;
}

export interface ReadingListItemResponse {
  id: number;
  readingListId: number;
  bookId: number;
  notes?: string;
  requiredBy?: string;
}

export interface ReadingProgressResponse {
  id: number;
  studentId: number;
  listItemId: number;
  status: string;
}

export type ReadingPriority = "REQUIRED" | "RECOMMENDED" | "FURTHER";
export type ProgressStatus = "reading" | "completed" | "saved";

export const coursesService = {
  getInstitutions: () => api.get<Institution[]>("/api/institutions", { auth: false }),

  getCourses: (institutionId: number) =>
    api.get<CourseResponse[]>(`/api/courses/institutions/${institutionId}`, { auth: false }),

  getCourse: (courseId: number) =>
    api.get<CourseResponse>(`/api/courses/${courseId}`),

  createCourse: (payload: {
    name: string;
    code?: string;
    description?: string;
    institutionId: number;
  }) =>
    api.post<CourseResponse>("/api/courses", {
      name: payload.name,
      code: payload.code,
      description: payload.description,
      institution: { institutionId: payload.institutionId },
    }),

  linkBooksToCourse: (courseId: number, bookIds: number[]) =>
    api.put<CourseResponse>(`/api/courses/${courseId}/books`, { bookIds }),

  getReadingLists: (courseId: number) =>
    api.get<ReadingListResponse[]>(`/api/reading-lists/course/${courseId}`),

  createReadingList: (payload: {
    courseId: number;
    createdBy?: number;
    title: string;
    description?: string;
    semester?: string;
    academicYear?: string;
  }) => api.post<ReadingListResponse>("/api/reading-lists", payload),

  publishReadingList: (listId: number, publish = true) =>
    api.put<ReadingListResponse>(`/api/reading-lists/${listId}/publish?publish=${publish}`),

  getReadingListItems: (readingListId: number) =>
    api.get<ReadingListItemResponse[]>(`/api/reading_list_items/list/${readingListId}`),

  addBookToReadingList: (
    readingListId: number,
    bookId: number,
    priority: ReadingPriority = "REQUIRED",
    requiredBy?: string
  ) =>
    api.post<ReadingListItemResponse>("/api/reading_list_items", {
      readingListId,
      bookId,
      notes: priority,
      requiredBy: requiredBy || null,
    }),

  bulkAssignBooks: (
    readingListId: number,
    bookIds: number[],
    priority: ReadingPriority = "REQUIRED"
  ) =>
    api.post<ReadingListItemResponse[]>("/api/reading_list_items/bulk", {
      readingListId,
      bookIds,
      priority,
    }),

  getProgressForStudent: (studentId: number) =>
    api.get<ReadingProgressResponse[]>(`/api/reading-progress/student/${studentId}`),

  updateProgress: (studentId: number, itemId: number, status: ProgressStatus) =>
    api.put<ReadingProgressResponse>(
      `/api/reading-progress?studentId=${studentId}&itemId=${itemId}&status=${encodeURIComponent(status)}`
    ),

  getCatalogueBooks: () => booksService.list(),
};
