import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";

export default function PayFines() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<"momo" | "card" | null>("momo");
  const [momoProvider, setMomoProvider] = useState<"mtn" | "telecel" | "at">("mtn");
  const [phone, setPhone] = useState("0241234567");
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();

  const handlePay = () => {
    setStatus("processing");
    setTimeout(() => {
      setStatus("success");
    }, 2000);
  };

  const getTelecomBtnStyle = (provider: "mtn" | "telecel" | "at") => {
    if (mfaEnabled(provider)) {
      if (provider === "mtn") return { backgroundColor: isDark ? "rgba(245, 158, 11, 0.08)" : "#fffbeb", borderColor: "#f59e0b" };
      if (provider === "telecel") return { backgroundColor: isDark ? "rgba(220, 38, 38, 0.08)" : "#fef2f2", borderColor: "#dc2626" };
      return { backgroundColor: isDark ? "rgba(37, 99, 235, 0.08)" : "#eff6ff", borderColor: "#2563eb" };
    }
    return { backgroundColor: colors.background, borderColor: colors.border };
  };

  const mfaEnabled = (provider: string) => momoProvider === provider;

  if (status === "success") {
    return (
      <ScreenWrapper contentContainerStyle={[styles.successContainer, { padding: spacing.xxl }]}>
        <View style={[styles.successBox, { backgroundColor: colors.surface, borderRadius: borderRadius.huge, padding: spacing.xxl }]}>
          <Text style={[styles.successIcon, { marginBottom: spacing.lg }]}>🎉</Text>
          <Text style={[styles.successTitle, { color: colors.success, marginBottom: spacing.sm }]}>Payment Successful</Text>
          <Text style={[styles.successDesc, { color: colors.textMuted, marginBottom: spacing.xl }]}>
            Your GHS 1.00 library fine has been cleared. Thank you!
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

      {/* Outstanding Summary */}
      <Card style={[styles.summaryCard, { backgroundColor: colors.primary, marginBottom: spacing.lg }]}>
        <Text style={[styles.summaryLabel, { color: isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.85)", marginBottom: spacing.xs }]}>
          Outstanding Balance
        </Text>
        <Text style={[styles.summaryValue, { color: colors.textLight }]}>GHS 1.00</Text>
      </Card>

      {/* Itemized Bill */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginVertical: spacing.md }]}>Itemized Details</Text>
      <Card style={{ marginBottom: spacing.sm }}>
        <View style={styles.billItem}>
          <View>
            <Text style={[styles.billBookTitle, { color: colors.text }]}>Introduction to Calculus</Text>
            <Text style={[styles.billBookMeta, { color: colors.textMuted, marginTop: spacing.xs }]}>
              2 days overdue (GHS 0.50 / day)
            </Text>
          </View>
          <Text style={[styles.billPrice, { color: colors.danger }]}>GHS 1.00</Text>
        </View>
      </Card>

      {/* Payment Methods */}
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

      {/* Method Configuration Forms */}
      {selectedMethod === "momo" && (
        <Card style={{ marginBottom: spacing.xl }}>
          <Text style={[styles.formLabel, { color: colors.text, marginBottom: spacing.sm }]}>Select Telecom Provider</Text>
          <View style={[styles.telecomRow, { gap: spacing.xs, marginBottom: spacing.lg }]}>
            {/* MTN */}
            <Pressable
              style={[
                styles.telecomBtn,
                { borderRadius: borderRadius.md },
                getTelecomBtnStyle("mtn"),
              ]}
              onPress={() => setMomoProvider("mtn")}
            >
              <Text style={[styles.telecomText, { color: colors.textMuted }, mfaEnabled("mtn") && { color: colors.text, fontWeight: "700" }]}>
                MTN MoMo
              </Text>
            </Pressable>
            {/* Telecel */}
            <Pressable
              style={[
                styles.telecomBtn,
                { borderRadius: borderRadius.md },
                getTelecomBtnStyle("telecel"),
              ]}
              onPress={() => setMomoProvider("telecel")}
            >
              <Text style={[styles.telecomText, { color: colors.textMuted }, mfaEnabled("telecel") && { color: colors.text, fontWeight: "700" }]}>
                Telecel Cash
              </Text>
            </Pressable>
            {/* AT */}
            <Pressable
              style={[
                styles.telecomBtn,
                { borderRadius: borderRadius.md },
                getTelecomBtnStyle("at"),
              ]}
              onPress={() => setMomoProvider("at")}
            >
              <Text style={[styles.telecomText, { color: colors.textMuted }, mfaEnabled("at") && { color: colors.text, fontWeight: "700" }]}>
                AT Money
              </Text>
            </Pressable>
          </View>

          <Input
            label="MoMo Number"
            placeholder="024XXXXXXX"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </Card>
      )}

      {selectedMethod === "card" && (
        <Card style={{ marginBottom: spacing.xl }}>
          <Input label="Cardholder Name" placeholder="Esther Asamoah" />
          <Input label="Card Number" placeholder="4000 1234 5678 9010" keyboardType="numeric" />
          <View style={styles.cardExpiryCVV}>
            <Input
              label="Expiry Date"
              placeholder="MM/YY"
              containerStyle={{ flex: 1, marginRight: spacing.sm }}
            />
            <Input
              label="CVV"
              placeholder="123"
              secureTextEntry
              containerStyle={{ flex: 1 }}
            />
          </View>
        </Card>
      )}

      <Button
        title={status === "processing" ? "Processing..." : "Complete Payment"}
        onPress={handlePay}
        loading={status === "processing"}
        style={[styles.payButton, { borderRadius: borderRadius.xl, marginBottom: spacing.xxl }]}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  backButton: {
    marginBottom: 12,
    alignSelf: "flex-start",
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
  summaryCard: {},
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  billItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billBookTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  billBookMeta: {
    fontSize: 13,
  },
  billPrice: {
    fontSize: 16,
    fontWeight: "800",
  },
  methodRow: {
    flexDirection: "row",
  },
  methodTile: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  tileEmoji: {
    fontSize: 24,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  telecomRow: {
    flexDirection: "row",
  },
  telecomBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  telecomText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardExpiryCVV: {
    flexDirection: "row",
  },
  payButton: {
    paddingVertical: 12,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successBox: {
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  successIcon: {
    fontSize: 60,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  successDesc: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  doneButton: {
    width: "100%",
    paddingVertical: 12,
  },
});
