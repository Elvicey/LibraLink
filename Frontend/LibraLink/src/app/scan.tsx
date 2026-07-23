import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";

export default function BarcodeScanner() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const triggerScanMock = () => {
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate camera lock and scan after 1.5 seconds
    setTimeout(() => {
      setIsScanning(false);
      setScanResult("Scanned Book (KNUST)");
    }, 1500);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult(`${manualCode.trim()} (Custom Entry)`);
    }, 1000);
  };

  const confirmCheckout = () => {
    // Navigate to the borrowed screen (now a stack route, not a tab)
    router.replace("/borrowed" as any);
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
          Align the book barcode/QR code inside the viewport frame.
        </Text>

        {/* Viewfinder scanner block */}
        <View style={styles.viewfinderContainer}>
          {/* Mock Camera Feed / Scanner Frame */}
          <View style={styles.cameraFrame}>
            <View style={styles.scannerLine} />
            
            {/* Viewport Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {isScanning && (
              <View style={styles.overlayLoader}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.scanText}>Reading code...</Text>
              </View>
            )}

            {!isScanning && !scanResult && (
              <Pressable style={styles.simulateTrigger} onPress={triggerScanMock}>
                <Ionicons name="scan-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
                <Text style={styles.simulateText}>Tap to Scan Code</Text>
              </Pressable>
            )}

            {scanResult && (
              <View style={styles.overlaySuccess}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                <Text style={[styles.successCode, { color: colors.textLight }]}>{scanResult}</Text>
                <Text style={styles.successLabel}>Ready to Check-out</Text>
              </View>
            )}
          </View>
        </View>

        {/* Checkout actions */}
        {scanResult ? (
          <View style={styles.actionRow}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setScanResult(null)}
              style={{ flex: 1, borderColor: "rgba(255, 255, 255, 0.3)" }}
              textStyle={{ color: colors.textLight }}
            />
            <Button
              title="Borrow Book"
              onPress={confirmCheckout}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          /* Manual code input entry row */
          <View style={styles.manualEntryBlock}>
            <Text style={styles.manualLabel}>Having issues with the camera?</Text>
            <View style={styles.manualRow}>
              <Input
                placeholder="Enter Barcode ID manually"
                value={manualCode}
                onChangeText={setManualCode}
                containerStyle={styles.manualInputContainer}
                variant="glass"
              />
              <Button
                title="Enter"
                onPress={handleManualSubmit}
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
      borderColor: colors.primary,
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
      ...StyleSheet.absoluteFill,
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
    },
    overlaySuccess: {
      ...StyleSheet.absoluteFill,
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
