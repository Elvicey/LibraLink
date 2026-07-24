import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { booksService } from "../services/books";

export default function EditBookText() {
  const router = useRouter();
  const { bookId, title } = useLocalSearchParams<{ bookId?: string; title?: string }>();
  const { colors, spacing, borderRadius } = useTheme();

  const [text, setText] = useState("");
  const [totalCopies, setTotalCopies] = useState("");
  const [availableCopies, setAvailableCopies] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = Number(bookId);
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    Promise.all([
      booksService.getContent(id).catch(() => ({ content: "" })),
      booksService.getById(id).catch(() => null),
    ]).then(([contentRes, book]) => {
      setText(contentRes.content ?? "");
      if (book) {
        setTotalCopies(String(book.totalCopies ?? 0));
        setAvailableCopies(String(book.availableCopies ?? 0));
      }
      setLoading(false);
    });
  }, [bookId]);

  const save = async () => {
    const id = Number(bookId);
    if (!Number.isFinite(id)) return;

    const total = Number(totalCopies);
    const available = Number(availableCopies);
    if (!Number.isFinite(total) || !Number.isFinite(available) || total < 0 || available < 0) {
      Alert.alert("Check the numbers", "Total and available copies must be zero or greater.");
      return;
    }
    if (available > total) {
      Alert.alert("Check the numbers", "Available copies can't exceed total copies.");
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        booksService.updateContent(id, text),
        booksService.updateAvailability(id, total, available),
      ]);
      Alert.alert("Saved", "The book was updated.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert("Couldn't save", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(colors, spacing, borderRadius);

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Edit book{title ? ` · ${title}` : ""}
        </Text>
        <View style={styles.back} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.body}>
            <Text style={styles.hint}>
              Paste or type the book&apos;s text. Readers will see it in the in-app reader, and the
              AI narration will read it aloud. You can also update how many copies exist and how
              many are currently available.
            </Text>

            <View style={styles.copiesRow}>
              <View style={styles.copiesField}>
                <Text style={styles.copiesLabel}>Total copies</Text>
                <TextInput
                  style={styles.copiesInput}
                  value={totalCopies}
                  onChangeText={setTotalCopies}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  editable={!saving}
                />
              </View>
              <View style={styles.copiesField}>
                <Text style={styles.copiesLabel}>Available copies</Text>
                <TextInput
                  style={styles.copiesInput}
                  value={availableCopies}
                  onChangeText={setAvailableCopies}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  editable={!saving}
                />
              </View>
            </View>

            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Paste the book text here…"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              editable={!saving}
            />
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={save}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.textLight} />
              ) : (
                <Text style={styles.saveText}>Save text</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.text },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    body: { flex: 1, padding: spacing.lg, gap: spacing.md },
    hint: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
    copiesRow: { flexDirection: "row", gap: spacing.md },
    copiesField: { flex: 1, gap: 6 },
    copiesLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
    copiesInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      height: 44,
      color: colors.text,
      fontSize: 15,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      padding: spacing.md,
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveText: { color: colors.textLight, fontSize: 15, fontWeight: "800" },
  });
