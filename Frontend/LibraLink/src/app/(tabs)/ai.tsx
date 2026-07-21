import { useState, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/common/Input";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTheme } from "../../constants/theme";

// TODO: Fetch suggestions from API
const SUGGESTIONS: string[] = [];

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
      text: "Hello! I am Libra, your library assistant. Ask me to find books, compile lists, or suggest study guides in plain English.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

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

  // TODO: Replace with actual API call to AI assistant
  const getMockResponse = (_text: string) => "I searched the catalog for that query. Please try rephrasing or ask a librarian for assistance.";

  const getPromptIcon = (text: string) => {
    if (text.includes("Recommend")) return "bulb-outline";
    if (text.includes("guides")) return "trending-up-outline";
    return "reader-outline";
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
            <View style={item.sender === "user" ? styles.userRow : styles.libraRow}>
              {item.sender === "libra" && (
                <View style={[styles.avatarCircle, { backgroundColor: isDark ? "rgba(59, 130, 246, 0.16)" : colors.primaryLight }]}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
              )}
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
            </View>
          )}
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.libraRow}>
                <View style={[styles.avatarCircle, { backgroundColor: isDark ? "rgba(59, 130, 246, 0.16)" : colors.primaryLight }]}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
                <View style={[styles.bubble, styles.libraBubble, styles.typingBox]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.typingText}>Libra is thinking...</Text>
                </View>
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
                  <Ionicons name={getPromptIcon(item) as any} size={14} color={colors.primary} style={{ marginRight: 6 }} />
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
            leftIcon={<Ionicons name="chatbox-ellipses-outline" size={18} color={colors.textMuted} />}
          />
          <Pressable style={styles.sendButton} onPress={() => sendMessage(prompt)}>
            <Ionicons name="arrow-forward" size={20} color={colors.textLight} />
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) =>
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
    userRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: spacing.md,
      width: "100%",
    },
    libraRow: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "flex-end", // Align avatar bottom to chat bubble bottom
      marginBottom: spacing.md,
      width: "100%",
    },
    avatarCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.sm,
      marginBottom: 2, // Align with bubble shadow offset
    },
    bubble: {
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      maxWidth: "80%",
      shadowColor: "#000",
      shadowOpacity: 0.01,
      shadowRadius: 4,
      elevation: 1,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: borderRadius.xs,
    },
    libraBubble: {
      backgroundColor: colors.surface,
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
      paddingVertical: spacing.sm - 2,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
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
  });
