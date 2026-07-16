import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  userId: number | null;
  token: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ userId: null, token: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ userId: null, token: null, loading: true });

  useEffect(() => {
    (async () => {
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userId"),
      ]);
      setState({ token, userId: userId ? Number(userId) : null, loading: false });
    })();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
