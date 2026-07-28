import { useEffect, useState } from "react";
import { booksApi, type StaffBook } from "../../api/books";
import { Badge, Banner, Card, EmptyState } from "../../components/DashboardShell";
import BookForm from "./BookForm";
import BookContentEditor from "./BookContentEditor";

type Mode = { kind: "list" } | { kind: "create" } | { kind: "edit"; book: StaffBook } | { kind: "content"; book: StaffBook };

export default function BookOversight() {
  const [books, setBooks] = useState<StaffBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });

  function loadBooks() {
    setLoading(true);
    booksApi
      .list()
      .then(setBooks)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load books."))
      .finally(() => setLoading(false));
  }

  useEffect(loadBooks, []);

  if (mode.kind === "create") {
    return (
      <BookForm
        onCancel={() => setMode({ kind: "list" })}
        onSaved={() => {
          setMode({ kind: "list" });
          loadBooks();
        }}
      />
    );
  }

  if (mode.kind === "edit") {
    return (
      <BookForm
        book={mode.book}
        onCancel={() => setMode({ kind: "list" })}
        onSaved={() => {
          setMode({ kind: "list" });
          loadBooks();
        }}
      />
    );
  }

  if (mode.kind === "content") {
    return <BookContentEditor book={mode.book} onDone={() => setMode({ kind: "list" })} />;
  }

  return (
    <Card
      title="Books"
      action={
        <button
          onClick={() => setMode({ kind: "create" })}
          className="rounded-lg bg-primary text-white text-sm font-semibold px-3 py-1.5 hover:opacity-90"
        >
          + Add book
        </button>
      }
    >
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
                <th className="py-2 pr-4 font-medium"></th>
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
                  <td className="py-3 pr-4 text-right whitespace-nowrap space-x-3">
                    <button
                      onClick={() => setMode({ kind: "edit", book })}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setMode({ kind: "content", book })}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Edit text
                    </button>
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
