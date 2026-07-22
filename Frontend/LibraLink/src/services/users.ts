import { api } from "./api";

export interface AppUser {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  active?: boolean;
  institutionId?: number | null;
  institution?: { institutionId?: number; name?: string } | null;
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

function normalizeUser(user: AppUser): AppUser {
  return {
    ...user,
    institutionId:
      user.institutionId ?? user.institution?.institutionId ?? null,
  };
}

export const usersService = {
  getById: async (id: number): Promise<AppUser> =>
    normalizeUser(await api.get<AppUser>(`/api/users/${id}`)),
};

export const notificationsService = {
  getForUser: (userId: number): Promise<NotificationItem[]> =>
    api.get<NotificationItem[]>(`/api/notifications/user/${userId}`),

  markRead: (id: number): Promise<unknown> =>
    api.put(`/api/notifications/${id}/read`),
};
