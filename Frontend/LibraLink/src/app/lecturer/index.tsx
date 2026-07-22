import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
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
import { coursesService, CourseResponse, Institution } from "../../services/courses";

export default function LecturerHub() {
  const router = useRouter();
  const { firstName, roles, clearSession, loading: authLoading } = useAuth();
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");

  const isLecturer = roles.includes("LECTURER");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const inst = await coursesService.getInstitutions();
      setInstitutions(inst);
      const selected = institutionId ?? inst[0]?.institutionId ?? null;
      setInstitutionId(selected);
      if (selected != null) {
        const list = await coursesService.getCourses(selected);
        setCourses(list);
      } else {
        setCourses([]);
      }
    } catch (e: any) {
      Alert.alert("Could not load courses", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    if (!authLoading && isLecturer) {
      load();
    }
  }, [authLoading, isLecturer, load]);

  const handleCreateCourse = async () => {
    if (!institutionId || !courseName.trim()) {
      Alert.alert("Missing details", "Enter a course name.");
      return;
    }
    setCreating(true);
    try {
      await coursesService.createCourse({
        name: courseName.trim(),
        code: courseCode.trim() || undefined,
        institutionId,
        description: "Lecture-to-Library course workspace",
      });
      setCourseName("");
      setCourseCode("");
      setShowCreate(false);
      await load();
    } catch (e: any) {
      Alert.alert("Create failed", e?.message || "Could not create course.");
    } finally {
      setCreating(false);
    }
  };

  if (authLoading) {
    return (
      <ScreenWrapper contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <ActivityIndicator color={colors.primary} />
      </ScreenWrapper>
    );
  }

  if (!isLecturer) {
    return (
      <ScreenWrapper contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Lecturer Portal</Text>
        <Text style={{ color: colors.textMuted, marginBottom: spacing.lg }}>
          Sign in with a lecturer account to manage Lecture-to-Library integration.
        </Text>
        <Button title="Go to lecturer sign in" onPress={() => router.replace("/lecturer-signin" as any)} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Institutional tier</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {firstName ? `Hello, ${firstName}` : "Lecturer Portal"}
          </Text>
        </View>
        <Pressable
          onPress={async () => {
            await clearSession();
            router.replace("/" as any);
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign out</Text>
        </Pressable>
      </View>

      <Card style={styles.heroCard}>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Lecture-to-Library Integration</Text>
        <Text style={[styles.heroBody, { color: colors.textMuted }]}>
          Link lecture materials and reading lists to library resources. When a referenced title is
          low in stock, librarians are alerted so stock can be replenished before student demand peaks.
        </Text>
      </Card>

      <Card style={styles.heroCard}>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Course Reading List Module</Text>
        <Text style={[styles.heroBody, { color: colors.textMuted }]}>
          Create and publish official lists per course and semester — required, recommended, and
          further reading — assigned straight from the catalogue.
        </Text>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your institution</Text>
      <View style={styles.chipRow}>
        {institutions.map((inst) => {
          const active = inst.institutionId === institutionId;
          return (
            <Pressable
              key={inst.institutionId}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setInstitutionId(inst.institutionId)}
            >
              <Text style={{ color: active ? colors.textLight : colors.text, fontWeight: "600" }}>
                {inst.shortName || inst.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Courses</Text>
        <Pressable onPress={() => setShowCreate((v) => !v)}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {showCreate ? "Cancel" : "+ New course"}
          </Text>
        </Pressable>
      </View>

      {showCreate && (
        <Card style={styles.createCard}>
          <TextInput
            placeholder="Course name (e.g. African Literature)"
            placeholderTextColor={colors.textMuted}
            value={courseName}
            onChangeText={setCourseName}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <TextInput
            placeholder="Code (e.g. ENGL 301)"
            placeholderTextColor={colors.textMuted}
            value={courseCode}
            onChangeText={setCourseCode}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <Button
            title={creating ? "Creating..." : "Create course"}
            onPress={handleCreateCourse}
            loading={creating}
          />
        </Card>
      )}

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />}

      {!loading && courses.length === 0 && (
        <Text style={{ color: colors.textMuted }}>
          No courses yet. Create a course to start linking lecture resources and reading lists.
        </Text>
      )}

      {courses.map((course) => (
        <Pressable
          key={course.id}
          onPress={() => router.push(`/lecturer/${course.id}` as any)}
        >
          <Card style={styles.courseCard}>
            <View style={styles.courseRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.courseCode, { color: colors.primary }]}>
                  {course.code || "COURSE"}
                </Text>
                <Text style={[styles.courseName, { color: colors.text }]}>{course.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  Open to manage reading lists & catalogue links
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.borderDark} />
            </View>
          </Card>
        </Pressable>
      ))}
    </ScreenWrapper>
  );
}

function createStyles(
  colors: any,
  spacing: any,
  borderRadius: any,
  typography: any,
  isDark: boolean
) {
  return StyleSheet.create({
    container: { flexGrow: 1 },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.md,
    },
    eyebrow: { fontSize: 12, fontWeight: "600", marginBottom: 4, textTransform: "uppercase" },
    title: { fontSize: typography.titleMedium.fontSize, fontWeight: "800" },
    heroCard: { marginBottom: spacing.md, padding: spacing.md },
    heroTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing.xs },
    heroBody: { fontSize: 14, lineHeight: 20 },
    sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing.sm, marginTop: spacing.sm },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
    },
    createCard: { marginBottom: spacing.md, gap: spacing.sm },
    input: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: spacing.sm,
    },
    courseCard: { marginBottom: spacing.sm },
    courseRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    courseCode: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
    courseName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
    surface: { backgroundColor: isDark ? colors.surface : colors.surface },
  });
}
