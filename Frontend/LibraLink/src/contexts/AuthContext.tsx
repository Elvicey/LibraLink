import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerPushForUser } from "../services/push";

interface AuthState {
  userId: number | null;
  token: string | null;
  roles: string[];
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  institutionId: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setSession: (data: {
    token: string;
    userId: number;
    roles: string[];
    firstName?: string;
    lastName?: string;
    email?: string;
    institutionId?: number | null;
  }) => Promise<void>;
  clearSession: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  userId: null,
  token: null,
  roles: [],
  firstName: null,
  lastName: null,
  email: null,
  institutionId: null,
  loading: true,
  refresh: async () => {},
  setSession: async () => {},
  clearSession: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    userId: null as number | null,
    token: null as string | null,
    roles: [] as string[],
    firstName: null as string | null,
    lastName: null as string | null,
    email: null as string | null,
    institutionId: null as number | null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    const [token, userId, roles, firstName, lastName, email, institutionId] = await Promise.all([
      AsyncStorage.getItem("authToken"),
      AsyncStorage.getItem("userId"),
      AsyncStorage.getItem("userRoles"),
      AsyncStorage.getItem("firstName"),
      AsyncStorage.getItem("lastName"),
      AsyncStorage.getItem("email"),
      AsyncStorage.getItem("institutionId"),
    ]);
    setState({
      token,
      userId: userId ? Number(userId) : null,
      roles: roles ? JSON.parse(roles) : [],
      firstName,
      lastName,
      email,
      institutionId: institutionId ? Number(institutionId) : null,
      loading: false,
    });
  }, []);

  const setSession = useCallback(async (data: {
    token: string;
    userId: number;
    roles: string[];
    firstName?: string;
    lastName?: string;
    email?: string;
    institutionId?: number | null;
  }) => {
    await AsyncStorage.multiSet([
      ["authToken", data.token],
      ["userId", String(data.userId)],
      ["userRoles", JSON.stringify(data.roles || [])],
      ["firstName", data.firstName || ""],
      ["lastName", data.lastName || ""],
      ["email", data.email || ""],
      ["institutionId", data.institutionId != null ? String(data.institutionId) : ""],
    ]);
    setState({
      token: data.token,
      userId: data.userId,
      roles: data.roles || [],
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      email: data.email || null,
      institutionId: data.institutionId ?? null,
      loading: false,
    });
    // Best-effort: register this device for push once we have an authenticated user.
    registerPushForUser(data.userId);
  }, []);

  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove([
      "authToken",
      "userId",
      "userRoles",
      "firstName",
      "lastName",
      "email",
      "institutionId",
    ]);
    setState({
      userId: null,
      token: null,
      roles: [],
      firstName: null,
      lastName: null,
      email: null,
      institutionId: null,
      loading: false,
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ ...state, refresh, setSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
