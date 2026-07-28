import { useState } from "react";
import { circulationApi } from "../../api/circulation";
import { usersApi } from "../../api/users";
import { FormField, SubmitButton } from "../../components/AuthLayout";
import { Banner, Card } from "../../components/DashboardShell";

export default function CirculationScan() {
  const [barcode, setBarcode] = useState("");
  const [action, setAction] = useState<"CHECK_OUT" | "CHECK_IN">("CHECK_OUT");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      let userId: number | undefined;
      if (action === "CHECK_OUT") {
        const borrower = await usersApi.getByStudentId(studentId.trim());
        userId = borrower.id;
      }
      const response = await circulationApi.scan(barcode.trim(), action, userId);
      setResult(
        action === "CHECK_OUT"
          ? `Checked out. Due back ${response.dueDate}.`
          : "Checked in successfully."
      );
      setBarcode("");
      setStudentId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Circulation scan">
      <Banner tone="error" message={error} />
      {result && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2">
          {result}
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-sm">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setAction("CHECK_OUT")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              action === "CHECK_OUT" ? "border-primary bg-primary/10 text-primary" : "border-slate-300 text-slate-600"
            }`}
          >
            Check out
          </button>
          <button
            type="button"
            onClick={() => setAction("CHECK_IN")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              action === "CHECK_IN" ? "border-primary bg-primary/10 text-primary" : "border-slate-300 text-slate-600"
            }`}
          >
            Check in
          </button>
        </div>
        <FormField
          label="Barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          disabled={loading}
          required
        />
        {action === "CHECK_OUT" && (
          <FormField
            label="Borrower's student number"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={loading}
            required
          />
        )}
        <SubmitButton loading={loading}>{action === "CHECK_OUT" ? "Check out" : "Check in"}</SubmitButton>
      </form>
    </Card>
  );
}
