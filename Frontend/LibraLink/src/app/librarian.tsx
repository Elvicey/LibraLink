import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

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

type BookStatus = 'Available' | 'Checked Out' | 'Reserved';
type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  status: BookStatus;
  borrower?: string;
  dueDate?: string;
};

type Member = {
  id: string;
  name: string;
  email: string;
  activeLoans: number;
  fines: number;
};

const BOOKS: Book[] = [
  { id: 'b1', title: 'The Midnight Library', author: 'Matt Haig', isbn: '978-0525559474', status: 'Checked Out', borrower: 'Sophia Alvarez', dueDate: 'Jul 28' },
  { id: 'b2', title: 'Project Hail Mary', author: 'Andy Weir', isbn: '978-0593135204', status: 'Available' },
  { id: 'b3', title: 'Educated', author: 'Tara Westover', isbn: '978-0399590504', status: 'Reserved' },
  { id: 'b4', title: 'Atomic Habits', author: 'James Clear', isbn: '978-0735211292', status: 'Checked Out', borrower: 'Jonah Price', dueDate: 'Jul 24' },
];

const MEMBERS: Member[] = [
  { id: 'm1', name: 'Sophia Alvarez', email: 'sophia.a@mail.com', activeLoans: 2, fines: 0 },
  { id: 'm2', name: 'Jonah Price', email: 'jonah.p@mail.com', activeLoans: 1, fines: 3.5 },
];

function StatusBadge({ status }: { status: BookStatus }) {
  const tint =
    status === 'Available' ? colors.success : status === 'Checked Out' ? colors.warning : colors.primary;
  return (
    <View style={[styles.badge, { backgroundColor: tint + '22' }]}>
      <Text style={[styles.badgeText, { color: tint }]}>{status}</Text>
    </View>
  );
}

