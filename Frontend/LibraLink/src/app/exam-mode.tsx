import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

const SAMPLE_QUIZ: QuizQuestion = {
  id: "q1",
  question: "Which of the following data structures has an average search time complexity of O(1)?",
  options: [
    "A. Binary Search Tree",
    "B. Singly Linked List",
    "C. Hash Table",
    "D. Doubly Linked List",
  ],
  correctIdx: 2,
  explanation: "Correct! Hash Tables map keys to values using a hashing function, yielding average constant time O(1) lookup.",
};

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
  
  // Quiz answers states
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [quizEvaluated, setQuizEvaluated] = useState(false);
  
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const handleSelectOption = (idx: number) => {
    if (quizEvaluated) return;
    setSelectedOptionIdx(idx);
  };

  const handleEvaluate = () => {
    if (selectedOptionIdx === null) return;
    setQuizEvaluated(true);
  };

  const handleResetQuiz = () => {
    setSelectedOptionIdx(null);
    setQuizEvaluated(false);
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      {/* Back button with chevron icon */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
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
          <Text style={[styles.roleTabText, activeTab === "summaries" && styles.activeRoleTabText, { color: activeTab === "summaries" ? colors.textLight : colors.textMuted }]}>
            Summaries
          </Text>
        </Pressable>
        <Pressable
          style={[styles.roleTab, activeTab === "quiz" && styles.activeRoleTab]}
          onPress={() => setActiveTab("quiz")}
        >
          <Text style={[styles.roleTabText, activeTab === "quiz" && styles.activeRoleTabText, { color: activeTab === "quiz" ? colors.textLight : colors.textMuted }]}>
            Quiz
          </Text>
        </Pressable>
        <Pressable
          style={[styles.roleTab, activeTab === "workspaces" && styles.activeRoleTab]}
          onPress={() => setActiveTab("workspaces")}
        >
          <Text style={[styles.roleTabText, activeTab === "workspaces" && styles.activeRoleTabText, { color: activeTab === "workspaces" ? colors.textLight : colors.textMuted }]}>
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
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.courseCode, { color: colors.primary }]}>{summ.course}</Text>
              </View>
              
              <View style={styles.topicsList}>
                {summ.topics.map((t, idx) => (
                  <View key={idx} style={styles.topicRow}>
                    <Text style={[styles.topicDot, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.topicText, { color: colors.text }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* PRACTICE QUIZ SECTION */}
      {activeTab === "quiz" && (
        <View style={styles.section}>
          <Card style={[styles.quizCard, isDark ? styles.cardDark : null, { padding: spacing.md, marginBottom: spacing.lg }]}>
            <Text style={[styles.questionNo, { color: colors.primary, marginBottom: spacing.xs }]}>PRACTICE QUESTION</Text>
            <Text style={[styles.questionText, { color: colors.text, marginBottom: spacing.md }]}>
              {SAMPLE_QUIZ.question}
            </Text>

            {/* Multiple Choice Options Grid */}
            {SAMPLE_QUIZ.options.map((opt, idx) => {
              const isSelected = selectedOptionIdx === idx;
              let optionBg = colors.surface;
              let optionBorder = colors.border;
              let optionTextColor = colors.text;

              if (isSelected) {
                optionBg = isDark ? "rgba(11, 110, 253, 0.12)" : colors.primaryLight;
                optionBorder = colors.primary;
                optionTextColor = colors.primary;
              }

              if (quizEvaluated) {
                if (idx === SAMPLE_QUIZ.correctIdx) {
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
                  key={idx}
                  style={[
                    styles.optionTile,
                    {
                      backgroundColor: optionBg,
                      borderColor: optionBorder,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                  onPress={() => handleSelectOption(idx)}
                >
                  <Text style={[styles.optionTileText, { color: optionTextColor }]}>{opt}</Text>
                  {quizEvaluated && idx === SAMPLE_QUIZ.correctIdx && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginLeft: "auto" }} />
                  )}
                  {quizEvaluated && isSelected && idx !== SAMPLE_QUIZ.correctIdx && (
                    <Ionicons name="close-circle" size={18} color={colors.danger} style={{ marginLeft: "auto" }} />
                  )}
                </Pressable>
              );
            })}

            {/* Explanation box */}
            {quizEvaluated && (
              <View style={[styles.explanationContainer, { backgroundColor: selectedOptionIdx === SAMPLE_QUIZ.correctIdx ? colors.successLight : colors.dangerLight, borderRadius: borderRadius.md, marginTop: spacing.md }]}>
                <Text style={[styles.explanationText, { color: selectedOptionIdx === SAMPLE_QUIZ.correctIdx ? colors.success : colors.danger }]}>
                  {selectedOptionIdx === SAMPLE_QUIZ.correctIdx ? SAMPLE_QUIZ.explanation : "Incorrect. Try review variables indices and lookup nodes in Hash tables."}
                </Text>
              </View>
            )}

            {/* Button Actions */}
            <View style={[styles.quizActions, { marginTop: spacing.lg }]}>
              {quizEvaluated ? (
                <Button title="Reset Quiz" onPress={handleResetQuiz} style={{ flex: 1 }} />
              ) : (
                <Button
                  title="Submit Answer"
                  onPress={handleEvaluate}
                  disabled={selectedOptionIdx === null}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </Card>
        </View>
      )}

      {/* SHARED STUDY WORKSPACES */}
      {activeTab === "workspaces" && (
        <View style={styles.section}>
          <Text style={[styles.subSectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Active Study Groups</Text>
          <Card style={[styles.summaryCard, isDark ? styles.cardDark : null, { padding: spacing.md, marginBottom: spacing.md }]}>
            <View style={styles.workspaceRow}>
              <View style={styles.workspaceLeft}>
                <Ionicons name="people-outline" size={24} color={colors.primary} style={{ marginRight: spacing.md }} />
                <View>
                  <Text style={[styles.workspaceTitle, { color: colors.text }]}>KNUST Algo study channel</Text>
                  <Text style={[styles.workspaceMembers, { color: colors.textMuted }]}>4 student nodes active now</Text>
                </View>
              </View>
              <Pressable style={[styles.joinBtn, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.round }]}>
                <Text style={[styles.joinText, { color: colors.primary }]}>Join</Text>
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
