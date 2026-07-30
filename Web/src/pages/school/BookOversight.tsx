import { useEffect, useMemo, useState } from "react";
import { BookMarked, CalendarClock, PackageCheck, RefreshCcw, Search } from "lucide-react";
import { booksApi, type StaffBook } from "../../api/books";
import { circulationApi, type BorrowRecord } from "../../api/circulation";
import { reservationsApi, type Reservation } from "../../api/reservations";
import { metadataApi, type Category } from "../../api/metadata";
import { Badge, Banner, Card, EmptyState, PaginationFooter, StatCard, usePagination } from "../../components/DashboardShell";
import BookForm from "./BookForm";
import BookContentEditor from "./BookContentEditor";

type Mode = { kind: "list" } | { kind: "create" } | { kind: "edit"; book: StaffBook } | { kind: "content"; book: StaffBook };

export default function BookOversight() {
  const [books, setBooks] = useState<StaffBook[]>([]);
  const [loans, setLoans] = useState<BorrowRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState(false);

  function loadBooks() {
    setLoading(true);
    Promise.all([booksApi.list(), circulationApi.listBorrowRecords(), reservationsApi.list(), metadataApi.listCategories()])
      .then(([b, l, r, c]) => {
        setBooks(b);
        setLoans(l);
        setReservations(r);
        setCategories(c);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load books."))
      .finally(() => setLoading(false));
  }

  useEffect(loadBooks, []);

  const categoryName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? "—";

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((book) => {
      if (availableOnly && book.availableCopies <= 0) return false;
      if (categoryFilter && String(book.categoryId ?? "") !== categoryFilter) return false;
      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        book.authors.some((a) => a.fullName.toLowerCase().includes(q)) ||
        (book.isbn ?? "").toLowerCase().includes(q) ||
        (book.isbn13 ?? "").toLowerCase().includes(q)
      );
    });
  }, [books, query, categoryFilter, availableOnly]);

  const { page, setPage, totalPages, pageItems, pageSize, total } = usePagination(filteredBooks, 8);

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

  const checkedOutCopies = books.reduce((sum, b) => sum + Math.max(0, b.totalCopies - b.availableCopies), 0);
  const overdueItems = loans.filter((l) => l.status === "OVERDUE").length;
  const activeReservations = reservations.filter((r) => r.status === "PENDING" || r.status === "READY").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total collection" value={books.length} icon={BookMarked} tone="primary" />
        <StatCard label="Checked out" value={checkedOutCopies} icon={PackageCheck} tone="warning" />
        <StatCard label="Overdue items" value={overdueItems} icon={CalendarClock} tone="danger" />
        <StatCard label="Active reservations" value={activeReservations} icon={RefreshCcw} tone="success" />
      </div>

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

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, author, ISBN…"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary/40"
            />
            Available only
          </label>
        </div>

        {loading ? (
          <EmptyState>Loading books…</EmptyState>
        ) : books.length === 0 ? (
          <EmptyState>No books at your school yet.</EmptyState>
        ) : filteredBooks.length === 0 ? (
          <EmptyState>No books match your filters.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">Title</th>
                  <th className="py-2 pr-4 font-medium">Author(s)</th>
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium">ISBN</th>
                  <th className="py-2 pr-4 font-medium">Copies</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((book) => {
                  const ratio = book.totalCopies > 0 ? book.availableCopies / book.totalCopies : 0;
                  return (
                    <tr key={book.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-ink">{book.title}</div>
                        {book.subtitle && <div className="text-xs text-slate-400">{book.subtitle}</div>}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {book.authors.length > 0 ? book.authors.map((a) => a.fullName).join(", ") : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone="slate">{categoryName(book.categoryId)}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-slate-500 font-mono text-xs">{book.isbn || book.isbn13 || "—"}</td>
                      <td className="py-3 pr-4 w-32">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span className="tabular-nums">
                            {book.availableCopies} / {book.totalCopies}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ratio > 0 ? "bg-primary" : "bg-danger"}`}
                            style={{ width: `${Math.round(ratio * 100)}%` }}
                          />
                        </div>
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
                  );
                })}
              </tbody>
            </table>
            <PaginationFooter page={page} totalPages={totalPages} onChange={setPage} total={total} pageSize={pageSize} />
          </div>
        )}
      </Card>
    </div>
  );
}
