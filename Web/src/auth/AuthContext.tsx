import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getToken, setToken as persistToken } from "../api/client";
import type { AuthResponse } from "../api/auth";

// Mirrors Frontend/LibraLink/src/contexts/AuthContext.tsx's shape (token/userId/roles/
// email/firstName/lastName/institutionId in storage) plus the new schoolId field.
interface SessionState {
  token: string | null;
  userId: number | null;
  roles: string[];
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  schoolId: number | null;
  loading: boolean;
}

interface AuthContextValue extends SessionState {
  setSession: (data: AuthResponse) => void;
  clearSession: () => void;
  hasRole: (...roles: string[]) => boolean;
}

const STORAGE_KEY = "libralink_portal_session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredSession(): Omit<SessionState, "loading"> {
  const token = getToken();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!token || !raw) {
    return { token: null, userId: null, roles: [], firstName: null, lastName: null, email: null, schoolId: null };
  }
  try {
    const parsed = JSON.parse(raw);
    return { token, ...parsed };
  } catch {
    return { token: null, userId: null, roles: [], firstName: null, lastName: null, email: null, schoolId: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(() => ({ ...loadStoredSession(), loading: false }));

  useEffect(() => {
    setState((s) => ({ ...s, loading: false }));
  }, []);

  const setSession = (data: AuthResponse) => {
    persistToken(data.token);
    const rest = {
      userId: data.userId,
      roles: data.roles || [],
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      schoolId: data.schoolId ?? data.institutionId ?? null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    setState({ token: data.token, ...rest, loading: false });
  };

  const clearSession = () => {
    persistToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setState({ token: null, userId: null, roles: [], firstName: null, lastName: null, email: null, schoolId: null, loading: false });
  };

  const hasRole = (...roles: string[]) => roles.some((r) => state.roles.includes(r));

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, setSession, clearSession, hasRole }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
