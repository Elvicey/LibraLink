import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/common/Card";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import Button from "../../components/common/Button";
import { useTheme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { Book, bookAuthorName } from "../../services/books";
import {
  coursesService,
  CourseResponse,
  ReadingListItemResponse,
  ReadingListResponse,
  ReadingPriority,
} from "../../services/courses";

export default function LecturerCourseScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = Number(courseId);
  const router = useRouter();
  const { userId } = useAuth();
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [lists, setLists] = useState<ReadingListResponse[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [items, setItems] = useState<ReadingListItemResponse[]>([]);
  const [catalogue, setCatalogue] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [listTitle, setListTitle] = useState("");
  const [semester, setSemester] = useState("Semester 1");
  const [priority, setPriority] = useState<ReadingPriority>("REQUIRED");
  const [bookQuery, setBookQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const bookMap = useMemo(() => {
    const map = new Map<number, Book>();
    catalogue.forEach((b) => map.set(b.id, b));
    (course?.books || []).forEach((b) => map.set(b.id, b));
    return map;
  }, [catalogue, course]);

  const lowStock = useMemo(
    () =>
      (course?.books || []).filter((b) => (b.availableCopies ?? 0) <= 1),
    [course]
  );

  const filteredBooks = useMemo(() => {
    const q = bookQuery.trim().toLowerCase();
    if (!q) return catalogue.slice(0, 12);
    return catalogue
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          bookAuthorName(b).toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [bookQuery, catalogue]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, readingLists, books] = await Promise.all([
        coursesService.getCourse(id),
        coursesService.getReadingLists(id),
        coursesService.getCatalogueBooks(),
      ]);
      setCourse(c);
      setLists(readingLists);
      setCatalogue(books);
      const nextListId = selectedListId ?? readingLists[0]?.id ?? null;
      setSelectedListId(nextListId);
      if (nextListId != null) {
        setItems(await coursesService.getReadingListItems(nextListId));
      } else {
        setItems([]);
      }
    } catch (e: any) {
      Alert.alert("Load failed", e?.message || "Could not load course.");
    } finally {
      setLoading(false);
    }
  }, [id, selectedListId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const refreshListItems = async (listId: number) => {
    setSelectedListId(listId);
    setItems(await coursesService.getReadingListItems(listId));
  };

  const createList = async () => {
    if (!listTitle.trim()) {
      Alert.alert("Title required", "Name this reading list.");
      return;
    }
    setBusy(true);
    try {
      const created = await coursesService.createReadingList({
        courseId: id,
        createdBy: userId ?? undefined,
        title: listTitle.trim(),
        semester,
        academicYear: "2025/2026",
        description: "Official course reading list",
      });
      setListTitle("");
      setLists((prev) => [created, ...prev]);
      await refreshListItems(created.id);
      Alert.alert("Created", "Reading list created. Add books, then publish for students.");
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not create list.");
    } finally {
      setBusy(false);
    }
  };

  const publishList = async (list: ReadingListResponse) => {
    setBusy(true);
    try {
      const updated = await coursesService.publishReadingList(list.id, !list.isPublished);
      setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      Alert.alert(
        updated.isPublished ? "Published" : "Unpublished",
        updated.isPublished
          ? "Students can now see this reading list for the course."
          : "List hidden from students."
      );
    } catch (e: any) {
      Alert.alert("Publish failed", e?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  };

  const assignBook = async (book: Book) => {
    if (!selectedListId) {
      Alert.alert("Select a list", "Create or select a reading list first.");
      return;
    }
    setBusy(true);
    try {
      await coursesService.addBookToReadingList(selectedListId, book.id, priority);
      await coursesService.linkBooksToCourse(id, [book.id]).catch(() => null);
      const [itemsNext, courseNext] = await Promise.all([
        coursesService.getReadingListItems(selectedListId),
        coursesService.getCourse(id),
      ]);
      setItems(itemsNext);
      setCourse(courseNext);
      if ((book.availableCopies ?? 0) <= 1) {
        Alert.alert(
          "Low stock alert sent",
          `"${book.title}" has low availability. Librarians have been notified to replenish stock.`
        );
      } else {
        Alert.alert("Assigned", `"${book.title}" added as ${priority}.`);
      }
    } catch (e: any) {
      Alert.alert("Assign failed", e?.message || "Could not assign book.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <ActivityIndicator color={colors.primary} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Courses</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]}>{course?.name || "Course"}</Text>
      <Text style={{ color: colors.textMuted, marginBottom: spacing.md }}>
        {course?.code || "—"} · Link lecture references to catalogue titles and publish reading lists
      </Text>

      {lowStock.length > 0 && (
        <Card style={[styles.alertCard, { borderColor: colors.warning }]}>
          <Text style={{ color: colors.warning, fontWeight: "700", marginBottom: 4 }}>
            Low stock on linked titles
          </Text>
          {lowStock.map((b) => (
            <Text key={b.id} style={{ color: colors.textMuted, fontSize: 13 }}>
              • {b.title} ({b.availableCopies ?? 0} available)
            </Text>
          ))}
        </Card>
      )}

      <Text style={[styles.section, { color: colors.text }]}>Create reading list</Text>
      <Card style={styles.block}>
        <TextInput
          placeholder="e.g. ENGL 301 Required Reading — Sem 1"
          placeholderTextColor={colors.textMuted}
          value={listTitle}
          onChangeText={setListTitle}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
        <TextInput
          placeholder="Semester"
          placeholderTextColor={colors.textMuted}
          value={semester}
          onChangeText={setSemester}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
        <Button title={busy ? "Working..." : "Create list"} onPress={createList} loading={busy} />
      </Card>

      <Text style={[styles.section, { color: colors.text }]}>Reading lists</Text>
      {lists.length === 0 && (
        <Text style={{ color: colors.textMuted, marginBottom: spacing.md }}>
          No lists yet. Create one to bulk-assign catalogue books.
        </Text>
      )}
      {lists.map((list) => {
        const active = list.id === selectedListId;
        return (
          <Card key={list.id} style={[styles.listCard, active && { borderColor: colors.primary, borderWidth: 1 }]}>
            <Pressable onPress={() => refreshListItems(list.id)}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>{list.title}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                {list.semester || "Semester"} · {list.isPublished ? "Published" : "Draft"}
              </Text>
            </Pressable>
            <View style={styles.listActions}>
              <Pressable onPress={() => publishList(list)}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  {list.isPublished ? "Unpublish" : "Publish"}
                </Text>
              </Pressable>
            </View>
          </Card>
        );
      })}

      <Text style={[styles.section, { color: colors.text }]}>List items</Text>
      {items.length === 0 ? (
        <Text style={{ color: colors.textMuted, marginBottom: spacing.md }}>
          No titles on this list yet.
        </Text>
      ) : (
        items.map((item) => {
          const book = bookMap.get(item.bookId);
          return (
            <Card key={item.id} style={styles.itemCard}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                {book?.title || `Book #${item.bookId}`}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {item.notes || "REQUIRED"} · {book ? `${book.availableCopies ?? 0} available` : "—"}
              </Text>
            </Card>
          );
        })
      )}

      <Text style={[styles.section, { color: colors.text }]}>Assign from catalogue</Text>
      <View style={styles.priorityRow}>
        {(["REQUIRED", "RECOMMENDED", "FURTHER"] as ReadingPriority[]).map((p) => (
          <Pressable
            key={p}
            style={[
              styles.priorityChip,
              {
                backgroundColor: priority === p ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setPriority(p)}
          >
            <Text style={{ color: priority === p ? colors.textLight : colors.text, fontSize: 12, fontWeight: "700" }}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        placeholder="Search catalogue titles..."
        placeholderTextColor={colors.textMuted}
        value={bookQuery}
        onChangeText={setBookQuery}
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      />
      {filteredBooks.map((book) => (
        <Card key={book.id} style={styles.itemCard}>
          <View style={styles.assignRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>{book.title}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {bookAuthorName(book)} · {book.availableCopies ?? 0} available
              </Text>
            </View>
            <Pressable onPress={() => assignBook(book)} disabled={busy}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Assign</Text>
            </Pressable>
          </View>
        </Card>
      ))}
    </ScreenWrapper>
  );
}

function createStyles(
  colors: any,
  spacing: any,
  borderRadius: any,
  _typography: any,
  _isDark: boolean
) {
  return StyleSheet.create({
    container: { flexGrow: 1 },
    backButton: { marginBottom: spacing.sm },
    backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    title: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
    section: { fontSize: 16, fontWeight: "700", marginTop: spacing.md, marginBottom: spacing.sm },
    block: { marginBottom: spacing.sm },
    input: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: spacing.sm,
    },
    alertCard: { marginBottom: spacing.md, borderWidth: 1 },
    listCard: { marginBottom: spacing.sm },
    listActions: { marginTop: spacing.sm, flexDirection: "row", justifyContent: "flex-end" },
    itemCard: { marginBottom: spacing.sm },
    assignRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    priorityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.sm },
    priorityChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
    },
  });
}
