import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import {
  AUTH_LIBRARY_OVERLAY,
  AuthLibraryBackground,
  LIGHT_LIBRARY_OVERLAY,
} from "../components/auth/AuthLibraryBackground";
import { loginColors } from "../constants/loginTheme";
import { useTheme } from "../constants/theme";
import { examService, ExamQuestion, AnswerResult } from "../services/exam";

const ACCENT = loginColors.teal;
const ACCENT_DARK = loginColors.tealDark;
const ACCENT_LIGHT = "rgba(93, 202, 165, 0.16)";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
type Difficulty = "EASY" | "MEDIUM" | "HARD";

const SUMMARIES = [
  {
    course: "CS 301 - Algorithms",
    topics: [
      "Linked Lists: Sequential access structure. Search is O(n), insertion/deletion is O(1) if node pointer is known.",
      "Binary Trees: Tree hierarchy. BST search is O(log n) in balanced cases, degrading to O(n) in worst cases.",
      "Sorting: QuickSort (average O(n log n)) vs MergeSort (guaranteed O(n log n), requires extra memory).",
    ],
  },
  {
    course: "MATH 201 - Calculus",
    topics: [
      "Limits & Continuity: Fundamental limits boundary guidelines and continuity constraints.",
      "Derivatives: Rates of change formulas, chain rules, implicit derivatives models.",
      "Integrals: Anti-derivatives tracking, area under curve calculations, substitution methods.",
    ],
  },
];

