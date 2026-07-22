import { api } from "./api";

export interface AppUser {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  active?: boolean;
  institutionId?: number | null;
}

export interface NotificationItem {
  id: number;
  userId?: number;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

export const usersService = {
  getById: (id: number): Promise<AppUser> => api.get<AppUser>(`/api/users/${id}`),
};

export const notificationsService = {
  getForUser: (userId: number): Promise<NotificationItem[]> =>
    api.get<NotificationItem[]>(`/api/notifications/user/${userId}`),

  markRead: (id: number): Promise<unknown> =>
    api.put(`/api/notifications/${id}/read`),
};
