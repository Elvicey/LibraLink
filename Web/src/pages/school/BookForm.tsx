import { useEffect, useState } from "react";
import { booksApi, type BookFormPayload, type StaffBook } from "../../api/books";
import { metadataApi, type Author, type Category, type Publisher } from "../../api/metadata";
import { Banner, Card } from "../../components/DashboardShell";
import { CheckboxField, FormField, SelectField, SubmitButton, TextAreaField } from "../../components/AuthLayout";

// Mirrors the backend's BookService.assertValidPublicationYear bounds exactly.
const NEXT_YEAR = new Date().getFullYear() + 1;

export default function BookForm({
  book,
  onSaved,
  onCancel,
}: {
  book?: StaffBook;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!book;

  const [title, setTitle] = useState(book?.title ?? "");
  const [subtitle, setSubtitle] = useState(book?.subtitle ?? "");
  const [isbn, setIsbn] = useState(book?.isbn ?? "");
  const [isbn13, setIsbn13] = useState(book?.isbn13 ?? "");
  const [edition, setEdition] = useState(book?.edition ?? "");
  const [language, setLanguage] = useState(book?.language ?? "");
  const [publicationYear, setPublicationYear] = useState(book?.publicationYear ? String(book.publicationYear) : "");
  const [description, setDescription] = useState(book?.description ?? "");
  const [totalCopies, setTotalCopies] = useState(String(book?.totalCopies ?? 1));
  const [availableCopies, setAvailableCopies] = useState(String(book?.availableCopies ?? 1));
  const [isDigitalOnly, setIsDigitalOnly] = useState(book?.digitalOnly ?? false);
  const [isActive, setIsActive] = useState(book?.active ?? true);
  const [publisherId, setPublisherId] = useState<string>(book?.publisherId ? String(book.publisherId) : "");
  const [categoryId, setCategoryId] = useState<string>(book?.categoryId ? String(book.categoryId) : "");
  const [authorIds, setAuthorIds] = useState<number[]>(book?.authors.map((a) => a.id) ?? []);

  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([metadataApi.listAuthors(), metadataApi.listPublishers(), metadataApi.listCategories()])
      .then(([a, p, c]) => {
        setAuthors(a);
        setPublishers(p);
        setCategories(c);
      })
      .catch(() => {
        // Non-fatal: the form still works with free-text fields if metadata fails to load.
      });
  }, []);

  function toggleAuthor(id: number) {
    setAuthorIds((current) => (current.includes(id) ? current.filter((a) => a !== id) : [...current, id]));
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCategoryError(null);
    setAddingCategory(true);
    try {
      const created = await metadataApi.createCategory(name);
      setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(String(created.id));
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to add category.");
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!subtitle.trim()) {
      setError("Subtitle is required.");
      return;
    }
    if (!isbn.trim()) {
      setError("ISBN is required.");
      return;
    }
    if (!language.trim()) {
      setError("Language is required.");
      return;
    }
    if (!totalCopies.trim() || !Number.isInteger(Number(totalCopies)) || Number(totalCopies) < 0) {
      setError("Total copies is required and must be a non-negative whole number.");
      return;
    }
    if (!availableCopies.trim() || !Number.isInteger(Number(availableCopies)) || Number(availableCopies) < 0) {
      setError("Available copies is required and must be a non-negative whole number.");
      return;
    }
    if (publicationYear) {
      const year = Number(publicationYear);
      if (!Number.isInteger(year) || year < 1000 || year > NEXT_YEAR) {
        setError(`Publication year must be a 4-digit year between 1000 and ${NEXT_YEAR}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload: BookFormPayload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        isbn: isbn.trim(),
        isbn13: isbn13.trim() || undefined,
        publisherId: publisherId ? Number(publisherId) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        publicationYear: publicationYear ? Number(publicationYear) : undefined,
        edition: edition.trim() || undefined,
        language: language.trim(),
        description: description.trim() || undefined,
        // Not editable from this form yet - pass the existing value through unchanged
        // instead of silently clearing it on every save (there's no input for these).
        coverImageUrl: book?.coverImageUrl ?? undefined,
        digitalUrl: book?.digitalUrl ?? undefined,
        totalCopies: Number(totalCopies),
        availableCopies: Number(availableCopies),
        isDigitalOnly,
        isActive,
        authorIds,
      };
      if (isEdit) {
        await booksApi.update(book.id, payload);
      } else {
        await booksApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title={isEdit ? `Edit "${book.title}"` : "Add a book"}>
      <Banner tone="error" message={error} />
      {/* noValidate: min/max on the year field are still useful native affordances
          (spinner clamping, numeric keyboard), but native constraint validation would
          otherwise block the submit event before handleSubmit runs, bypassing our
          own validation and its consistent error Banner. */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid sm:grid-cols-2 gap-x-4">
          <FormField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} required />
          <FormField label="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} disabled={loading} required />
          <FormField label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} disabled={loading} required />
          <FormField label="ISBN-13" value={isbn13} onChange={(e) => setIsbn13(e.target.value)} disabled={loading} />
          <FormField label="Edition" value={edition} onChange={(e) => setEdition(e.target.value)} disabled={loading} />
          <FormField label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} disabled={loading} required />
          <FormField
            label="Publication year"
            type="number"
            inputMode="numeric"
            min={1000}
            max={NEXT_YEAR}
            step={1}
            placeholder="e.g. 2020"
            value={publicationYear}
            onChange={(e) => setPublicationYear(e.target.value)}
            disabled={loading}
          />
          <SelectField label="Publisher" value={publisherId} onChange={(e) => setPublisherId(e.target.value)} disabled={loading}>
            <option value="">—</option>
            {publishers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="block text-sm font-medium text-slate-700">Category</span>
              <button
                type="button"
                onClick={() => {
                  setShowNewCategory((v) => !v);
                  setCategoryError(null);
                }}
                disabled={loading}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                {showNewCategory ? "Cancel" : "+ New category"}
              </button>
            </div>
            {showNewCategory ? (
              <div className="flex items-center gap-2">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Science Fiction"
                  disabled={addingCategory}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:bg-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={addingCategory || !newCategoryName.trim()}
                  className="rounded-lg bg-primary text-white text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                >
                  {addingCategory ? "Adding…" : "Add"}
                </button>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:bg-slate-100"
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {categoryError && <p className="text-xs text-red-600 mt-1">{categoryError}</p>}
          </div>
          <FormField
            label="Total copies"
            type="number"
            min={0}
            value={totalCopies}
            onChange={(e) => setTotalCopies(e.target.value)}
            disabled={loading}
            required
          />
          <FormField
            label="Available copies"
            type="number"
            min={0}
            value={availableCopies}
            onChange={(e) => setAvailableCopies(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <TextAreaField
          label="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />

        {authors.length > 0 && (
          <div className="mb-4">
            <span className="block text-sm font-medium text-slate-700 mb-1">Authors</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-slate-200 p-3">
              {authors.map((a) => (
                <label key={a.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={authorIds.includes(a.id)}
                    onChange={() => toggleAuthor(a.id)}
                    disabled={loading}
                    className="rounded border-slate-300 text-primary focus:ring-primary/40"
                  />
                  {a.fullName}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-6">
          <CheckboxField
            label="Digital only"
            checked={isDigitalOnly}
            onChange={(e) => setIsDigitalOnly(e.target.checked)}
            disabled={loading}
          />
          <CheckboxField label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={loading} />
        </div>

        <div className="flex gap-3 max-w-sm">
          <SubmitButton loading={loading}>{isEdit ? "Save changes" : "Add book"}</SubmitButton>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
