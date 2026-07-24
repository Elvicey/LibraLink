import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { booksService, Book, bookAuthorName, isBookAvailable } from '../services/books';
import { usersService, AppUser, primaryRole } from '../services/users';
import { circulationService, BookCopyResponse } from '../services/circulation';
import { finesService } from '../services/fines';
import { useAuth } from '../contexts/AuthContext';

const colors = {
  primary: '#7C5CFC',
  primaryDark: '#5B3FE0',
  primaryLight: '#EDE7FF',
  bg: '#F7F6FB',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textMuted: '#8A8A9E',
  success: '#2ECC71',
  danger: '#FF5A5F',
  warning: '#FFB020',
  border: '#ECEAF5',
};

const ROLE_LABEL: Record<string, string> = { ADMIN: 'Admin', LIBRARIAN: 'Librarian', STUDENT: 'Student' };

function memberName(u: AppUser): string {
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User #${u.id}`;
}

function AvailabilityBadge({ book }: { book: Book }) {
  const available = isBookAvailable(book);
  const tint = available ? colors.success : colors.warning;
  return (
    <View style={[styles.badge, { backgroundColor: tint + '22' }]}>
      <Text style={[styles.badgeText, { color: tint }]}>{available ? 'Available' : 'On loan'}</Text>
    </View>
  );
}

