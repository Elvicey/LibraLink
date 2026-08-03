import { useEffect, useState } from "react";
import { booksApi, type StaffBook } from "../../api/books";
import { Banner, Card } from "../../components/DashboardShell";
import { SubmitButton, TextAreaField } from "../../components/AuthLayout";

export default function BookContentEditor({ book, onDone }: { book: StaffBook; onDone: () => void }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    booksApi
      .getContent(book.id)
      .then((res) => setContent(res.content))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load content."))
      .finally(() => setLoading(false));
  }, [book.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await booksApi.updateContent(book.id, content);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save content.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title={`Edit full text — "${book.title}"`}>
      <Banner tone="error" message={error} />
      <p className="text-sm text-slate-500 mb-4">
        This is the book's full readable text, used by the in-app reader and audiobook narration. Leave
        blank to clear it.
      </p>
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <TextAreaField
            label="Full text"
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={saving}
          />
          <div className="flex gap-3 max-w-sm">
            <SubmitButton loading={saving}>Save content</SubmitButton>
            <button
              type="button"
              onClick={onDone}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
