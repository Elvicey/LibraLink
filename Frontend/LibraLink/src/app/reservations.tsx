import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AUTH_LIBRARY_OVERLAY,
  AuthLibraryBackground,
  LIGHT_LIBRARY_OVERLAY,
} from '../components/auth/AuthLibraryBackground';
import { useTheme } from '../constants/theme';

const colors = {
  primary: '#5DCAA5',
  primaryDark: '#04342C',
  primaryLight: '#E3F6EF',
  bg: '#F7F6FB',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textMuted: '#8A8A9E',
  success: '#2ECC71',
  danger: '#FF5A5F',
  warning: '#FFB020',
  border: '#ECEAF5',
};

type ReservationStatus = 'Ready for Pickup' | 'Pending' | 'Expired';
type Reservation = {
  id: string;
  bookTitle: string;
  author: string;
  branch: string;
  status: ReservationStatus;
  holdExpires?: string;
};

const RESERVATIONS: Reservation[] = [
  { id: 'r1', bookTitle: 'Educated', author: 'Tara Westover', branch: 'Downtown Branch', status: 'Ready for Pickup', holdExpires: 'Jul 25' },
  { id: 'r2', bookTitle: 'Project Hail Mary', author: 'Andy Weir', branch: 'Downtown Branch', status: 'Pending' },
  { id: 'r3', bookTitle: 'Circe', author: 'Madeline Miller', branch: 'Westside Branch', status: 'Expired' },
];

function StatusBadge({ status }: { status: ReservationStatus }) {
  const tint =
    status === 'Ready for Pickup' ? colors.success : status === 'Pending' ? colors.warning : colors.danger;
  const icon =
    status === 'Ready for Pickup' ? 'checkmark-circle' : status === 'Pending' ? 'time-outline' : 'close-circle-outline';
  return (
    <View style={[styles.badge, { backgroundColor: tint + '22' }]}>
      <Ionicons name={icon as any} size={12} color={tint} />
      <Text style={[styles.badgeText, { color: tint }]}>{status}</Text>
    </View>
  );
}

export default function ReservationsScreen() {
  const { isDark } = useTheme();
  const [qrReservation, setQrReservation] = useState<Reservation | null>(null);

  const qrUrl = (data: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;

  return (
    <View style={styles.screen}>
      <AuthLibraryBackground
        overlayColor={isDark ? AUTH_LIBRARY_OVERLAY : LIGHT_LIBRARY_OVERLAY}
      />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Reservations</Text>
          <Text style={styles.subtitle}>Pick up your held books</Text>
        </View>

        <View style={styles.card}>
          {RESERVATIONS.map((r, idx) => (
            <View key={r.id} style={[styles.row, idx !== RESERVATIONS.length - 1 && styles.rowDivider]}>
              <View style={styles.bookIcon}>
                <Ionicons name="book-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle}>{r.bookTitle}</Text>
                <Text style={styles.bookMeta}>{r.author}</Text>
                <Text style={styles.branchText}>{r.branch}</Text>
                {r.holdExpires && (
                  <Text style={styles.holdText}>Hold expires {r.holdExpires}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <StatusBadge status={r.status} />
                {r.status === 'Ready for Pickup' && (
                  <TouchableOpacity style={styles.qrBtn} onPress={() => setQrReservation(r)}>
                    <Ionicons name="qr-code-outline" size={14} color={colors.card} />
                    <Text style={styles.qrBtnText}>Confirm Pickup</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {RESERVATIONS.length === 0 && (
            <Text style={styles.emptyText}>No active reservations</Text>
          )}
        </View>
        </ScrollView>

      <Modal visible={!!qrReservation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Show at Pickup Desk</Text>
            <Text style={styles.modalBody}>{qrReservation?.bookTitle}</Text>

            {qrReservation && (
              <View style={styles.qrWrap}>
                <Image
                  source={{ uri: qrUrl(`libralink:pickup:${qrReservation.id}`) }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            )}

            <Text style={styles.qrHint}>
              Staff will scan this code to confirm your pickup at {qrReservation?.branch}.
            </Text>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setQrReservation(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 6, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  bookIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  bookMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  branchText: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  holdText: { fontSize: 11, color: colors.warning, marginTop: 2, fontWeight: '600' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  qrBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  qrBtnText: { color: colors.card, fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: colors.textMuted, padding: 20, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,26,46,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 22, alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
  modalBody: { fontSize: 14, color: colors.textMuted, marginBottom: 18, textAlign: 'center' },
  qrWrap: { width: 220, height: 220, borderRadius: 16, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
  qrImage: { width: 200, height: 200 },
  qrHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 17 },
  closeBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  closeBtnText: { color: colors.card, fontWeight: '700', fontSize: 14 },
});
