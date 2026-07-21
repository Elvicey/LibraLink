import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  userId: number | null;
  token: string | null;
  roles: string[];
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ userId: null, token: null, roles: [], loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ userId: null, token: null, roles: [], loading: true });

  useEffect(() => {
    (async () => {
      const [token, userId, roles] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userId"),
        AsyncStorage.getItem("userRoles"),
      ]);
      setState({
        token,
        userId: userId ? Number(userId) : null,
        roles: roles ? JSON.parse(roles) : [],
        loading: false,
      });
    })();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