export default function ExamMode() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"summaries" | "quiz" | "workspaces">("summaries");

  // AI quiz (paste-a-topic) states
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({}); // questionId -> selected letter
  const [results, setResults] = useState<Record<number, AnswerResult>>({}); // questionId -> graded result
  const [checkingId, setCheckingId] = useState<number | null>(null);

  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const handleGenerate = async () => {
    if (topic.trim().length < 3) {
      Alert.alert("Enter a topic", "Type a topic or paste some notes to generate a quiz.");
      return;
    }
    setGenerating(true);
    try {
      const res = await examService.generateFromTopic(topic.trim(), 5, difficulty);
      if (!res.questions || res.questions.length === 0) {
        throw new Error("No questions were generated. Try a more specific topic.");
      }
      setQuestions(res.questions);
      setAnswers({});
      setResults({});
    } catch (e: any) {
      Alert.alert("Couldn't generate quiz", e?.message || "Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = (questionId: number, letter: string) => {
    if (results[questionId]) return; // locked once graded
    setAnswers((prev) => ({ ...prev, [questionId]: letter }));
  };

  const handleCheck = async (questionId: number) => {
    const letter = answers[questionId];
    if (!letter) return;
    setCheckingId(questionId);
    try {
      const res = await examService.submitAnswer(questionId, letter);
      setResults((prev) => ({ ...prev, [questionId]: res }));
    } catch (e: any) {
      Alert.alert("Couldn't submit answer", e?.message || "Please try again.");
    } finally {
      setCheckingId(null);
    }
  };

  const handleNewQuiz = () => {
    setQuestions([]);
    setAnswers({});
    setResults({});
    setTopic("");
  };

  return (
    <View style={styles.screen}>
      <AuthLibraryBackground
        overlayColor={isDark ? AUTH_LIBRARY_OVERLAY : LIGHT_LIBRARY_OVERLAY}
      />
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
      {/* Back button with chevron icon */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonRow}>
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
          <Text style={[styles.backText, { color: ACCENT }]}>Back</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        AI Exam Mode
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Revision summaries, interactive quizzes, and shared academic workspaces.
      </Text>

      {/* Tab Selectors */}
      <View style={styles.roleTabs}>
        <Pressable
          style={[styles.roleTab, activeTab === "summaries" && styles.activeRoleTab]}
          onPress={() => setActiveTab("summaries")}
        >
          <Text style={[styles.roleTabText, activeTab === "summaries" && styles.activeRoleTabText, { color: activeTab === "summaries" ? ACCENT_DARK : colors.textMuted }]}>
            Summaries
          </Text>
        </Pressable>
        <Pressable
          style={[styles.roleTab, activeTab === "quiz" && styles.activeRoleTab]}
          onPress={() => setActiveTab("quiz")}
        >
          <Text style={[styles.roleTabText, activeTab === "quiz" && styles.activeRoleTabText, { color: activeTab === "quiz" ? ACCENT_DARK : colors.textMuted }]}>
            Quiz
          </Text>
        </Pressable>
        <Pressable
          style={[styles.roleTab, activeTab === "workspaces" && styles.activeRoleTab]}
          onPress={() => setActiveTab("workspaces")}
        >
          <Text style={[styles.roleTabText, activeTab === "workspaces" && styles.activeRoleTabText, { color: activeTab === "workspaces" ? ACCENT_DARK : colors.textMuted }]}>
            Workspaces
          </Text>
        </Pressable>
      </View>

      {/* REVISION SUMMARIES SECTION */}
      {activeTab === "summaries" && (
        <View style={styles.section}>
          {SUMMARIES.map((summ) => (
            <Card key={summ.course} style={[styles.summaryCard, isDark ? styles.cardDark : null, { marginBottom: spacing.md }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="sparkles-outline" size={16} color={ACCENT} style={{ marginRight: 6 }} />
                <Text style={[styles.courseCode, { color: ACCENT }]}>{summ.course}</Text>
              </View>

              <View style={styles.topicsList}>
                {summ.topics.map((t, idx) => (
                  <View key={idx} style={styles.topicRow}>
                    <Text style={[styles.topicDot, { color: ACCENT }]}>•</Text>
                    <Text style={[styles.topicText, { color: colors.text }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* AI PRACTICE QUIZ SECTION (paste-a-topic) */}
      {activeTab === "quiz" && (
        <View style={styles.section}>
          {questions.length === 0 ? (
            <Card style={[styles.quizCard, isDark ? styles.cardDark : null, { padding: spacing.md }]}>
              <Text style={[styles.questionNo, { color: ACCENT, marginBottom: spacing.xs }]}>GENERATE A QUIZ</Text>
              <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, marginBottom: spacing.md }]}>
                Enter a topic or paste some notes, and Libra will create a 5-question practice quiz.
              </Text>
              <TextInput
                style={[styles.topicInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Photosynthesis — or paste lecture notes"
                placeholderTextColor={colors.textMuted}
                multiline
                editable={!generating}
              />
              <View style={styles.diffRow}>
                {(["EASY", "MEDIUM", "HARD"] as Difficulty[]).map((d) => {
                  const active = difficulty === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDifficulty(d)}
                      style={[styles.diffChip, { borderColor: active ? ACCENT : colors.border, backgroundColor: active ? ACCENT_LIGHT : "transparent", borderRadius: borderRadius.round }]}
                    >
                      <Text style={[styles.diffChipText, { color: active ? ACCENT : colors.textMuted }]}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Button
                title={generating ? "Generating…" : "Generate quiz"}
                onPress={handleGenerate}
                disabled={generating}
                accentColor={ACCENT}
                textStyle={{ color: ACCENT_DARK }}
                style={{ marginTop: spacing.md }}
              />
              {generating && <ActivityIndicator style={{ marginTop: spacing.md }} color={ACCENT} />}
            </Card>
          ) : (
            <>
              {questions.map((q, qi) => {
                const options = [q.optionA, q.optionB, q.optionC, q.optionD];
                const selected = answers[q.id];
                const result = results[q.id];
                return (
                  <Card key={q.id} style={[styles.quizCard, isDark ? styles.cardDark : null, { padding: spacing.md, marginBottom: spacing.lg }]}>
                    <Text style={[styles.questionNo, { color: ACCENT, marginBottom: spacing.xs }]}>QUESTION {qi + 1} OF {questions.length}</Text>
                    <Text style={[styles.questionText, { color: colors.text, marginBottom: spacing.md }]}>{q.question}</Text>

                    {OPTION_LETTERS.map((letter, idx) => {
                      const optText = options[idx];
                      if (!optText) return null;
                      const isSelected = selected === letter;
                      let optionBg = colors.surface;
                      let optionBorder = colors.border;
                      let optionTextColor = colors.text;
                      if (isSelected && !result) {
                        optionBg = ACCENT_LIGHT;
                        optionBorder = ACCENT;
                        optionTextColor = ACCENT;
                      }
                      if (result) {
                        if (letter === result.correctAnswer) {
                          optionBg = colors.successLight;
                          optionBorder = colors.success;
                          optionTextColor = colors.success;
                        } else if (isSelected) {
                          optionBg = colors.dangerLight;
                          optionBorder = colors.danger;
                          optionTextColor = colors.danger;
                        }
                      }
                      return (
                        <Pressable
                          key={letter}
                          style={[styles.optionTile, { backgroundColor: optionBg, borderColor: optionBorder, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm }]}
                          onPress={() => handleSelect(q.id, letter)}
                        >
                          <Text style={[styles.optionTileText, { color: optionTextColor }]}>{letter}. {optText}</Text>
                          {result && letter === result.correctAnswer && (
                            <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginLeft: "auto" }} />
                          )}
                          {result && isSelected && letter !== result.correctAnswer && (
                            <Ionicons name="close-circle" size={18} color={colors.danger} style={{ marginLeft: "auto" }} />
                          )}
                        </Pressable>
                      );
                    })}

                    {result ? (
                      <View style={[styles.explanationContainer, { backgroundColor: result.isCorrect ? colors.successLight : colors.dangerLight, borderRadius: borderRadius.md, marginTop: spacing.sm }]}>
                        <Text style={[styles.explanationText, { color: result.isCorrect ? colors.success : colors.danger }]}>
                          {result.isCorrect ? "Correct! " : "Not quite. "}{result.explanation}
                        </Text>
                      </View>
                    ) : (
                      <Button
                        title={checkingId === q.id ? "Checking…" : "Check answer"}
                        onPress={() => handleCheck(q.id)}
                        disabled={!selected || checkingId === q.id}
                        accentColor={ACCENT}
                        textStyle={{ color: ACCENT_DARK }}
                        style={{ marginTop: spacing.xs }}
                      />
                    )}
                  </Card>
                );
              })}
              <Button
                title="New quiz"
                onPress={handleNewQuiz}
                accentColor={ACCENT}
                textStyle={{ color: ACCENT_DARK }}
                style={{ marginBottom: spacing.lg }}
              />
            </>
          )}
        </View>
      )}

      {/* SHARED STUDY WORKSPACES */}
      {activeTab === "workspaces" && (
        <View style={styles.section}>
          <Text style={[styles.subSectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Active Study Groups</Text>
          <Card style={[styles.summaryCard, isDark ? styles.cardDark : null, { padding: spacing.md, marginBottom: spacing.md }]}>
            <View style={styles.workspaceRow}>
              <View style={styles.workspaceLeft}>
                <Ionicons name="people-outline" size={24} color={ACCENT} style={{ marginRight: spacing.md }} />
                <View>
                  <Text style={[styles.workspaceTitle, { color: colors.text }]}>KNUST Algo study channel</Text>
                  <Text style={[styles.workspaceMembers, { color: colors.textMuted }]}>4 student nodes active now</Text>
                </View>
              </View>
              <Pressable style={[styles.joinBtn, { backgroundColor: ACCENT_LIGHT, borderRadius: borderRadius.round }]}>
                <Text style={[styles.joinText, { color: ACCENT }]}>Join</Text>
              </Pressable>
            </View>
          </Card>

          <Card style={[styles.summaryCard, isDark ? styles.cardDark : null, { padding: spacing.md, marginBottom: spacing.md }]}>
            <View style={styles.workspaceRow}>
              <View style={styles.workspaceLeft}>
                <Ionicons name="people-outline" size={24} color={colors.warning} style={{ marginRight: spacing.md }} />
                <View>
                  <Text style={[styles.workspaceTitle, { color: colors.text }]}>Calculus exam preparation</Text>
                  <Text style={[styles.workspaceMembers, { color: colors.textMuted }]}>2 online members</Text>
                </View>
              </View>
              <Pressable style={[styles.joinBtn, { backgroundColor: colors.warningLight, borderRadius: borderRadius.round }]}>
                <Text style={[styles.joinText, { color: colors.warning }]}>Join</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
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
      backgroundColor: ACCENT,
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
    summaryCard: {
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardDark: {
      backgroundColor: "rgba(24, 28, 51, 0.85)",
      borderColor: "rgba(255, 255, 255, 0.06)",
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    courseCode: {
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    topicsList: {
      gap: spacing.sm,
    },
    topicRow: {
      flexDirection: "row",
    },
    topicDot: {
      fontSize: 14,
      fontWeight: "800",
      marginRight: 6,
    },
    topicText: {
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },
    // Quiz styles
    quizCard: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    topicInput: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      minHeight: 88,
      textAlignVertical: "top",
      fontSize: 14,
    },
    diffRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    diffChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderWidth: 1.5,
    },
    diffChipText: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    questionNo: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    questionText: {
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
    },
    optionTile: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
    },
    optionTileText: {
      fontSize: 13,
      fontWeight: "600",
    },
    explanationContainer: {
      padding: spacing.md,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.05)",
    },
    explanationText: {
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 16,
    },
    quizActions: {
      flexDirection: "row",
    },
    // Workspace styles
    subSectionTitle: {
      fontSize: 15,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    workspaceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    workspaceLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    workspaceTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    workspaceMembers: {
      fontSize: 12,
      marginTop: 2,
    },
    joinBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
    },
    joinText: {
      fontSize: 12,
      fontWeight: "800",
    },
  });