import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { token, hasRole } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (!hasRole(...roles)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
