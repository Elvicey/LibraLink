import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/auth";
import { AuthLayout, ErrorBanner, FormField, SubmitButton } from "../components/AuthLayout";

// Unlike the other three auth pages, this one is a STAFF action, not a public signup:
// POST /api/auth/register-librarian requires the caller to already be authenticated as
// LIBRARIAN/ADMIN/SCHOOL_ADMIN (unchanged bearer-token gate) plus a librarian_code for
// their own school. Routed behind RequireRole in App.tsx - reached only when already
// logged in, reusing exactly the flow the mobile app's librarian-signup screen uses.
export default function LibrarianSignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [librarianCode, setLibrarianCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const response = await authApi.registerLibrarian({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        librarianCode: librarianCode.trim(),
      });
      setSuccess(`Librarian "${response.firstName} ${response.lastName}" created.`);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setLibrarianCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Register a Librarian"
      subtitle="Requires a librarian code - generate one from your School Admin dashboard"
      footer={
        <Link to="/school" className="text-primary font-medium">
          ← Back to dashboard
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        <ErrorBanner message={error} />
        {success && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2">
            {success}
          </div>
        )}
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
          label="Staff Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <FormField
          label="Temporary Password"
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <FormField
          label="Librarian Code"
          autoCapitalize="characters"
          value={librarianCode}
          onChange={(e) => setLibrarianCode(e.target.value)}
          disabled={loading}
          required
        />
        <SubmitButton loading={loading}>Register librarian</SubmitButton>
      </form>
    </AuthLayout>
  );
}
