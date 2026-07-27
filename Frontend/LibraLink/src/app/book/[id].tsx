import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { loginColors } from "../../constants/loginTheme";
import { useTheme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { audioService, AudioBookTrackResponse } from "../../services/audio";
import BookNarration from "../../components/BookNarration";
import { useBookNarration } from "../../hooks/useBookNarration";
import { bookAuthorName, booksService, Book, isBookAvailable } from "../../services/books";
import { bookmarksService } from "../../services/bookmarks";

const ACCENT = loginColors.teal;
const ACCENT_LIGHT = "rgba(93, 202, 165, 0.16)";

/** "English" -> "ENG". Falls back to the raw value when it is already short. */
function languageCode(language?: string | null): string {
  if (!language) return "—";
  const trimmed = language.trim();
  if (trimmed.length <= 3) return trimmed.toUpperCase();
  return trimmed.slice(0, 3).toUpperCase();
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function BookDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId, token, roles } = useAuth();
  const canEditText = roles.includes("LIBRARIAN") || roles.includes("ADMIN");
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, isDark);

  const [book, setBook] = useState<Book | null>(null);
  const [track, setTrack] = useState<AudioBookTrackResponse | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [readSheet, setReadSheet] = useState(false);
  const [pendingEbookUrl, setPendingEbookUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookId = Number(id);
  const narration = useBookNarration(bookId);

  const load = useCallback(async () => {
    if (!Number.isFinite(bookId)) {
      setError("Invalid book id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setBook(await booksService.getById(bookId));
    } catch (e: any) {
      setError(e?.message || "Could not load this book.");
      setBook(null);
    } finally {
      setLoading(false);
    }

    // An audiobook edition is optional — a failure here must not break the screen.
    audioService
      .getAllTracks()
      .then((tracks) => setTrack(tracks.find((t) => t.book?.id === bookId) ?? null))
      .catch(() => setTrack(null));

    if (userId && token) {
      bookmarksService
        .isBookmarked(userId, bookId)
        .then(setBookmarked)
        .catch(() => setBookmarked(false));
    }
  }, [bookId, userId, token]);

  // Refetch whenever this screen regains focus (also fires on first mount), so returning
  // from "Edit book" reflects the new availability/copy counts immediately.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /** Optimistic, reverting on failure — same approach as the notifications screen. */
  const toggleBookmark = async () => {
    if (!userId || !token) {
      Alert.alert("Sign in required", "Sign in to save books to your reading list.");
      return;
    }
    if (saving) return;

    const next = !bookmarked;
    setBookmarked(next);
    setSaving(true);
    try {
      if (next) {
        await bookmarksService.add(bookId);
      } else {
        await bookmarksService.remove(bookId);
      }
    } catch (e: any) {
      setBookmarked(!next);
      Alert.alert(
        next ? "Could not save" : "Could not remove",
        e?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const launchBrowser = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Could not open", "The digital edition could not be opened.");
    }
  };

  const openEbook = () => {
    const url = book?.digitalUrl;
    if (!url) return;
    if (Platform.OS === "ios") {
      // iOS can't present the browser while the sheet is still dismissing — the two
      // collide and wedge the app. Stash the URL and open it from the Modal's
      // onDismiss, which fires once the sheet is fully closed.
      setPendingEbookUrl(url);
      setReadSheet(false);
    } else {
      // Android has no such view-controller conflict.
      setReadSheet(false);
      launchBrowser(url);
    }
  };

  const goReserve = () => {
    setReadSheet(false);
    router.push(`/pickup?bookId=${bookId}` as any);
  };

  if (loading) {
    return (
      <ScreenWrapper style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator color={ACCENT} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !book) {
    return (
      <ScreenWrapper style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Detail book</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || "Book not found."}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const available = isBookAvailable(book);

  return (
    <ScreenWrapper style={styles.screen}>
      {/* Header — bookmark sits top right */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Detail book</Text>
        <Pressable
          style={styles.headerButton}
          onPress={toggleBookmark}
          hitSlop={8}
          accessibilityLabel={bookmarked ? "Remove from reading list" : "Add to reading list"}
        >
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={22}
            color={bookmarked ? ACCENT : colors.text}
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Cover on a pedestal */}
        <View style={styles.coverArea}>
          <View style={styles.cover}>
            {book.coverImageUrl ? (
              <Image
                source={{ uri: book.coverImageUrl }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="book" size={54} color={ACCENT} />
            )}
          </View>
          <View style={styles.pedestal} />
        </View>

        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{bookAuthorName(book)}</Text>

        {/* Four columns, every one backed by real data */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Language</Text>
            <Text style={styles.statValue}>{languageCode(book.language)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Audio</Text>
            <Text style={styles.statValue}>{formatDuration(track?.durationSeconds)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Copies</Text>
            <Text style={styles.statValue}>
              {book.availableCopies ?? 0}/{book.totalCopies ?? 0}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Status</Text>
            <Text
              style={[
                styles.statValue,
                { color: available ? colors.success : colors.danger },
              ]}
            >
              {available ? "Available" : "On loan"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>What is it about?</Text>
        <Text style={styles.description}>
          {book.description || "No description is available for this title yet."}
        </Text>

        {(!!book.isbn || !!book.subtitle) && (
          <View style={styles.detailBlock}>
            {!!book.subtitle && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subtitle</Text>
                <Text style={styles.detailValue}>{book.subtitle}</Text>
              </View>
            )}
            {!!book.isbn && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ISBN</Text>
                <Text style={styles.detailValue}>{book.isbn}</Text>
              </View>
            )}
          </View>
        )}
        {book && <BookNarration narration={narration} />}
      </ScrollView>

      {/* Persistent action bar */}
      <View style={styles.actionBar}>
        <Pressable style={styles.readButton} onPress={() => setReadSheet(true)}>
          <Text style={styles.readButtonText}>READ BOOK</Text>
        </Pressable>
        <Pressable
          style={styles.playButton}
          onPress={narration.activate}
          disabled={narration.phase === "generating"}
        >
          <Ionicons
            name={narration.playing ? "pause" : "headset-outline"}
            size={17}
            color={ACCENT}
          />
          <Text style={styles.playButtonText}>
            {narration.phase === "generating"
              ? "GENERATING…"
              : narration.playing
              ? "PAUSE"
              : "PLAY BOOK"}
          </Text>
        </Pressable>
      </View>

      {/* READ BOOK -> ebook or physical copy */}
      <Modal
        visible={readSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setReadSheet(false)}
        onDismiss={() => {
          // Only the "Read ebook" choice sets a pending URL; backdrop taps and the
          // reserve path leave it null, so this is a no-op for them.
          if (pendingEbookUrl) {
            const url = pendingEbookUrl;
            setPendingEbookUrl(null);
            launchBrowser(url);
          }
        }}
      >
        <Pressable style={styles.backdrop} onPress={() => setReadSheet(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>How do you want to read it?</Text>

            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                setReadSheet(false);
                router.push({ pathname: "/reader", params: { bookId: String(bookId), title: book.title } } as any);
              }}
            >
              <View style={[styles.sheetIcon, { backgroundColor: ACCENT_LIGHT }]}>
                <Ionicons name="book-outline" size={20} color={ACCENT} />
              </View>
              <View style={styles.sheetText}>
                <Text style={styles.sheetRowTitle}>Read in the app</Text>
                <Text style={styles.sheetRowSubtitle}>Opens the book&apos;s text in a clean reader</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={[styles.sheetRow, styles.sheetRowDivider, !book.digitalUrl && styles.sheetRowDisabled]}
              onPress={openEbook}
              disabled={!book.digitalUrl}
            >
              <View style={[styles.sheetIcon, { backgroundColor: ACCENT_LIGHT }]}>
                <Ionicons name="tablet-portrait-outline" size={20} color={ACCENT} />
              </View>
              <View style={styles.sheetText}>
                <Text style={styles.sheetRowTitle}>Read the ebook</Text>
                <Text style={styles.sheetRowSubtitle}>
                  {book.digitalUrl
                    ? "Opens the digital edition in your browser"
                    : "No digital edition for this title"}
                </Text>
              </View>
              {!!book.digitalUrl && (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              )}
            </Pressable>

            <Pressable style={[styles.sheetRow, styles.sheetRowDivider]} onPress={goReserve}>
              <View style={[styles.sheetIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="bag-handle-outline" size={20} color={colors.success} />
              </View>
              <View style={styles.sheetText}>
                <Text style={styles.sheetRowTitle}>Reserve a physical copy</Text>
                <Text style={styles.sheetRowSubtitle}>
                  {available
                    ? "Pick a collection slot at the library desk"
                    : "All copies are out — you'll join the queue"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {canEditText && (
              <Pressable
                style={[styles.sheetRow, styles.sheetRowDivider]}
                onPress={() => {
                  setReadSheet(false);
                  router.push({ pathname: "/edit-book-text", params: { bookId: String(bookId), title: book.title } } as any);
                }}
              >
                <View style={[styles.sheetIcon, { backgroundColor: colors.warningLight }]}>
                  <Ionicons name="create-outline" size={20} color={colors.warning} />
                </View>
                <View style={styles.sheetText}>
                  <Text style={styles.sheetRowTitle}>Edit book</Text>
                  <Text style={styles.sheetRowSubtitle}>Update text, availability & copies (librarian/admin)</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      textAlign: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: -spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.huge,
    },
    coverArea: {
      alignItems: "center",
      marginTop: spacing.lg,
      marginBottom: spacing.xl,
    },
    cover: {
      width: 168,
      height: 246,
      borderRadius: borderRadius.md,
      backgroundColor: ACCENT_LIGHT,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.4 : 0.18,
      shadowRadius: 20,
      elevation: 8,
    },
    coverImage: {
      width: "100%",
      height: "100%",
    },
    // The slab the cover appears to stand on, as in the mockup.
    pedestal: {
      width: 232,
      height: 26,
      marginTop: -6,
      borderRadius: borderRadius.sm,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#e9ecf2",
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
    },
    author: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    stat: {
      flex: 1,
      alignItems: "center",
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    statValue: {
      fontSize: 15,
      fontWeight: "800",
      color: ACCENT,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.xl,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.md,
    },
    description: {
      fontSize: 15,
      lineHeight: 23,
      color: colors.textMuted,
    },
    detailBlock: {
      marginTop: spacing.xl,
      gap: spacing.md,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.lg,
    },
    detailLabel: {
      fontSize: 13,
      color: colors.textMuted,
    },
    detailValue: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      textAlign: "right",
    },
    actionBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    readButton: {
      flex: 1,
      backgroundColor: colors.text,
      paddingVertical: spacing.md + 2,
      borderRadius: borderRadius.round,
      alignItems: "center",
    },
    readButtonText: {
      color: colors.surface,
      fontWeight: "800",
      fontSize: 14,
      letterSpacing: 0.5,
    },
    playButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md + 2,
      borderRadius: borderRadius.round,
      borderWidth: 1.5,
      borderColor: ACCENT,
    },
    playButtonDisabled: {
      borderColor: colors.border,
    },
    playButtonText: {
      color: ACCENT,
      fontWeight: "800",
      fontSize: 14,
      letterSpacing: 0.5,
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.huge,
      borderTopRightRadius: borderRadius.huge,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.huge,
    },
    grabber: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderDark,
      marginBottom: spacing.md,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    sheetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    sheetRowDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sheetRowDisabled: {
      opacity: 0.45,
    },
    sheetIcon: {
      width: 42,
      height: 42,
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    sheetText: {
      flex: 1,
    },
    sheetRowTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    sheetRowSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
