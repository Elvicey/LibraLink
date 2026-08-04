import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { loginColors } from "../constants/loginTheme";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { aiService } from "../services/ai";
import { bookAuthorName } from "../services/books";

const ACCENT = loginColors.teal;
const ACCENT_DARK = loginColors.tealDark;
const ACCENT_LIGHT = "rgba(93, 202, 165, 0.16)";

const FALLBACK_SUGGESTIONS = [
  "Recommend books for a project",
  "Find study guides for economics",
  "Summarize my reading list",
];

interface SuggestedBook {
  id?: number;
  title?: string;
  authors?: { fullName?: string }[];
  coverImageUrl?: string | null;
}

interface ChatMessage {
  id: string;
  sender: "user" | "libra";
  text: string;
  books?: SuggestedBook[];
  time: number;
}

/** Three dots that fade in sequence while Libra composes a reply. */
function TypingDots({ color }: { color: string }) {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 320,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 320,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.delay((2 - index) * 160),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
}

export default function AI() {
  const router = useRouter();
  const { userId, firstName } = useAuth();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, isDark);

  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(FALLBACK_SUGGESTIONS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    aiService.getSuggestions().then((items) => {
      if (items?.length) setSuggestions(items);
    });
  }, []);

  const scrollToEnd = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: "user", text: trimmed, time: Date.now() },
    ]);
    setPrompt("");
    setIsTyping(true);
    scrollToEnd();

    try {
      const res = await aiService.askLibra(trimmed, userId ?? 1);
      setMessages((prev) => [
        ...prev,
        {
          id: `l-${Date.now()}`,
          sender: "libra",
          text: res.response,
          books: (res.suggestedBooks || []).filter((b: SuggestedBook) => b?.id && b?.title),
          time: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `l-${Date.now()}`,
          sender: "libra",
          text: "I could not reach the catalogue just then. Try again, or ask a librarian at the reference desk.",
          time: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
      scrollToEnd();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setPrompt("");
  };

  const clockTime = (ms: number) =>
    new Date(ms).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const suggestionIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("recommend")) return "bulb-outline";
    if (lower.includes("guide") || lower.includes("study")) return "school-outline";
    if (lower.includes("summar") || lower.includes("list")) return "reader-outline";
    return "sparkles-outline";
  };

  const emptyState = (
    <View style={styles.emptyState}>
      <View style={styles.emptyAvatar}>
        <Ionicons name="sparkles" size={30} color={ACCENT} />
      </View>
      <Text style={styles.emptyTitle}>
        Hi {firstName || "there"}, I&apos;m Libra
      </Text>
      <Text style={styles.emptyBody}>
        Describe what you need in plain English and I&apos;ll find books, compile reading
        lists, or explain where things are shelved.
      </Text>

      <Text style={styles.suggestLabel}>Try asking</Text>
      <View style={styles.suggestList}>
        {suggestions.map((item) => (
          <Pressable key={item} style={styles.suggestCard} onPress={() => sendMessage(item)}>
            <View style={styles.suggestIcon}>
              <Ionicons name={suggestionIcon(item) as any} size={17} color={ACCENT} />
            </View>
            <Text style={styles.suggestText} numberOfLines={2}>
              {item}
            </Text>
            <Ionicons name="arrow-forward" size={15} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.headerIdentity}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={16} color={ACCENT} />
          </View>
          <View>
            <Text style={styles.headerName}>Libra</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? "Typing…" : "Library assistant"}
            </Text>
          </View>
        </View>

        {messages.length > 0 ? (
          <Pressable onPress={clearChat} hitSlop={8}>
            <Ionicons name="create-outline" size={21} color={ACCENT} />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          messages.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={emptyState}
        onContentSizeChange={() => {
          if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
        }}
        renderItem={({ item }) => {
          const mine = item.sender === "user";
          return (
            <View style={styles.messageBlock}>
              <View style={mine ? styles.userRow : styles.libraRow}>
                {!mine && (
                  <View style={styles.bubbleAvatar}>
                    <Ionicons name="sparkles" size={13} color={ACCENT} />
                  </View>
                )}
                <View style={[styles.bubble, mine ? styles.userBubble : styles.libraBubble]}>
                  <Text style={[styles.bubbleText, mine ? styles.userText : styles.libraText]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.timeText, mine ? styles.userTime : styles.libraTime]}>
                    {clockTime(item.time)}
                  </Text>
                </View>
              </View>

              {/* Books Libra found for this answer */}
              {!mine && !!item.books?.length && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bookStrip}
                >
                  {item.books.map((book) => (
                    <Pressable
                      key={book.id}
                      style={styles.miniBook}
                      onPress={() => router.push(`/book/${book.id}` as any)}
                    >
                      <View style={styles.miniCover}>
                        {book.coverImageUrl ? (
                          <Image
                            source={{ uri: book.coverImageUrl }}
                            style={styles.miniCoverImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons name="book" size={20} color={ACCENT} />
                        )}
                      </View>
                      <Text style={styles.miniTitle} numberOfLines={2}>
                        {book.title}
                      </Text>
                      <Text style={styles.miniAuthor} numberOfLines={1}>
                        {bookAuthorName(book as any)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.libraRow}>
              <View style={styles.bubbleAvatar}>
                <Ionicons name="sparkles" size={13} color={ACCENT} />
              </View>
              <View style={[styles.bubble, styles.libraBubble, styles.typingBubble]}>
                <TypingDots color={colors.textMuted} />
              </View>
            </View>
          ) : null
        }
      />

      {/* Composer */}
      <View style={styles.composer}>
        <View style={styles.composerField}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask Libra anything…"
            placeholderTextColor={colors.textMuted}
            style={styles.composerInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(prompt)}
            returnKeyType="send"
            blurOnSubmit
          />
        </View>
        <Pressable
          style={[styles.sendButton, (!prompt.trim() || isTyping) && styles.sendButtonDisabled]}
          onPress={() => sendMessage(prompt)}
          disabled={!prompt.trim() || isTyping}
        >
          <Ionicons name="arrow-up" size={20} color={ACCENT_DARK} />
        </Pressable>
      </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -spacing.sm,
    },
    headerIdentity: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    headerAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: ACCENT_LIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    headerName: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
    },
    headerStatus: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: spacing.lg,
      paddingBottom: spacing.md,
    },
    listContentEmpty: {
      flexGrow: 1,
      justifyContent: "center",
    },
    messageBlock: {
      marginBottom: spacing.lg,
    },
    userRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    libraRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    bubbleAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: ACCENT_LIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    bubble: {
      maxWidth: "78%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md - 2,
      paddingBottom: spacing.sm - 2,
      borderRadius: borderRadius.xl,
    },
    userBubble: {
      backgroundColor: ACCENT,
      borderBottomRightRadius: borderRadius.xs,
    },
    libraBubble: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderBottomLeftRadius: borderRadius.xs,
    },
    typingBubble: {
      paddingVertical: spacing.md,
    },
    bubbleText: {
      fontSize: 15,
      lineHeight: 21,
    },
    userText: {
      color: ACCENT_DARK,
    },
    libraText: {
      color: colors.text,
    },
    timeText: {
      fontSize: 10,
      marginTop: 4,
      alignSelf: "flex-end",
    },
    userTime: {
      color: ACCENT_DARK,
      opacity: 0.7,
    },
    libraTime: {
      color: colors.textMuted,
    },
    bookStrip: {
      gap: spacing.sm,
      paddingLeft: 36,
      paddingTop: spacing.sm,
    },
    miniBook: {
      width: 116,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.lg,
      padding: spacing.sm,
    },
    miniCover: {
      height: 72,
      borderRadius: borderRadius.sm,
      backgroundColor: ACCENT_LIGHT,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      marginBottom: spacing.sm,
    },
    miniCoverImage: {
      width: "100%",
      height: "100%",
    },
    miniTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 16,
    },
    miniAuthor: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    emptyState: {
      alignItems: "center",
      paddingHorizontal: spacing.sm,
    },
    emptyAvatar: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor: ACCENT_LIGHT,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    emptyBody: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textMuted,
      textAlign: "center",
      paddingHorizontal: spacing.md,
      marginBottom: spacing.huge,
    },
    suggestLabel: {
      alignSelf: "flex-start",
      fontSize: 12,
      fontWeight: "700",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: spacing.md,
    },
    suggestList: {
      alignSelf: "stretch",
      gap: spacing.sm,
    },
    suggestCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    suggestIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: ACCENT_LIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    suggestText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      backgroundColor: colors.background,
    },
    composerField: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      justifyContent: "center",
      minHeight: 46,
    },
    composerInput: {
      fontSize: 15,
      color: colors.text,
      maxHeight: 110,
      padding: 0,
    },
    sendButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: ACCENT,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
  });