export default function LibrarianScreen() {
  const router = useRouter();
  const { clearSession } = useAuth();
  const [tab, setTab] = useState<'inventory' | 'members'>('inventory');
  const [query, setQuery] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanCopy, setScanCopy] = useState<BookCopyResponse | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeMember, setActiveMember] = useState<AppUser | null>(null);
  const [fineOpen, setFineOpen] = useState(false);
  const [fineAmount, setFineAmount] = useState('');
  const [fineReason, setFineReason] = useState('');
  const [fineBusy, setFineBusy] = useState(false);

  const loadBooks = useCallback(async () => {
    const list = await booksService.list();
    setBooks(list);
  }, []);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [bookList, memberList] = await Promise.all([
        booksService.list(),
        usersService.list().catch(() => [] as AppUser[]),
      ]);
      setBooks(bookList);
      setMembers(memberList);
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to load library data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever this screen regains focus (also fires on first mount), so returning
  // from editing a book's availability/copies reflects the new counts immediately.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to access the librarian console.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          router.replace('/signin' as any);
        },
      },
    ]);
  };

  const openScanner = async () => {
    if (Platform.OS !== 'web' && !permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera access needed', 'Enable camera permission to scan member or book codes.');
        return;
      }
    }
    resetScanner();
    setScannerOpen(true);
  };

  const resetScanner = () => {
    setScanned(false);
    setScanResult(null);
    setScanCopy(null);
    setScanError(null);
    setManualCode('');
  };

  const processCode = async (code: string) => {
    setScanned(true);
    setScanResult(code);
    setScanCopy(null);
    setScanError(null);
    setScanBusy(true);
    try {
      const copy = await circulationService.lookup(code);
      setScanCopy(copy);
    } catch (e: any) {
      setScanError(e?.message || 'No book copy found for this barcode.');
    } finally {
      setScanBusy(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    processCode(data);
  };

  const handleManualScan = () => {
    const code = manualCode.trim();
    if (!code) {
      Alert.alert('Enter a code', 'Enter a book copy barcode to continue.');
      return;
    }
    processCode(code);
  };

  const doCheckIn = async () => {
    if (!scanResult) return;
    setScanBusy(true);
    try {
      await circulationService.scan(scanResult, 'CHECK_IN');
      Alert.alert('Checked in', `"${scanCopy?.book?.title || scanResult}" has been returned.`);
      await loadBooks();
      resetScanner();
    } catch (e: any) {
      setScanError(e?.message || 'Check-in failed.');
    } finally {
      setScanBusy(false);
    }
  };

  const doCheckOut = async () => {
    if (!scanResult) return;
    if (!activeMember) {
      setScanError('Select a member in the Members tab before checking out.');
      return;
    }
    setScanBusy(true);
    try {
      const res = await circulationService.scan(scanResult, 'CHECK_OUT', activeMember.id);
      Alert.alert('Checked out', `To ${memberName(activeMember)} · due ${res.dueDate || 'in 14 days'}.`);
      await loadBooks();
      resetScanner();
    } catch (e: any) {
      setScanError(e?.message || 'Check-out failed.');
    } finally {
      setScanBusy(false);
    }
  };

  const submitFine = async () => {
    if (!activeMember) return;
    const amount = Number(fineAmount);
    if (!fineAmount.trim() || Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Enter a valid amount', 'Fine amount must be a number greater than zero.');
      return;
    }
    setFineBusy(true);
    try {
      await finesService.create({ userId: activeMember.id, amount, reason: fineReason.trim() || undefined });
      Alert.alert('Fine issued', `${amount.toFixed(2)} charged to ${memberName(activeMember)}.`);
      setFineOpen(false);
      setFineAmount('');
      setFineReason('');
    } catch (e: any) {
      Alert.alert('Could not issue fine', e?.message || 'Please try again.');
    } finally {
      setFineBusy(false);
    }
  };

  const filteredBooks = useMemo(() => {
    if (!query.trim()) return books;
    const q = query.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        bookAuthorName(b).toLowerCase().includes(q) ||
        (b.isbn || '').toLowerCase().includes(q)
    );
  }, [query, books]);

  const filteredMembers = useMemo(() => {
    if (!query.trim()) return members;
    const q = query.toLowerCase();
    return members.filter(
      (m) => memberName(m).toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)
    );
  }, [query, members]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Librarian</Text>
            <Text style={styles.subtitle}>Inventory & circulation</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} accessibilityLabel="Log out">
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logoutBtnText}>Log out</Text>
          </TouchableOpacity>
        </View>

        {activeMember && (
          <View style={styles.activeMemberBanner}>
            <Ionicons name="person-circle" size={20} color={colors.primaryDark} />
            <Text style={styles.activeMemberText} numberOfLines={1}>
              <Text style={{ fontWeight: '800' }}>{memberName(activeMember)}</Text>
            </Text>
            <TouchableOpacity style={styles.fineChip} onPress={() => setFineOpen(true)} accessibilityLabel="Issue a fine">
              <Text style={styles.fineChipText}>Issue fine</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveMember(null)} accessibilityLabel="Clear selected member">
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={openScanner} accessibilityLabel="Scan a book barcode">
            <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
            <Text style={styles.actionCardTitle}>Scan</Text>
            <Text style={styles.actionCardSub}>Check in / out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => setTab('members')} accessibilityLabel="View members">
            <Ionicons name="people-outline" size={22} color={colors.primary} />
            <Text style={styles.actionCardTitle}>Members</Text>
            <Text style={styles.actionCardSub}>Browse & select</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'inventory' && styles.tabBtnActive]}
            onPress={() => setTab('inventory')}
          >
            <Text style={[styles.tabText, tab === 'inventory' && styles.tabTextActive]}>Book Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'members' && styles.tabBtnActive]}
            onPress={() => setTab('members')}
          >
            <Text style={[styles.tabText, tab === 'members' && styles.tabTextActive]}>Members</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            placeholder={tab === 'inventory' ? 'Search title, author, or ISBN' : 'Search members'}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : loadError ? (
          <TouchableOpacity style={styles.errorBox} onPress={load}>
            <Text style={styles.errorText}>{loadError} — tap to retry</Text>
          </TouchableOpacity>
        ) : tab === 'inventory' ? (
          <View style={styles.card}>
            {filteredBooks.map((book, idx) => (
              <TouchableOpacity
                key={book.id}
                style={[styles.bookRow, idx !== filteredBooks.length - 1 && styles.rowDivider]}
                onPress={() => router.push(`/book/${book.id}` as any)}
                accessibilityLabel={`View ${book.title}`}
              >
                <View style={styles.bookIcon}>
                  {book.coverImageUrl ? (
                    <Image source={{ uri: book.coverImageUrl }} style={styles.bookCoverImage} resizeMode="cover" />
                  ) : (
                    <Ionicons name="book-outline" size={18} color={colors.primary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookMeta}>
                    {bookAuthorName(book)}{book.isbn ? ` · ${book.isbn}` : ''}
                  </Text>
                  <Text style={styles.bookBorrower}>
                    {book.availableCopies ?? 0} of {book.totalCopies ?? 0} available
                  </Text>
                </View>
                <AvailabilityBadge book={book} />
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
            {filteredBooks.length === 0 && (
              <Text style={styles.emptyText}>
                {query ? `No books match "${query}"` : 'No books in catalogue.'}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            {filteredMembers.map((m, idx) => {
              const selected = activeMember?.id === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberRow, idx !== filteredMembers.length - 1 && styles.rowDivider, selected && styles.memberRowSelected]}
                  onPress={() => setActiveMember(selected ? null : m)}
                  accessibilityLabel={`Select ${memberName(m)} for checkout`}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{memberName(m).charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookTitle}>{memberName(m)}</Text>
                    <Text style={styles.bookMeta}>{m.email}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={[styles.badge, { backgroundColor: colors.textMuted + '22' }]}>
                      <Text style={[styles.badgeText, { color: colors.textMuted }]}>{ROLE_LABEL[primaryRole(m)] || 'Student'}</Text>
                    </View>
                    {selected && <Text style={styles.selectedText}>Selected</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
            {filteredMembers.length === 0 && (
              <Text style={styles.emptyText}>
                {query ? `No members match "${query}"` : 'No members found.'}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={fineOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Issue fine</Text>
            <Text style={styles.modalBody}>{activeMember ? memberName(activeMember) : ''}</Text>
            <TextInput
              style={styles.fineInput}
              placeholder="Amount (e.g. 5.00)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={fineAmount}
              onChangeText={setFineAmount}
            />
            <TextInput
              style={styles.fineInput}
              placeholder="Reason (optional)"
              placeholderTextColor={colors.textMuted}
              value={fineReason}
              onChangeText={setFineReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setFineOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={submitFine} disabled={fineBusy}>
                <Text style={styles.modalConfirmText}>{fineBusy ? 'Issuing…' : 'Issue'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={scannerOpen} animationType="slide">
        <SafeAreaView style={styles.scannerSafe}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan book barcode</Text>
            <TouchableOpacity style={styles.scannerClose} onPress={() => { setScannerOpen(false); resetScanner(); }}>
              <Ionicons name="close" size={26} color={colors.card} />
            </TouchableOpacity>
          </View>
          {scanResult ? (
            <View style={styles.scanResultPanel}>
              {scanBusy && !scanCopy ? (
                <ActivityIndicator size="large" color={colors.card} />
              ) : scanError ? (
                <>
                  <Ionicons name="alert-circle" size={64} color={colors.danger} />
                  <Text style={styles.scanResultTitle}>Heads up</Text>
                  <Text style={styles.scanResultValue}>{scanError}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="book" size={56} color={colors.card} />
                  <Text style={styles.scanResultTitle}>{scanCopy?.book?.title || 'Book copy'}</Text>
                  <Text style={styles.scanResultValue}>
                    Barcode {scanResult} · {scanCopy?.available ? 'Available' : 'On loan'}
                  </Text>
                  {scanCopy?.available === false ? (
                    <TouchableOpacity style={[styles.scanAgainBtn, { backgroundColor: colors.success }]} onPress={doCheckIn} disabled={scanBusy}>
                      <Text style={styles.scanAgainText}>{scanBusy ? 'Working…' : 'Check in (return)'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.scanAgainBtn} onPress={doCheckOut} disabled={scanBusy}>
                      <Text style={styles.scanAgainText}>
                        {scanBusy ? 'Working…' : activeMember ? `Check out to ${memberName(activeMember)}` : 'Check out (select member first)'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              <TouchableOpacity style={styles.scanSecondaryBtn} onPress={resetScanner}>
                <Text style={styles.scanSecondaryText}>Scan another code</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={styles.manualScanPanel}>
                <Text style={styles.scannerHint}>Point the camera at a book copy barcode</Text>
                <View style={styles.manualScanRow}>
                  <TextInput
                    style={styles.manualScanInput}
                    placeholder="Enter barcode manually"
                    placeholderTextColor="#888"
                    value={manualCode}
                    onChangeText={setManualCode}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.manualScanBtn} onPress={handleManualScan}>
                    <Text style={styles.manualScanBtnText}>Use code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.danger + '18', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  logoutBtnText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  activeMemberBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  activeMemberText: { flex: 1, fontSize: 13, color: colors.text },
  fineChip: { backgroundColor: colors.warning, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  fineChipText: { color: colors.card, fontSize: 11, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,26,46,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 22 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  modalBody: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
  fineInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 46, marginBottom: 12, fontSize: 14, color: colors.text },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: colors.bg },
  modalCancelText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  modalConfirmText: { color: colors.card, fontWeight: '700', fontSize: 14 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  actionCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 4 },
  actionCardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 4 },
  actionCardSub: { fontSize: 12, color: colors.textMuted },
  tabRow: { flexDirection: 'row', backgroundColor: colors.primaryLight, borderRadius: 14, padding: 4, marginBottom: 14 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.card },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  tabTextActive: { color: colors.primaryDark },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: colors.border, gap: 8, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  errorBox: { backgroundColor: colors.danger + '18', borderRadius: 12, padding: 14 },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 6, borderWidth: 1, borderColor: colors.border },
  bookRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderRadius: 12 },
  memberRowSelected: { backgroundColor: colors.primaryLight },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  bookIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bookCoverImage: { width: '100%', height: '100%' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '700' },
  bookTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  bookMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  bookBorrower: { fontSize: 11, color: colors.warning, marginTop: 2, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  selectedText: { fontSize: 11, color: colors.primaryDark, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: colors.textMuted, padding: 20, fontSize: 13 },
  scannerSafe: { flex: 1, backgroundColor: '#000' },
  scannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  scannerTitle: { color: colors.card, fontSize: 18, fontWeight: '800' },
  scannerClose: { padding: 4 },
  camera: { flex: 1 },
  manualScanPanel: { padding: 16, backgroundColor: '#10131f' },
  scannerHint: { color: colors.card, fontSize: 13, opacity: 0.8, textAlign: 'center' },
  manualScanRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  manualScanInput: { flex: 1, height: 44, backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 12, color: colors.text },
  manualScanBtn: { backgroundColor: colors.primary, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 14 },
  manualScanBtnText: { color: colors.card, fontWeight: '700', fontSize: 12 },
  scanResultPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scanResultTitle: { color: colors.card, fontSize: 22, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  scanResultValue: { color: colors.card, fontSize: 15, textAlign: 'center', marginTop: 10, paddingHorizontal: 20, opacity: 0.9 },
  scanAgainBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13, marginTop: 24 },
  scanAgainText: { color: colors.card, fontSize: 14, fontWeight: '700' },
  scanSecondaryBtn: { marginTop: 16, paddingVertical: 10 },
  scanSecondaryText: { color: colors.card, fontSize: 13, fontWeight: '600', opacity: 0.8 },
});
