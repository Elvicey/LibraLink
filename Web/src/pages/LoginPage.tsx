import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { authApi } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout, ErrorBanner, FormField, SubmitButton } from "../components/AuthLayout";

function postLoginRoute(roles: string[]): string | null {
  if (roles.includes("PLATFORM_SUPER_ADMIN")) return "/platform";
  if (roles.includes("SCHOOL_ADMIN") || roles.includes("ADMIN")) return "/school";
  if (roles.includes("LIBRARIAN")) return "/librarian";
  return null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login({ email: email.trim(), password });
      const route = postLoginRoute(response.roles);
      if (!route) {
        throw new Error("This account does not have access to the LibraLink staff portal.");
      }
      setSession(response);
      navigate(route, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="LibraLink Portal"
      subtitle="Platform, School Admin & Librarian sign in"
      footer={
        <div className="space-y-1">
          <div>
            First School Admin at your school?{" "}
            <Link to="/school-admin-signup" className="text-primary font-medium">
              Sign up with a school code
            </Link>
          </div>
          <div>
            Invited by another admin?{" "}
            <Link to="/school-admin-join" className="text-primary font-medium">
              Join with your OTP
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <ErrorBanner message={error} />
        <FormField
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="username"
          placeholder="name@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <FormField
          label="Password"
          type="password"
          icon={Lock}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
    </AuthLayout>
  );
}
