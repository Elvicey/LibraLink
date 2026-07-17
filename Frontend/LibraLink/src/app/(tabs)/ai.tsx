import { useState, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import Input from "../../components/common/Input";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";

const SUGGESTIONS = [
  "Recommend books for a project",
  "Find study guides for economics",
  "Summarize my reading list",
];

interface ChatMessage {
  id: string;
  sender: "user" | "libra";
  text: string;
}

export default function AI() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "libra",
      text: "Hello Esther! I am Libra, your library assistant. Ask me to find books, compile lists, or suggest study guides in plain English.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { colors, spacing, borderRadius, typography } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsgId = Date.now().toString();
    const newMessages = [
      ...messages,
      { id: userMsgId, sender: "user" as const, text },
    ];
    setMessages(newMessages);
    setPrompt("");
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulated AI response
    setTimeout(() => {
      setIsTyping(false);
      const aiResponseText = getMockResponse(text);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "libra" as const,
          text: aiResponseText,
        },
      ]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1800);
  };

  const getMockResponse = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("project") || lower.includes("recommend")) {
      return "Based on your final year requirements, I recommend checking out 'Lean Startup' by Eric Ries and 'Data Structures in Practice' in the Computing section.";
    }
    if (lower.includes("econ") || lower.includes("study")) {
      return "I found 'African Economics' by A. Smith (Available on Shelf B4) and 'African Economic Dev.' (Currently on Loan, due in 5 days).";
    }
    if (lower.includes("summarize") || lower.includes("list")) {
      return "Your active Semester reading list contains 17 titles. You have completed 37% of 'Data Structures in Practice' and have 1 overdue check-out.";
    }
    return "I searched the catalog for that query. I suggest checking out the main collection under Class B or talking to a librarian at the reference desk.";
  };

  return (
    <ScreenWrapper style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ask Libra</Text>
          <Text style={styles.subtitle}>
            Use natural language queries to discover library resources
          </Text>
        </View>

        {/* Message Chat List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.sender === "user" ? styles.userBubble : styles.libraBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.sender === "user" ? styles.userText : styles.libraText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.bubble, styles.libraBubble, styles.typingBox]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>Libra is typing...</Text>
              </View>
            ) : null
          }
        />

        {/* Suggestions Quick-Pills */}
        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggested Prompts</Text>
            <View style={styles.promptRow}>
              {SUGGESTIONS.map((item) => (
                <Pressable
                  key={item}
                  style={styles.promptChip}
                  onPress={() => sendMessage(item)}
                >
                  <Text style={styles.promptText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Send Input Bar */}
        <View style={styles.inputBar}>
          <Input
            placeholder="Ask Libralink something..."
            value={prompt}
            onChangeText={setPrompt}
            containerStyle={styles.textInputContainer}
            onSubmitEditing={() => sendMessage(prompt)}
            returnKeyType="send"
          />
          <Pressable style={styles.sendButton} onPress={() => sendMessage(prompt)}>
            <Text style={styles.sendIcon}>➔</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    header: {
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: typography.titleMedium.fontSize,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: typography.bodyMedium.fontSize,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    chatList: {
      flex: 1,
      marginVertical: spacing.md,
    },
    chatListContent: {
      paddingBottom: spacing.lg,
    },
    bubble: {
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.md,
      maxWidth: "80%",
      shadowColor: "#000",
      shadowOpacity: 0.01,
      shadowRadius: 4,
      elevation: 1,
    },
    userBubble: {
      backgroundColor: colors.primary,
      alignSelf: "flex-end",
      borderBottomRightRadius: borderRadius.xs,
    },
    libraBubble: {
      backgroundColor: colors.surface,
      alignSelf: "flex-start",
      borderBottomLeftRadius: borderRadius.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleText: {
      fontSize: 15,
      lineHeight: 20,
    },
    userText: {
      color: colors.textLight,
    },
    libraText: {
      color: colors.text,
    },
    typingBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderColor: colors.border,
    },
    typingText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: "500",
    },
    suggestionsContainer: {
      marginBottom: spacing.sm,
    },
    suggestionsTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textMuted,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    promptRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    promptChip: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.round,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
    },
    promptText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "500",
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingTop: spacing.sm,
    },
    textInputContainer: {
      flex: 1,
      marginBottom: 0,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    sendIcon: {
      color: colors.textLight,
      fontSize: 20,
      fontWeight: "bold",
    },
  });