export default function LibrarianScreen() {
  const [tab, setTab] = useState<'inventory' | 'members'>('inventory');
  const [query, setQuery] = useState('');
  const [lookupOpen, setLookupOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  const openScanner = async () => {
    if (Platform.OS !== 'web' && !permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera access needed', 'Enable camera permission to scan member or book codes.');
        return;
      }
    }
    setScanned(false);
    setScanResult(null);
    setManualCode('');
    setScannerOpen(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanResult(data);
  };

  const handleManualScan = () => {
    const code = manualCode.trim();
    if (!code) {
      Alert.alert('Enter a code', 'Enter a member, book, or pickup code to continue.');
      return;
    }
    setScanned(true);
    setScanResult(code);
  };

  const filteredBooks = useMemo(() => {
    if (!query.trim()) return BOOKS;
    const q = query.toLowerCase();
    return BOOKS.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q)
    );
  }, [query]);

  const filteredMembers = useMemo(() => {
    if (!query.trim()) return MEMBERS;
    const q = query.toLowerCase();
    return MEMBERS.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [query]);

  const handleAction = (book: Book) => {
    setSelectedBook(book);
  };

  const confirmAction = () => {
    setSelectedBook(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Librarian</Text>
            <Text style={styles.subtitle}>Inventory & member lookup</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
              <Ionicons name="qr-code-outline" size={18} color={colors.card} />
              <Text style={styles.lookupBtnText}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.lookupBtn} onPress={() => setLookupOpen(true)}>
              <Ionicons name="person-circle-outline" size={18} color={colors.card} />
              <Text style={styles.lookupBtnText}>Lookup</Text>
            </TouchableOpacity>
          </View>
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

        {tab === 'inventory' && (
          <View style={styles.card}>
            {filteredBooks.map((book, idx) => (
              <View key={book.id} style={[styles.bookRow, idx !== filteredBooks.length - 1 && styles.rowDivider]}>
                <View style={styles.bookIcon}>
                  <Ionicons name="book-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookMeta}>{book.author} · {book.isbn}</Text>
                  {book.borrower && (
                    <Text style={styles.bookBorrower}>
                      {book.borrower} · due {book.dueDate}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <StatusBadge status={book.status} />
                  <TouchableOpacity style={styles.actionChip} onPress={() => handleAction(book)}>
                    <Text style={styles.actionChipText}>
                      {book.status === 'Checked Out' ? 'Return' : 'Check Out'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {filteredBooks.length === 0 && <Text style={styles.emptyText}>No books match "{query}"</Text>}
          </View>
        )}

        {tab === 'members' && (
          <View style={styles.card}>
            {filteredMembers.map((m, idx) => (
              <View key={m.id} style={[styles.memberRow, idx !== filteredMembers.length - 1 && styles.rowDivider]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{m.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookTitle}>{m.name}</Text>
                  <Text style={styles.bookMeta}>{m.email}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.memberLoans}>{m.activeLoans} active loan{m.activeLoans !== 1 ? 's' : ''}</Text>
                  {m.fines > 0 && <Text style={styles.memberFine}>${m.fines.toFixed(2)} owed</Text>}
                </View>
              </View>
            ))}
            {filteredMembers.length === 0 && <Text style={styles.emptyText}>No members match "{query}"</Text>}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedBook} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selectedBook?.status === 'Checked Out' ? 'Confirm Return' : 'Confirm Checkout'}
            </Text>
            <Text style={styles.modalBody}>{selectedBook?.title}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSelectedBook(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmAction}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={lookupOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Member Lookup</Text>
            <TextInput
              placeholder="Search by name, email, or member ID"
              placeholderTextColor={colors.textMuted}
              style={styles.lookupInput}
            />
            <TouchableOpacity style={styles.modalConfirm} onPress={() => setLookupOpen(false)}>
              <Text style={styles.modalConfirmText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={scannerOpen} animationType="slide">
        <SafeAreaView style={styles.scannerSafe}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan code</Text>
            <TouchableOpacity style={styles.scannerClose} onPress={() => setScannerOpen(false)}>
              <Ionicons name="close" size={26} color={colors.card} />
            </TouchableOpacity>
          </View>
          {scanResult ? (
            <View style={styles.scanResultPanel}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              <Text style={styles.scanResultTitle}>Code detected</Text>
              <Text style={styles.scanResultValue}>{scanResult}</Text>
              <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { setScanned(false); setScanResult(null); setManualCode(''); }}>
                <Text style={styles.scanAgainText}>Scan another code</Text>
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
                <Text style={styles.scannerHint}>Point the camera at a member, book, or pickup QR/barcode</Text>
                <View style={styles.manualScanRow}>
                  <TextInput
                    style={styles.manualScanInput}
                    placeholder="Enter code manually"
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  lookupBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  lookupBtnText: { color: colors.card, fontSize: 13, fontWeight: '700' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryDark, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  tabRow: { flexDirection: 'row', backgroundColor: colors.primaryLight, borderRadius: 14, padding: 4, marginBottom: 14 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.card },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  tabTextActive: { color: colors.primaryDark },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: colors.border, gap: 8, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 6, borderWidth: 1, borderColor: colors.border },
  bookRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  bookIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '700' },
  bookTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  bookMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  bookBorrower: { fontSize: 11, color: colors.warning, marginTop: 2, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actionChip: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  actionChipText: { color: colors.card, fontSize: 11, fontWeight: '700' },
  memberLoans: { fontSize: 12, color: colors.text, fontWeight: '600' },
  memberFine: { fontSize: 11, color: colors.danger, marginTop: 2, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: colors.textMuted, padding: 20, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,26,46,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 22 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 8 },
  modalBody: { fontSize: 14, color: colors.textMuted, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: colors.bg },
  modalCancelText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  modalConfirmText: { color: colors.card, fontWeight: '700', fontSize: 14 },
  lookupInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 44, marginBottom: 16, fontSize: 14, color: colors.text },
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
  scanResultTitle: { color: colors.card, fontSize: 22, fontWeight: '800', marginTop: 16 },
  scanResultValue: { color: colors.card, fontSize: 16, textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
  scanAgainBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13, marginTop: 24 },
  scanAgainText: { color: colors.card, fontSize: 14, fontWeight: '700' },
});