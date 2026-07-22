import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { Fine, fineAmount, finesService } from "../services/fines";

/** Normalize pasted/local Ghana numbers to 9 national digits (no leading 0, no 233). */
function toGhanaNationalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233")) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 9);
}

export default function PayFines() {
  const router = useRouter();
  const { userId, token } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<"momo" | "card" | null>("momo");
  const [momoProvider, setMomoProvider] = useState<"mtn" | "telecel" | "at">("mtn");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();

  const unpaid = useMemo(
    () => fines.filter((f) => (f.status || "").toUpperCase() !== "PAID"),
    [fines]
  );
  const totalDue = useMemo(
    () => unpaid.reduce((sum, f) => sum + fineAmount(f), 0),
    [unpaid]
  );

  const loadFines = useCallback(async () => {
    if (!userId || !token) {
      setLoadError("Sign in to view and pay fines.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await finesService.getForUser(userId);
      setFines(data);
    } catch (e: any) {
      setLoadError(e?.message || "Could not load fines.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    loadFines();
  }, [loadFines]);

  const handlePhoneChange = (text: string) => {
    setPhone(toGhanaNationalDigits(text));
    setPhoneError(undefined);
  };

  const handlePay = async () => {
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to pay fines.");
      return;
    }
    if (unpaid.length === 0) {
      Alert.alert("No fines", "You have no unpaid fines.");
      return;
    }
    if (selectedMethod === "momo" && phone.length !== 9) {
      setPhoneError("Enter a valid Ghana MoMo number: +233 followed by 9 digits.");
      Alert.alert("Invalid number", "Use +233 and exactly 9 digits (e.g. +233 24 412 3456).");
      return;
    }

    setStatus("processing");
    try {
      for (const fine of unpaid) {
        await finesService.pay({
          fineId: fine.id,
          userId,
          amount: fineAmount(fine),
          amountPaid: fineAmount(fine),
          paymentMethod: selectedMethod === "momo" ? `MOMO_${momoProvider.toUpperCase()}` : "CARD",
          transactionRef:
            selectedMethod === "momo"
              ? `MOMO-+233${phone}-${Date.now()}`
              : `CARD-${Date.now()}`,
        });
      }
      setStatus("success");
    } catch (e: any) {
      setStatus("idle");
      Alert.alert("Payment failed", e?.message || "Could not process payment.");
    }
  };

  const getTelecomBtnStyle = (provider: "mtn" | "telecel" | "at") => {
    if (momoProvider === provider) {
      if (provider === "mtn") return { backgroundColor: isDark ? "rgba(245, 158, 11, 0.08)" : "#fffbeb", borderColor: "#f59e0b" };
      if (provider === "telecel") return { backgroundColor: isDark ? "rgba(220, 38, 38, 0.08)" : "#fef2f2", borderColor: "#dc2626" };
      return { backgroundColor: isDark ? "rgba(37, 99, 235, 0.08)" : "#eff6ff", borderColor: "#2563eb" };
    }
    return { backgroundColor: colors.background, borderColor: colors.border };
  };

  if (status === "success") {
    return (
      <ScreenWrapper contentContainerStyle={[styles.successContainer, { padding: spacing.xxl }]}>
        <View style={[styles.successBox, { backgroundColor: colors.surface, borderRadius: borderRadius.huge, padding: spacing.xxl }]}>
          <Text style={[styles.successIcon, { marginBottom: spacing.lg }]}>🎉</Text>
          <Text style={[styles.successTitle, { color: colors.success, marginBottom: spacing.sm }]}>Payment Successful</Text>
          <Text style={[styles.successDesc, { color: colors.textMuted, marginBottom: spacing.xl }]}>
            Your GHS {totalDue.toFixed(2)} library fine has been cleared. Thank you!
          </Text>
          <Button
            title="Back to Profile"
            onPress={() => router.back()}
            style={[styles.doneButton, { borderRadius: borderRadius.xl }]}
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
      </Pressable>
      
      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Pay Fines
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Settle your pending overdue balances instantly.
      </Text>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />}
      {!!loadError && <Text style={{ color: colors.danger, marginBottom: spacing.md }}>{loadError}</Text>}

      <Card style={[styles.summaryCard, { backgroundColor: colors.primary, marginBottom: spacing.lg }]}>
        <Text style={[styles.summaryLabel, { color: isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.85)", marginBottom: spacing.xs }]}>
          Outstanding Balance
        </Text>
        <Text style={[styles.summaryValue, { color: colors.textLight }]}>
          GHS {totalDue.toFixed(2)}
        </Text>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text, marginVertical: spacing.md }]}>Itemized Details</Text>
      {unpaid.length === 0 && !loading ? (
        <Card style={{ marginBottom: spacing.sm }}>
          <Text style={{ color: colors.textMuted }}>No unpaid fines on your account.</Text>
        </Card>
      ) : (
        unpaid.map((fine) => (
          <Card key={fine.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.billItem}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={[styles.billBookTitle, { color: colors.text }]}>
                  {fine.reason || `Fine #${fine.id}`}
                </Text>
                <Text style={[styles.billBookMeta, { color: colors.textMuted, marginTop: spacing.xs }]}>
                  Status: {fine.status}
                </Text>
              </View>
              <Text style={[styles.billPrice, { color: colors.danger }]}>
                GHS {fineAmount(fine).toFixed(2)}
              </Text>
            </View>
          </Card>
        ))
      )}

      {unpaid.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginVertical: spacing.md }]}>Payment Method</Text>
          <View style={[styles.methodRow, { gap: spacing.md, marginBottom: spacing.lg }]}>
            <Pressable
              style={[
                styles.methodTile,
                { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, borderColor: colors.border },
                selectedMethod === "momo" && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
              ]}
              onPress={() => setSelectedMethod("momo")}
            >
              <Text style={[styles.tileEmoji, { marginBottom: spacing.xs }]}>📱</Text>
              <Text style={[styles.tileLabel, { color: colors.textMuted }, selectedMethod === "momo" && { color: colors.primary, fontWeight: "700" }]}>
                Mobile Money
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.methodTile,
                { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, borderColor: colors.border },
                selectedMethod === "card" && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
              ]}
              onPress={() => setSelectedMethod("card")}
            >
              <Text style={[styles.tileEmoji, { marginBottom: spacing.xs }]}>💳</Text>
              <Text style={[styles.tileLabel, { color: colors.textMuted }, selectedMethod === "card" && { color: colors.primary, fontWeight: "700" }]}>
                Credit/Debit Card
              </Text>
            </Pressable>
          </View>

          {selectedMethod === "momo" && (
            <Card style={{ marginBottom: spacing.xl }}>
              <Text style={[styles.formLabel, { color: colors.text, marginBottom: spacing.sm }]}>Select Telecom Provider</Text>
              <View style={[styles.telecomRow, { gap: spacing.xs, marginBottom: spacing.lg }]}>
                {(["mtn", "telecel", "at"] as const).map((provider) => (
                  <Pressable
                    key={provider}
                    style={[styles.telecomBtn, { borderRadius: borderRadius.md }, getTelecomBtnStyle(provider)]}
                    onPress={() => setMomoProvider(provider)}
                  >
                    <Text style={[styles.telecomText, { color: colors.textMuted }, momoProvider === provider && { color: colors.text, fontWeight: "700" }]}>
                      {provider === "mtn" ? "MTN MoMo" : provider === "telecel" ? "Telecel Cash" : "AT Money"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="MoMo Number"
                placeholder="24XXXXXXX"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={handlePhoneChange}
                maxLength={9}
                error={phoneError}
                leftIcon={
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>+233</Text>
                }
              />
              <Text style={[styles.phoneHint, { color: colors.textMuted }]}>
                Ghana format: +233 + 9 digits (example +233244123456). Do not include the leading 0.
              </Text>
            </Card>
          )}

          {selectedMethod === "card" && (
            <Card style={{ marginBottom: spacing.xl }}>
              <Input label="Cardholder Name" placeholder="Esther Asamoah" />
              <Input label="Card Number" placeholder="4000 1234 5678 9010" keyboardType="numeric" />
              <View style={styles.cardExpiryCVV}>
                <Input label="Expiry Date" placeholder="MM/YY" containerStyle={{ flex: 1, marginRight: spacing.sm }} />
                <Input label="CVV" placeholder="123" secureTextEntry containerStyle={{ flex: 1 }} />
              </View>
            </Card>
          )}

          <Button
            title={status === "processing" ? "Processing..." : `Pay GHS ${totalDue.toFixed(2)}`}
            onPress={handlePay}
            loading={status === "processing"}
            style={[styles.payButton, { borderRadius: borderRadius.xl, marginBottom: spacing.xxl }]}
          />
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "transparent" },
  backButton: { marginBottom: 12, alignSelf: "flex-start" },
  backText: { fontWeight: "700", fontSize: 16 },
  title: { fontWeight: "800" },
  description: { fontWeight: "500" },
  summaryCard: {},
  summaryLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  summaryValue: { fontSize: 28, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  billItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  billBookTitle: { fontSize: 15, fontWeight: "700" },
  billBookMeta: { fontSize: 13 },
  billPrice: { fontSize: 16, fontWeight: "800" },
  methodRow: { flexDirection: "row" },
  methodTile: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  tileEmoji: { fontSize: 24 },
  tileLabel: { fontSize: 13, fontWeight: "600" },
  formLabel: { fontSize: 14, fontWeight: "600" },
  telecomRow: { flexDirection: "row" },
  telecomBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, alignItems: "center" },
  telecomText: { fontSize: 12, fontWeight: "600" },
  phoneHint: { fontSize: 12, lineHeight: 18, marginTop: -4, marginBottom: 4 },
  cardExpiryCVV: { flexDirection: "row" },
  payButton: { paddingVertical: 12 },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  successBox: {
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  successIcon: { fontSize: 60 },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successDesc: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  doneButton: { width: "100%", paddingVertical: 12 },
});
