import { useEffect, useState } from "react";
import { bookCopiesApi, type BookCopy } from "../../api/bookCopies";
import type { StaffBook } from "../../api/books";
import { FormField, SelectField, SubmitButton } from "../../components/AuthLayout";
import { Badge, Banner, Card, EmptyState } from "../../components/DashboardShell";

const CONDITIONS = ["GOOD", "WORN", "DAMAGED", "LOST"];

export default function BookCopies({ book, onDone }: { book: StaffBook; onDone: () => void }) {
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [barcode, setBarcode] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    bookCopiesApi
      .list()
      .then((all) => setCopies(all.filter((c) => c.book.id === book.id)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load copies."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [book.id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = barcode.trim();
    if (!trimmed) return;
    setAddError(null);
    setAdding(true);
    try {
      await bookCopiesApi.create({
        book: { id: book.id },
        barcode: trimmed,
        condition,
        notes: notes.trim() || undefined,
      });
      setBarcode("");
      setNotes("");
      setCondition("GOOD");
      load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to register copy.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Card title={`Copies — "${book.title}"`}>
      <Banner tone="error" message={error} />
      <p className="text-sm text-slate-500 mb-4">
        Each physical copy needs its own barcode registered here before it can be scanned at the
        Circulation Desk. The book's "Total copies" count is a separate aggregate figure and
        doesn't create anything scannable on its own.
      </p>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 mb-2 max-w-2xl">
        <div className="flex-1 min-w-[160px]">
          <FormField label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} disabled={adding} required />
        </div>
        <div className="w-36">
          <SelectField label="Condition" value={condition} onChange={(e) => setCondition(e.target.value)} disabled={adding}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex-1 min-w-[160px]">
          <FormField label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={adding} />
        </div>
        <div className="mb-4">
          <SubmitButton loading={adding}>Register copy</SubmitButton>
        </div>
      </form>
      {addError && <p className="text-xs text-red-600 mb-4">{addError}</p>}

      {loading ? (
        <EmptyState>Loading copies…</EmptyState>
      ) : copies.length === 0 ? (
        <EmptyState>No barcoded copies registered yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Barcode</th>
                <th className="py-2 pr-4 font-medium">Condition</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {copies.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs text-ink">{c.barcode}</td>
                  <td className="py-3 pr-4">
                    <Badge tone="slate">{c.condition}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={c.available ? "green" : "amber"}>{c.available ? "Available" : "Checked out"}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-slate-500">{c.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back to books
        </button>
      </div>
    </Card>
  );
}
