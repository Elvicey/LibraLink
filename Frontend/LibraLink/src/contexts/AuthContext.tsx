import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  userId: number | null;
  token: string | null;
  roles: string[];
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setSession: (data: {
    token: string;
    userId: number;
    roles: string[];
    firstName?: string;
    lastName?: string;
    email?: string;
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
    loading: true,
  });

  const refresh = useCallback(async () => {
    const [token, userId, roles, firstName, lastName, email] = await Promise.all([
      AsyncStorage.getItem("authToken"),
      AsyncStorage.getItem("userId"),
      AsyncStorage.getItem("userRoles"),
      AsyncStorage.getItem("firstName"),
      AsyncStorage.getItem("lastName"),
      AsyncStorage.getItem("email"),
    ]);
    setState({
      token,
      userId: userId ? Number(userId) : null,
      roles: roles ? JSON.parse(roles) : [],
      firstName,
      lastName,
      email,
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
  }) => {
    await AsyncStorage.multiSet([
      ["authToken", data.token],
      ["userId", String(data.userId)],
      ["userRoles", JSON.stringify(data.roles || [])],
      ["firstName", data.firstName || ""],
      ["lastName", data.lastName || ""],
      ["email", data.email || ""],
    ]);
    setState({
      token: data.token,
      userId: data.userId,
      roles: data.roles || [],
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      email: data.email || null,
      loading: false,
    });
  }, []);

  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove([
      "authToken",
      "userId",
      "userRoles",
      "firstName",
      "lastName",
      "email",
    ]);
    setState({
      userId: null,
      token: null,
      roles: [],
      firstName: null,
      lastName: null,
      email: null,
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
