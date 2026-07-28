import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { loginColors } from "../constants/loginTheme";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { booksService, Book } from "../services/books";
import { reservationsService } from "../services/reservations";

const ACCENT = loginColors.teal;
const ACCENT_DARK = loginColors.tealDark;

export default function BarcodeScanner() {
  const router = useRouter();
  const { userId } = useAuth();
  const [manualCode, setManualCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [matchedBook, setMatchedBook] = useState<Book | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();

  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  // There's no camera/barcode library wired in here yet - only the manual code entry
  // below does a real lookup. Keeping the viewfinder chrome for visual continuity, but
  // it no longer pretends a tap-to-scan actually reads anything.
  const handleManualSubmit = async () => {
    const code = manualCode.trim();
    if (!code) return;
    setSearching(true);
    setLookupError(null);
    setMatchedBook(null);
    try {
      const results = await booksService.search(code);
      if (results.length === 0) {
        setLookupError(`No book found for "${code}".`);
      } else {
        setMatchedBook(results[0]);
      }
    } catch {
      setLookupError("Couldn't look up that code. Try again.");
    } finally {
      setSearching(false);
    }
  };

  // Students can't self-checkout (POST /api/borrow-records is staff-only) - this creates
  // a real reservation instead and hands off to the existing pickup-scheduling flow.
  const confirmReservation = async () => {
    if (!matchedBook || !userId) return;
    setReserving(true);
    setLookupError(null);
    try {
      await reservationsService.create(userId, matchedBook.id);
      router.replace(`/pickup?bookId=${matchedBook.id}` as any);
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : "Couldn't reserve that book. Try again.");
    } finally {
      setReserving(false);
    }
  };

  return (
    <ScreenWrapper style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back navigation header */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <View style={styles.backButtonRow}>
            <Ionicons name="chevron-back" size={20} color={colors.textLight} />
            <Text style={[styles.backText, { color: colors.textLight }]}>Back</Text>
          </View>
        </Pressable>

        <Text style={[styles.title, { color: colors.textLight }]}>Barcode Scanner</Text>
        <Text style={[styles.subtitle, { color: "rgba(255, 255, 255, 0.6)" }]}>
          Enter a book's barcode/ISBN below to reserve it for pickup.
        </Text>

        {/* Viewfinder block - decorative for now, no camera/barcode library wired in yet */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.cameraFrame}>
            <View style={styles.scannerLine} />

            {/* Viewport Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {searching && (
              <View style={styles.overlayLoader}>
                <ActivityIndicator size="large" color={ACCENT} />
                <Text style={styles.scanText}>Looking up code...</Text>
              </View>
            )}

            {!searching && !matchedBook && (
              <View style={styles.simulateTrigger}>
                <Ionicons name="scan-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
                <Text style={styles.simulateText}>Camera scanning coming soon{"\n"}enter the code below</Text>
              </View>
            )}

            {matchedBook && (
              <View style={styles.overlaySuccess}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                <Text style={[styles.successCode, { color: colors.textLight }]}>{matchedBook.title}</Text>
                <Text style={styles.successLabel}>Ready to Reserve</Text>
              </View>
            )}
          </View>
        </View>

        {lookupError && !matchedBook && <Text style={styles.errorText}>{lookupError}</Text>}

        {matchedBook ? (
          <View style={styles.actionRow}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setMatchedBook(null)}
              disabled={reserving}
              style={{ flex: 1, borderColor: "rgba(255, 255, 255, 0.3)" }}
              textStyle={{ color: colors.textLight }}
            />
            <Button
              title="Reserve for Pickup"
              onPress={confirmReservation}
              loading={reserving}
              accentColor={ACCENT}
              textStyle={{ color: ACCENT_DARK }}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          /* Manual code input entry row */
          <View style={styles.manualEntryBlock}>
            <Text style={styles.manualLabel}>Enter the book's barcode or ISBN</Text>
            <View style={styles.manualRow}>
              <Input
                placeholder="Enter Barcode ID manually"
                value={manualCode}
                onChangeText={setManualCode}
                containerStyle={styles.manualInputContainer}
                variant="glass"
              />
              <Button
                title="Look Up"
                onPress={handleManualSubmit}
                loading={searching}
                accentColor={ACCENT}
                textStyle={{ color: ACCENT_DARK }}
                style={styles.manualBtn}
              />
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: "#060913", // Full screen dark viewfinder theme
    },
    container: {
      flex: 1,
      padding: spacing.lg,
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
      fontSize: 24,
      fontWeight: "800",
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 18,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    viewfinderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginVertical: spacing.lg,
    },
    cameraFrame: {
      width: 260,
      height: 260,
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderColor: "rgba(255, 255, 255, 0.12)",
      borderWidth: 1.5,
      borderRadius: borderRadius.xl,
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    scannerLine: {
      position: "absolute",
      width: "100%",
      height: 2,
      backgroundColor: "#ef4444", // Red scanner laser
      top: "50%",
      shadowColor: "#ef4444",
      shadowOpacity: 0.8,
      shadowRadius: 6,
      elevation: 4,
    },
    corner: {
      position: "absolute",
      width: 20,
      height: 20,
      borderColor: ACCENT,
    },
    topLeft: {
      top: 12,
      left: 12,
      borderLeftWidth: 3,
      borderTopWidth: 3,
    },
    topRight: {
      top: 12,
      right: 12,
      borderRightWidth: 3,
      borderTopWidth: 3,
    },
    bottomLeft: {
      bottom: 12,
      left: 12,
      borderLeftWidth: 3,
      borderBottomWidth: 3,
    },
    bottomRight: {
      bottom: 12,
      right: 12,
      borderRightWidth: 3,
      borderBottomWidth: 3,
    },
    overlayLoader: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(6, 9, 19, 0.85)",
      justifyContent: "center",
      alignItems: "center",
    },
    scanText: {
      color: "rgba(255, 255, 255, 0.8)",
      marginTop: spacing.md,
      fontSize: 14,
      fontWeight: "600",
    },
    simulateTrigger: {
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    simulateText: {
      color: "rgba(255, 255, 255, 0.5)",
      marginTop: spacing.sm,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },
    errorText: {
      color: "#ef4444",
      fontSize: 13,
      fontWeight: "600",
      marginTop: spacing.md,
      textAlign: "center",
    },
    overlaySuccess: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(6, 9, 19, 0.9)",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.md,
    },
    successCode: {
      fontSize: 16,
      fontWeight: "800",
      marginTop: spacing.md,
      textAlign: "center",
    },
    successLabel: {
      color: colors.success,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      marginTop: 4,
    },
    actionRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    manualEntryBlock: {
      marginTop: spacing.md,
    },
    manualLabel: {
      color: "rgba(255, 255, 255, 0.5)",
      fontSize: 13,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    manualRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    manualInputContainer: {
      flex: 1,
      marginBottom: 0,
    },
    manualBtn: {
      height: 48,
      paddingHorizontal: spacing.md,
    },
  });
