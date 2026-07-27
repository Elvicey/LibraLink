import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout, ErrorBanner, FormField, SubmitButton } from "../components/AuthLayout";

export default function SchoolAdminJoinPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.schoolAdminJoin({
        email: email.trim(),
        otp: otp.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      });
      setSession(response);
      navigate("/school", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join with that code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Join as a Co-Admin"
      subtitle="Enter the 6-digit code your School Admin emailed you"
      footer={
        <Link to="/login" className="text-primary font-medium">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        <ErrorBanner message={error} />
        <FormField
          label="Email (must match the invite)"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <FormField
          label="OTP Code"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
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
          label="Password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <SubmitButton loading={loading}>Join school</SubmitButton>
      </form>
    </AuthLayout>
  );
}
