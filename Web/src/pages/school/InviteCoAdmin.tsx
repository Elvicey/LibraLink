import { useState } from "react";
import { staffApi } from "../../api/staff";
import { FormField, SubmitButton } from "../../components/AuthLayout";
import { Banner, Card, CodeReveal } from "../../components/DashboardShell";

export default function InviteCoAdmin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await staffApi.inviteSchoolAdmin(email.trim());
      setOtp(result.otp);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite co-admin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Invite a co-School-Admin">
      <Banner tone="error" message={error} />
      <p className="text-sm text-slate-500 mb-4">
        Generates a 15-minute one-time code. Share it with the invitee along with this portal's{" "}
        <span className="font-medium">"Join with your OTP"</span> link.
      </p>
      {otp && (
        <div className="mb-4">
          <CodeReveal label="One-time invite code" code={otp} hint="Expires in 15 minutes." />
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-sm">
        <FormField
          label="Invitee email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <SubmitButton loading={loading}>Send invite code</SubmitButton>
      </form>
    </Card>
  );
}
