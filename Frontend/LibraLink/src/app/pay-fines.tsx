import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const colors = {
  primary: "#7C5CFC",
  primaryDark: "#5B3FE0",
  primaryLight: "#EDE7FF",
  bg: "#F7F6FB",
  card: "#FFFFFF",
  text: "#1A1A2E",
  textMuted: "#8A8A9E",
  success: "#2ECC71",
  danger: "#FF5A5F",
  border: "#ECEAF5",
};

type Fine = {
  id: string;
  bookTitle: string;
  reason: "Overdue" | "Lost Item" | "Damaged Item";
  daysOverdue?: number;
  amount: number;
};

type PaymentMethod = "mtn" | "telecel" | "airteltigo";

const FINES: Fine[] = [
  { id: "f1", bookTitle: "Atomic Habits", reason: "Overdue", daysOverdue: 5, amount: 2.5 },
  { id: "f2", bookTitle: "The Midnight Library", reason: "Overdue", daysOverdue: 2, amount: 1 },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; color: string }[] = [
  { id: "mtn", label: "MTN Mobile Money", color: "#F6B800" },
  { id: "telecel", label: "Telecel Cash", color: "#E52B38" },
  { id: "airteltigo", label: "AirtelTigo Money", color: "#E94C9B" },
];

function FineRow({ fine, selected, onToggle }: { fine: Fine; selected: boolean; onToggle: () => void }) {
  return (
    <Pressable style={styles.fineRow} onPress={onToggle}>
      <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
        {selected && <Ionicons name="checkmark" size={14} color={colors.card} />}
      </View>
      <View style={styles.fineIcon}>
        <Ionicons name="receipt-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.fineInfo}>
        <Text style={styles.fineTitle}>{fine.bookTitle}</Text>
        <Text style={styles.fineReason}>
          {fine.reason}{fine.daysOverdue ? `  ·  ${fine.daysOverdue} days overdue` : ""}
        </Text>
      </View>
      <Text style={styles.fineAmount}>GHS {fine.amount.toFixed(2)}</Text>
    </Pressable>
  );
}

export default function PayFinesScreen() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(FINES.map((fine) => fine.id));
  const [method, setMethod] = useState<PaymentMethod>("mtn");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/profile" as any);
    }
  };

  const total = useMemo(
    () => FINES.filter((fine) => selectedIds.includes(fine.id)).reduce((sum, fine) => sum + fine.amount, 0),
    [selectedIds]
  );

  const toggleFine = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      Alert.alert("Select a fine", "Choose at least one fine to pay.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      Alert.alert("Mobile money number required", "Enter the 9-digit number linked to your mobile money account.");
      return;
    }
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
    }, 900);
  };

  if (paid) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}><Ionicons name="checkmark" size={38} color={colors.card} /></View>
          <Text style={styles.successTitle}>Payment successful</Text>
          <Text style={styles.successBody}>
            GHS {total.toFixed(2)} paid via {PAYMENT_METHODS.find((item) => item.id === method)?.label}. Your account is now in good standing.
          </Text>
          <Pressable style={styles.confirmBtn} onPress={() => setPaid(false)}>
            <Text style={styles.confirmBtnText}>Back to fines</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
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
        <View style={styles.card}>
          {FINES.map((fine, index) => (
            <View key={fine.id} style={index < FINES.length - 1 ? styles.rowDivider : undefined}>
              <FineRow fine={fine} selected={selectedIds.includes(fine.id)} onToggle={() => toggleFine(fine.id)} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Choose mobile money</Text>
        <View style={styles.providerGrid}>
          {PAYMENT_METHODS.map((provider) => {
            const selected = method === provider.id;
            return (
              <Pressable key={provider.id} style={[styles.providerCard, selected && styles.providerCardSelected]} onPress={() => setMethod(provider.id)}>
                <View style={[styles.providerLogo, { backgroundColor: provider.color }]}><Text style={styles.providerLogoText}>{provider.label.charAt(0)}</Text></View>
                <Text style={styles.providerLabel}>{provider.label}</Text>
                <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputHeader}><Text style={styles.inputLabel}>Mobile money number</Text><Text style={styles.required}>Required</Text></View>
          <View style={styles.phoneField}>
            <Text style={styles.countryCode}>+233</Text>
            <TextInput style={styles.phoneInput} value={phone} onChangeText={setPhone} placeholder="24 000 0000" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" maxLength={9} />
          </View>
          <Text style={styles.inputHint}>Enter the number linked to your {PAYMENT_METHODS.find((item) => item.id === method)?.label} account.</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Selected fines</Text><Text style={styles.summaryValue}>{selectedIds.length}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Amount to pay</Text><Text style={styles.summaryTotal}>GHS {total.toFixed(2)}</Text></View>
        </View>

        <Pressable style={[styles.confirmBtn, (paying || selectedIds.length === 0) && styles.confirmBtnDisabled]} onPress={handleConfirm} disabled={paying || selectedIds.length === 0}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.card} />
          <Text style={styles.confirmBtnText}>{paying ? "Processing payment..." : `Pay GHS ${total.toFixed(2)}`}</Text>
        </Pressable>
        <Text style={styles.footerNote}>Your payment is processed securely. No card details are stored.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  fineRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 11 },
  checkbox: { width: 21, height: 21, borderRadius: 7, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  fineIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  fineInfo: { flex: 1 },
  fineTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  fineReason: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  fineAmount: { fontSize: 13, fontWeight: "800", color: colors.text },
  providerGrid: { flexDirection: "row", gap: 9, marginBottom: 20 },
  providerCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 11, minHeight: 107 },
  providerCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  providerLogo: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  providerLogoText: { color: colors.card, fontSize: 15, fontWeight: "900" },
  providerLabel: { color: colors.text, fontSize: 11, fontWeight: "700", lineHeight: 15, minHeight: 31 },
  radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginTop: 7 },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  inputCard: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 20 },
  inputHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 9 },
  inputLabel: { color: colors.text, fontSize: 13, fontWeight: "800" },
  required: { color: colors.textMuted, fontSize: 11 },
  phoneField: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 12, height: 49, paddingHorizontal: 13 },
  countryCode: { color: colors.text, fontSize: 15, fontWeight: "700", paddingRight: 12, borderRightWidth: 1, borderRightColor: colors.border },
  phoneInput: { flex: 1, color: colors.text, fontSize: 15, paddingHorizontal: 12 },
  inputHint: { color: colors.textMuted, fontSize: 11, marginTop: 9, lineHeight: 16 },
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
