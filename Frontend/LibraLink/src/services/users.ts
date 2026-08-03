import { api } from "./api";

export interface AppUser {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string | null;
  studentId?: string | null;
  indexNumber?: string | null;
  programme?: string | null;
  active?: boolean;
  roles?: { id?: number; name?: string }[];
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

  /** Self-service profile update (name / phone / student details). Email is not editable. */
  updateProfile: async (
    id: number,
    fields: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      studentId?: string;
      indexNumber?: string;
      programme?: string;
    }
  ): Promise<AppUser> => normalizeUser(await api.put<AppUser>(`/api/users/${id}`, fields)),

  /** Register this device's Expo push token against the signed-in user. */
  registerPushToken: (id: number, pushToken: string): Promise<unknown> =>
    api.put(`/api/users/${id}/push-token`, { pushToken }),
};

export const notificationsService = {
  getForUser: (userId: number): Promise<NotificationItem[]> =>
    api.get<NotificationItem[]>(`/api/notifications/user/${userId}`),

  markRead: (id: number): Promise<unknown> =>
    api.put(`/api/notifications/${id}/read`),
};
