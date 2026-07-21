import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";

interface Textbook {
  id: string;
  title: string;
  author: string;
  available: boolean;
}

interface Course {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  books: Textbook[];
}

const INITIAL_COURSES: Course[] = [
  {
    id: "cs301",
    code: "CS 301",
    name: "Data Structures & Algorithms",
    lecturer: "Dr. O. Asiedu",
    books: [
      { id: "101", title: "Data Structures in Practice", author: "KNUST Collection", available: true },
      { id: "102", title: "Introduction to Algorithms", author: "Cormen et al.", available: false },
    ],
  },
  {
    id: "math201",
    code: "MATH 201",
    name: "Linear Algebra & Calculus",
    lecturer: "Prof. J. Stewart",
    books: [
      { id: "201", title: "Introduction to Calculus", author: "J. Stewart", available: true },
    ],
  },
  {
    id: "econ402",
    code: "ECON 402",
    name: "Applied African Economics",
    lecturer: "Dr. A. Smith",
    books: [
      { id: "301", title: "African Economics", author: "A. Smith", available: true },
    ],
  },
];

export default function CourseReadingLists() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialMode = params.mode === "librarian" ? "librarian" : "student";
  
  const [mode, setMode] = useState<"student" | "librarian">(initialMode as any);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [expandedCourse, setExpandedCourse] = useState<string | null>("cs301");
  
  // Form fields for librarian adding a book
  const [selectedCourseId, setSelectedCourseId] = useState("cs301");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const handleToggleExpand = (courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  const handleAssignBook = () => {
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id === selectedCourseId) {
          const newBook: Textbook = {
            id: Date.now().toString(),
            title: bookTitle,
            author: bookAuthor,
            available: true,
          };
          return {
            ...c,
            books: [...c.books, newBook],
          };
        }
        return c;
      })
    );

    // Reset inputs
    setBookTitle("");
    setBookAuthor("");
  };

  const handleRemoveBook = (courseId: string, bookId: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            books: c.books.filter((b) => b.id !== bookId),
          };
        }
        return c;
      })
    );
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      {/* Back navigation header */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Course Reading Lists
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Required textbooks and academic references assigned per course at KNUST.
      </Text>

      {/* Role view switcher toggle */}
      <View style={styles.roleTabs}>
        <Pressable
          style={[styles.roleTab, mode === "student" && styles.activeRoleTab]}
          onPress={() => setMode("student")}
        >
          <Text style={[styles.roleTabText, mode === "student" && styles.activeRoleTabText, { color: mode === "student" ? colors.textLight : colors.textMuted }]}>
            Student View
          </Text>
        </Pressable>
        <Pressable
          style={[styles.roleTab, mode === "librarian" && styles.activeRoleTab]}
          onPress={() => setMode("librarian")}
        >
          <Text style={[styles.roleTabText, mode === "librarian" && styles.activeRoleTabText, { color: mode === "librarian" ? colors.textLight : colors.textMuted }]}>
            Librarian View
          </Text>
        </Pressable>
      </View>

      {/* Student Course Expandable Textbooks List */}
      {mode === "student" && (
        <View style={styles.section}>
          {courses.map((course) => {
            const isExpanded = expandedCourse === course.id;
            return (
              <Card key={course.id} style={[styles.courseCard, isDark ? styles.cardDark : null, { marginBottom: spacing.md }]}>
                <Pressable onPress={() => handleToggleExpand(course.id)} style={styles.courseHeader}>
                  <View style={styles.courseTitleStack}>
                    <Text style={[styles.courseCode, { color: colors.primary }]}>{course.code}</Text>
                    <Text style={[styles.courseName, { color: colors.text }]}>{course.name}</Text>
                    <Text style={[styles.lecturerName, { color: colors.textMuted }]}>{course.lecturer}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>

                {isExpanded && (
                  <View style={[styles.booksContainer, { borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md }]}>
                    <Text style={[styles.assignedHeader, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                      ASSIGNED TEXTBOOKS ({course.books.length})
                    </Text>
                    {course.books.length === 0 ? (
                      <Text style={[styles.noBooksText, { color: colors.textMuted }]}>No textbooks assigned yet.</Text>
                    ) : (
                      course.books.map((book) => (
                        <View key={book.id} style={[styles.bookRow, { borderColor: colors.border, paddingVertical: spacing.sm }]}>
                          <View style={styles.bookIconWrapper}>
                            <Ionicons name="book-outline" size={18} color={colors.primary} />
                          </View>
                          <View style={styles.bookDetails}>
                            <Text style={[styles.bookTitle, { color: colors.text }]}>{book.title}</Text>
                            <Text style={[styles.bookAuthor, { color: colors.textMuted }]}>{book.author}</Text>
                          </View>
                          
                          {/* Availability Tag */}
                          <View style={[styles.availabilityBadge, { backgroundColor: book.available ? colors.successLight : colors.dangerLight }]}>
                            <Text style={[styles.availabilityText, { color: book.available ? colors.success : colors.danger }]}>
                              {book.available ? "Available" : "On Loan"}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {/* Librarian Course Readings Assignment Tool */}
      {mode === "librarian" && (
        <View style={styles.section}>
          {/* Assignment form card */}
          <Text style={[styles.subSectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Assign Book to Course</Text>
          <Card style={[styles.formCard, isDark ? styles.cardDark : null, { padding: spacing.md, marginBottom: spacing.lg }]}>
            
            {/* Course select drop grid */}
            <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: spacing.sm }]}>Select Course</Text>
            <View style={styles.courseSelectGrid}>
              {courses.map((c) => (
                <Pressable
                  key={c.id}
                  style={[
                    styles.courseSelectTile,
                    selectedCourseId === c.id && { borderColor: colors.primary, backgroundColor: isDark ? "rgba(11, 110, 253, 0.12)" : colors.primaryLight },
                    { borderColor: colors.border, borderRadius: borderRadius.md },
                  ]}
                  onPress={() => setSelectedCourseId(c.id)}
                >
                  <Text style={[styles.courseSelectCode, selectedCourseId === c.id && { color: colors.primary }, { color: colors.text }]}>
                    {c.code}
                  </Text>
                  <Text style={[styles.courseSelectSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {c.lecturer}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Input
              label="Textbook Title"
              placeholder="e.g. Data Structures and Algorithms"
              value={bookTitle}
              onChangeText={setBookTitle}
              leftIcon={<Ionicons name="book-outline" size={20} color={colors.textMuted} />}
              variant={isDark ? "glass" : "light"}
            />
            <Input
              label="Author Name"
              placeholder="e.g. Robert Sedgewick"
              value={bookAuthor}
              onChangeText={setBookAuthor}
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.textMuted} />}
              variant={isDark ? "glass" : "light"}
            />

            <Button
              title="Assign Book"
              onPress={handleAssignBook}
              icon={<Ionicons name="add-circle-outline" size={18} color={colors.textLight} />}
              style={{ marginTop: spacing.xs }}
            />
          </Card>

          {/* Manage Assigned Readings */}
          <Text style={[styles.subSectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Manage Readings</Text>
          {courses.map((course) => (
            <Card key={course.id} style={[styles.courseCard, isDark ? styles.cardDark : null, { marginBottom: spacing.md, padding: spacing.md }]}>
              <View style={styles.manageHeader}>
                <Text style={[styles.courseCode, { color: colors.primary }]}>{course.code}</Text>
                <Text style={[styles.courseNameLabel, { color: colors.text }]}>{course.name}</Text>
              </View>
              
              <View style={{ marginTop: spacing.sm }}>
                {course.books.length === 0 ? (
                  <Text style={[styles.noBooksText, { color: colors.textMuted }]}>No textbooks assigned.</Text>
                ) : (
                  course.books.map((book) => (
                    <View key={book.id} style={[styles.manageBookRow, { borderBottomColor: colors.border }]}>
                      <View style={{ flex: 1, marginRight: spacing.md }}>
                        <Text style={[styles.bookTitle, { color: colors.text }]}>{book.title}</Text>
                        <Text style={[styles.bookAuthor, { color: colors.textMuted }]}>{book.author}</Text>
                      </View>
                      <Pressable
                        onPress={() => handleRemoveBook(course.id, book.id)}
                        style={[styles.removeButton, { backgroundColor: colors.dangerLight }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: "transparent",
    },
    backButton: {
      marginBottom: 16,
      alignSelf: "flex-start",
    },
    backButtonRow: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: -4,
    },
    backText: {
      fontWeight: "700",
      fontSize: 16,
    },
    title: {
      fontWeight: "800",
    },
    description: {
      fontWeight: "500",
    },
    roleTabs: {
      flexDirection: "row",
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: colors.border,
      borderWidth: 1.2,
      borderRadius: borderRadius.xl,
      padding: 4,
      marginBottom: spacing.lg,
    },
    roleTab: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.lg,
    },
    activeRoleTab: {
      backgroundColor: colors.primary,
    },
    roleTabText: {
      fontSize: 14,
      fontWeight: "700",
    },
    activeRoleTabText: {
      fontWeight: "800",
    },
    section: {
      marginTop: spacing.xs,
    },
    courseCard: {
      padding: spacing.md,
    },
    cardDark: {
      backgroundColor: "rgba(24, 28, 51, 0.85)",
      borderColor: "rgba(255, 255, 255, 0.06)",
      borderWidth: 1,
    },
    courseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    courseTitleStack: {
      flex: 1,
      marginRight: spacing.md,
    },
    courseCode: {
      fontSize: 14,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    courseName: {
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 20,
    },
    lecturerName: {
      fontSize: 12,
      marginTop: 2,
      fontWeight: "500",
    },
    booksContainer: {
      borderTopWidth: 1,
    },
    assignedHeader: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    noBooksText: {
      fontSize: 13,
      fontStyle: "italic",
    },
    bookRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    bookIconWrapper: {
      marginRight: spacing.sm,
    },
    bookDetails: {
      flex: 1,
      marginRight: spacing.md,
    },
    bookTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    bookAuthor: {
      fontSize: 12,
      marginTop: 2,
    },
    availabilityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    availabilityText: {
      fontSize: 9,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    // Librarian View styles
    subSectionTitle: {
      fontSize: 15,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    formCard: {
      padding: spacing.md,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: "700",
    },
    courseSelectGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    courseSelectTile: {
      flex: 1,
      padding: spacing.sm,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    courseSelectCode: {
      fontSize: 13,
      fontWeight: "800",
    },
    courseSelectSub: {
      fontSize: 10,
      marginTop: 2,
    },
    manageHeader: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.05)",
      paddingBottom: 6,
    },
    courseNameLabel: {
      fontSize: 14,
      fontWeight: "700",
      marginLeft: spacing.sm,
    },
    manageBookRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.03)",
    },
    removeButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
  });
