import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { finesService, fineAmount, Fine as ApiFine } from "../services/fines";

// Verify can momentarily run before Paystack finishes settling the charge, so retry a
// few times before treating it as unpaid.
async function confirmPayment(reference: string): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const result = await finesService.verifyPayment(reference);
      if (result.paid) return true;
    } catch {
      // transient network/gateway error — fall through to retry
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

const colors = {
  primary: "#5DCAA5",
  primaryDark: "#04342C",
  primaryLight: "#E3F6EF",
  bg: "#F7F6FB",
  card: "#FFFFFF",
  text: "#1A1A2E",
  textMuted: "#8A8A9E",
  success: "#2ECC71",
  danger: "#FF5A5F",
  border: "#ECEAF5",
};

function Screen({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        {children}
      </SafeAreaView>
    </View>
  );
}

function isOutstanding(fine: ApiFine): boolean {
  return (fine.status || "").toUpperCase() !== "PAID";
}

function FineRow({ fine, selected, onToggle }: { fine: ApiFine; selected: boolean; onToggle: () => void }) {
  return (
    <Pressable style={styles.fineRow} onPress={onToggle}>
      <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
        {selected && <Ionicons name="checkmark" size={14} color={colors.card} />}
      </View>
      <View style={styles.fineIcon}>
        <Ionicons name="receipt-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.fineInfo}>
        <Text style={styles.fineTitle}>{fine.reason || "Library fine"}</Text>
        <Text style={styles.fineReason}>{(fine.status || "UNPAID").toUpperCase()}</Text>
      </View>
      <Text style={styles.fineAmount}>GHS {fineAmount(fine).toFixed(2)}</Text>
    </Pressable>
  );
}

export default function PayFinesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { userId } = useAuth();
  const [fines, setFines] = useState<ApiFine[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paidTotal, setPaidTotal] = useState(0);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setLoadError("Sign in to view your fines.");
      return;
    }
    setLoadError(null);
    setLoading(true);
    try {
      const list = await finesService.getForUser(userId);
      const outstanding = list.filter(isOutstanding);
      setFines(outstanding);
      setSelectedIds(outstanding.map((f) => f.id));
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load fines.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/profile" as any);
    }
  };

  const total = useMemo(
    () => fines.filter((f) => selectedIds.includes(f.id)).reduce((sum, f) => sum + fineAmount(f), 0),
    [selectedIds, fines]
  );

  const toggleFine = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleConfirm = async () => {
    if (!userId) return;
    if (selectedIds.length === 0) {
      Alert.alert("Select a fine", "Choose at least one fine to pay.");
      return;
    }
    const selected = fines.filter((f) => selectedIds.includes(f.id));
    setPaying(true);
    const failures: string[] = [];
    let charged = 0;
    // Each fine is a separate Paystack transaction (the backend rejects a combined amount
    // spread across fines), so run one hosted checkout per fine. We pass a deep-link
    // callback so Paystack redirects back into the app and openAuthSessionAsync resolves
    // exactly when checkout ends — openBrowserAsync returns early on Android, which caused
    // verify to run before payment completed. We then verify server-side; the fine is only
    // marked paid if Paystack reports "success".
    const redirectUrl = Linking.createURL("paystack-callback");
    for (const fine of selected) {
      try {
        const init = await finesService.initializePayment(fine.id, redirectUrl);
        await WebBrowser.openAuthSessionAsync(init.authorizationUrl, redirectUrl);
        if (await confirmPayment(init.reference)) {
          charged += fineAmount(fine);
        } else {
          failures.push(`Fine #${fine.id}: payment not completed`);
        }
      } catch (e: any) {
        failures.push(`Fine #${fine.id}: ${e?.message || "payment failed"}`);
      }
    }
    setPaying(false);
    await load();
    if (failures.length > 0) {
      Alert.alert("Some payments were not completed", failures.join("\n"));
    }
    if (charged > 0) {
      setPaidTotal(charged);
      setPaid(true);
    }
  };

  if (paid) {
    return (
      <Screen isDark={isDark}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}><Ionicons name="checkmark" size={38} color={colors.card} /></View>
          <Text style={styles.successTitle}>Payment successful</Text>
          <Text style={styles.successBody}>
            GHS {paidTotal.toFixed(2)} paid via Paystack. Your account is now in good standing.
          </Text>
          <Pressable style={styles.confirmBtn} onPress={() => setPaid(false)}>
            <Text style={styles.confirmBtnText}>Back to fines</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen isDark={isDark}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={handleBack} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={colors.primaryDark} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>Payments</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="card-outline" size={23} color={colors.card} /></View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>LIBRARY ACCOUNT</Text>
            <Text style={styles.title}>Pay your fines</Text>
            <Text style={styles.subtitle}>Clear your balance securely with mobile money.</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>TOTAL DUE</Text>
            <Text style={styles.balanceValue}>GHS {total.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceBadge}><Ionicons name="shield-checkmark-outline" size={16} color={colors.primaryDark} /><Text style={styles.balanceBadgeText}>Secure payment</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Outstanding fines</Text>
        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : loadError ? (
          <Pressable style={styles.errorBox} onPress={load}>
            <Text style={styles.errorText}>{loadError} — tap to retry</Text>
          </Pressable>
        ) : fines.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>You have no outstanding fines. 🎉</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {fines.map((fine, index) => (
              <View key={fine.id} style={index < fines.length - 1 ? styles.rowDivider : undefined}>
                <FineRow fine={fine} selected={selectedIds.includes(fine.id)} onToggle={() => toggleFine(fine.id)} />
              </View>
            ))}
          </View>
        )}

        {fines.length > 0 && (
          <>
            <View style={styles.paystackCard}>
              <View style={styles.paystackIcon}><Ionicons name="card-outline" size={20} color={colors.primaryDark} /></View>
              <View style={styles.paystackCopy}>
                <Text style={styles.paystackTitle}>Secure checkout with Paystack</Text>
                <Text style={styles.paystackHint}>
                  You'll be taken to Paystack's secure page to pay by card or mobile money. Each fine
                  is paid separately. Close the page when you're done and we'll confirm the payment.
                </Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Selected fines</Text><Text style={styles.summaryValue}>{selectedIds.length}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Amount to pay</Text><Text style={styles.summaryTotal}>GHS {total.toFixed(2)}</Text></View>
            </View>

            <Pressable style={[styles.confirmBtn, (paying || selectedIds.length === 0) && styles.confirmBtnDisabled]} onPress={handleConfirm} disabled={paying || selectedIds.length === 0}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.card} />
              <Text style={styles.confirmBtnText}>{paying ? "Processing payment..." : `Pay GHS ${total.toFixed(2)}`}</Text>
            </Pressable>
            <Text style={styles.footerNote}>Payments are processed securely by Paystack. In test mode no real money moves.</Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: "transparent" },
  container: { padding: 20, paddingBottom: 34 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  backButton: { minWidth: 82, height: 44, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, paddingHorizontal: 12 },
  backButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: "800" },
  topBarTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  topBarSpacer: { width: 42 },
  hero: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: 13 },
  heroCopy: { flex: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, fontWeight: "800", color: colors.primary, marginBottom: 3 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  balanceCard: { backgroundColor: colors.primary, borderRadius: 22, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, shadowColor: colors.primaryDark, shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 5 },
  balanceValue: { color: colors.card, fontSize: 30, fontWeight: "800", letterSpacing: -0.7 },
  balanceBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.88)", paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, gap: 5 },
  balanceBadgeText: { color: colors.primaryDark, fontSize: 10, fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.text, marginBottom: 10, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 23, overflow: "hidden" },
  loadingBox: { paddingVertical: 40, alignItems: "center", marginBottom: 23 },
  errorBox: { backgroundColor: colors.danger + "18", borderRadius: 14, padding: 14, marginBottom: 23 },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: "600", textAlign: "center" },
  emptyText: { textAlign: "center", color: colors.textMuted, padding: 22, fontSize: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  fineRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 11 },
  checkbox: { width: 21, height: 21, borderRadius: 7, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  fineIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  fineInfo: { flex: 1 },
  fineTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  fineReason: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  fineAmount: { fontSize: 13, fontWeight: "800", color: colors.text },
  paystackCard: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 20, gap: 12 },
  paystackIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  paystackCopy: { flex: 1 },
  paystackTitle: { color: colors.text, fontSize: 13, fontWeight: "800", marginBottom: 4 },
  paystackHint: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  summaryCard: { backgroundColor: colors.primaryLight, borderRadius: 18, padding: 16, marginBottom: 15 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  summaryLabel: { color: colors.textMuted, fontSize: 12 },
  summaryValue: { color: colors.text, fontSize: 12, fontWeight: "700" },
  summaryTotalLabel: { color: colors.text, fontSize: 15, fontWeight: "800" },
  summaryTotal: { color: colors.primaryDark, fontSize: 19, fontWeight: "900" },
  confirmBtn: { backgroundColor: colors.primary, borderRadius: 15, paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  confirmBtnDisabled: { backgroundColor: colors.textMuted },
  confirmBtnText: { color: colors.card, fontSize: 15, fontWeight: "800" },
  footerNote: { color: colors.textMuted, fontSize: 11, textAlign: "center", marginTop: 12 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  successIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 9 },
  successBody: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginBottom: 28, lineHeight: 21 },
});
