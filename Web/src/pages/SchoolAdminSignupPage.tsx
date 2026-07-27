import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout, ErrorBanner, FormField, SubmitButton } from "../components/AuthLayout";

export default function SchoolAdminSignupPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [schoolCode, setSchoolCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.schoolAdminSignup({
        schoolCode: schoolCode.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      setSession(response);
      navigate("/school", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Become a School Admin"
      subtitle="Use the school code your Platform Super Admin gave you"
      footer={
        <Link to="/login" className="text-primary font-medium">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        <ErrorBanner message={error} />
        <FormField
          label="School Code"
          autoCapitalize="characters"
          value={schoolCode}
          onChange={(e) => setSchoolCode(e.target.value)}
          disabled={loading}
          required
        />
        <FormField
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
          required
        />
        <FormField
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={loading}
          required
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <SubmitButton loading={loading}>Create School Admin account</SubmitButton>
      </form>
    </AuthLayout>
  );
}
