import { useEffect, useState } from "react";
import { booksApi, type StaffBook } from "../../api/books";
import { Badge, Banner, Card, EmptyState } from "../../components/DashboardShell";

export default function BookOversight() {
  const [books, setBooks] = useState<StaffBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    booksApi
      .list()
      .then(setBooks)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load books."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="Books">
      <Banner tone="error" message={error} />
      {loading ? (
        <EmptyState>Loading books…</EmptyState>
      ) : books.length === 0 ? (
        <EmptyState>No books at your school yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Author(s)</th>
                <th className="py-2 pr-4 font-medium">ISBN</th>
                <th className="py-2 pr-4 font-medium">Copies</th>
                <th className="py-2 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-ink">{book.title}</div>
                    {book.subtitle && <div className="text-xs text-slate-400">{book.subtitle}</div>}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {book.authors.length > 0 ? book.authors.map((a) => a.fullName).join(", ") : "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-500 font-mono text-xs">{book.isbn || book.isbn13 || "—"}</td>
                  <td className="py-3 pr-4">
                    {book.availableCopies} / {book.totalCopies}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={book.active ? "green" : "slate"}>{book.active ? "Active" : "Inactive"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
