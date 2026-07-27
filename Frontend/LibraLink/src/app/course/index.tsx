import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/common/Card";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { Book, bookAuthorName, isBookAvailable } from "../../services/books";
import {
  coursesService,
  CourseResponse,
  ProgressStatus,
  ReadingListItemResponse,
  ReadingListResponse,
  ReadingProgressResponse,
} from "../../services/courses";

type EnrichedItem = ReadingListItemResponse & {
  book?: Book;
  progress?: string;
};

export default function CourseReadingLists() {
  const router = useRouter();
  const { userId, token, institutionId } = useAuth();
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [listsByCourse, setListsByCourse] = useState<Record<number, ReadingListResponse[]>>({});
  const [itemsByList, setItemsByList] = useState<Record<number, EnrichedItem[]>>({});
  const [progressMap, setProgressMap] = useState<Record<number, string>>({});
  const [bookMap, setBookMap] = useState<Map<number, Book>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [institutions, books, progress] = await Promise.all([
        coursesService.getInstitutions(),
        coursesService.getCatalogueBooks(),
        userId && token
          ? coursesService.getProgressForStudent(userId).catch(() => [] as ReadingProgressResponse[])
          : Promise.resolve([] as ReadingProgressResponse[]),
      ]);

      const map = new Map<number, Book>();
      books.forEach((b) => map.set(b.id, b));
      setBookMap(map);

      const pMap: Record<number, string> = {};
      progress.forEach((p) => {
        pMap[p.listItemId] = p.status;
      });
      setProgressMap(pMap);

      const selectedInstitutionId = institutionId ?? institutions[0]?.institutionId;
      if (selectedInstitutionId == null) {
        setCourses([]);
        return;
      }

      const courseList = await coursesService.getCourses(selectedInstitutionId);
      setCourses(courseList);

      const listsMap: Record<number, ReadingListResponse[]> = {};
      await Promise.all(
        courseList.map(async (course) => {
          const lists = await coursesService.getReadingLists(course.id).catch(() => []);
          listsMap[course.id] = lists.filter((l) => l.isPublished);
        })
      );
      setListsByCourse(listsMap);

      if (courseList[0]) {
        setExpandedCourse(courseList[0].id);
      }
    } catch (e: any) {
      Alert.alert("Could not load courses", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId, token, institutionId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadItemsForCourse = async (courseId: number) => {
    const lists = listsByCourse[courseId] || [];
    const next: Record<number, EnrichedItem[]> = { ...itemsByList };
    await Promise.all(
      lists.map(async (list) => {
        if (next[list.id]) return;
        const items = await coursesService.getReadingListItems(list.id).catch(() => []);
        next[list.id] = items.map((item) => ({
          ...item,
          book: bookMap.get(item.bookId),
          progress: progressMap[item.id],
        }));
      })
    );
    setItemsByList(next);
  };

  useEffect(() => {
    if (expandedCourse != null) {
      loadItemsForCourse(expandedCourse);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedCourse, listsByCourse, bookMap, progressMap]);

  const setProgress = async (itemId: number, status: ProgressStatus) => {
    if (!userId) {
      Alert.alert("Sign in required", "Sign in as a student to track reading progress.");
      return;
    }
    try {
      await coursesService.updateProgress(userId, itemId, status);
      setProgressMap((prev) => ({ ...prev, [itemId]: status }));
      setItemsByList((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          const listId = Number(key);
          updated[listId] = updated[listId].map((item) =>
            item.id === itemId ? { ...item, progress: status } : item
          );
        });
        return updated;
      });
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Could not update progress.");
    }
  };

  const publishedCourseCount = useMemo(
    () => courses.filter((c) => (listsByCourse[c.id] || []).length > 0).length,
    [courses, listsByCourse]
  );

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Back</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]}>Course Reading Lists</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Official lecture-aligned resources for your courses — availability, borrow status, and personal progress in one place.
      </Text>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />}

      {!loading && courses.length === 0 && (
        <Text style={{ color: colors.textMuted }}>
          No courses are linked yet. When staff publish reading lists, they will appear here.
        </Text>
      )}

      {!loading && courses.length > 0 && publishedCourseCount === 0 && (
        <Card style={styles.infoCard}>
          <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 4 }}>
            Waiting for published lists
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            Courses exist, but staff have not published reading lists yet.
          </Text>
        </Card>
      )}

      {courses.map((course) => {
        const lists = listsByCourse[course.id] || [];
        const expanded = expandedCourse === course.id;
        return (
          <Card key={course.id} style={styles.courseCard}>
            <Pressable
              onPress={() => setExpandedCourse(expanded ? null : course.id)}
              style={styles.courseHeader}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                  {course.code || "COURSE"}
                </Text>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
                  {course.name}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  {lists.length} published list{lists.length === 1 ? "" : "s"}
                </Text>
              </View>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.borderDark}
              />
            </Pressable>

            {expanded &&
              lists.map((list) => (
                <View key={list.id} style={styles.listBlock}>
                  <Text style={{ color: colors.text, fontWeight: "700", marginBottom: 6 }}>
                    {list.title}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8 }}>
                    {list.semester || "Semester"} · {list.academicYear || ""}
                  </Text>
                  {(itemsByList[list.id] || []).map((item) => {
                    const book = item.book || bookMap.get(item.bookId);
                    const available = book ? isBookAvailable(book) : false;
                    const status = item.progress || progressMap[item.id] || "not started";
                    return (
                      <View key={item.id} style={[styles.itemRow, { borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: "600" }}>
                            {book?.title || `Book #${item.bookId}`}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                            {book ? bookAuthorName(book) : "—"} · {(item.notes || "REQUIRED").toUpperCase()}
                          </Text>
                          <Text
                            style={{
                              color: available ? colors.success : colors.danger,
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {available
                              ? `${book?.availableCopies ?? 0} available — borrow/reserve from catalogue`
                              : "Currently unavailable — reserve when ready"}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                            Progress: {status}
                          </Text>
                        </View>
                        <View style={styles.actions}>
                          <Pressable onPress={() => router.push(`/book/${item.bookId}` as any)}>
                            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                              Open
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => setProgress(item.id, "reading")}>
                            <Text style={{ color: colors.textMuted, fontSize: 11 }}>Reading</Text>
                          </Pressable>
                          <Pressable onPress={() => setProgress(item.id, "completed")}>
                            <Text style={{ color: colors.textMuted, fontSize: 11 }}>Done</Text>
                          </Pressable>
                          <Pressable onPress={() => setProgress(item.id, "saved")}>
                            <Text style={{ color: colors.textMuted, fontSize: 11 }}>Later</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                  {(itemsByList[list.id] || []).length === 0 && (
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>Loading titles…</Text>
                  )}
                </View>
              ))}

            {expanded && lists.length === 0 && (
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: spacing.sm }}>
                No published reading list for this course yet.
              </Text>
            )}
          </Card>
        );
      })}
    </ScreenWrapper>
  );
}

function createStyles(
  colors: any,
  spacing: any,
  borderRadius: any,
  typography: any,
  _isDark: boolean
) {
  return StyleSheet.create({
    container: { flexGrow: 1 },
    backButton: { marginBottom: spacing.sm },
    backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    title: { fontSize: typography.titleMedium.fontSize, fontWeight: "800", marginBottom: 4 },
    subtitle: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
    infoCard: { marginBottom: spacing.md },
    courseCard: { marginBottom: spacing.md },
    courseHeader: { flexDirection: "row", alignItems: "center" },
    listBlock: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    itemRow: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      flexDirection: "row",
      gap: 8,
    },
    actions: { alignItems: "flex-end", gap: 6, justifyContent: "center" },
  });
}
