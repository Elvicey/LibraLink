import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireRole } from "./auth/RequireRole";
import LoginPage from "./pages/LoginPage";
import SchoolAdminSignupPage from "./pages/SchoolAdminSignupPage";
import SchoolAdminJoinPage from "./pages/SchoolAdminJoinPage";
import LibrarianSignupPage from "./pages/LibrarianSignupPage";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import SchoolAdminDashboard from "./pages/school/SchoolAdminDashboard";
import LibrarianDashboard from "./pages/librarian/LibrarianDashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/school-admin-signup" element={<SchoolAdminSignupPage />} />
          <Route path="/school-admin-join" element={<SchoolAdminJoinPage />} />

          <Route
            path="/librarian-signup"
            element={
              <RequireRole roles={["LIBRARIAN", "ADMIN", "SCHOOL_ADMIN", "PLATFORM_SUPER_ADMIN"]}>
                <LibrarianSignupPage />
              </RequireRole>
            }
          />

          <Route
            path="/platform"
            element={
              <RequireRole roles={["PLATFORM_SUPER_ADMIN"]}>
                <PlatformDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/school"
            element={
              <RequireRole roles={["SCHOOL_ADMIN", "ADMIN"]}>
                <SchoolAdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/librarian"
            element={
              <RequireRole roles={["LIBRARIAN"]}>
                <LibrarianDashboard />
              </RequireRole>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
