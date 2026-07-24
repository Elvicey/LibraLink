import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

type Role = 'Student' | 'Librarian' | 'Admin';
type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Suspended';
};

type ModerationItem = {
  id: string;
  type: 'Review' | 'Reading List' | 'Comment';
  submittedBy: string;
  preview: string;
};

const USERS: UserRow[] = [
  { id: '1', name: 'Sophia Alvarez', email: 'sophia.a@mail.com', role: 'Student', status: 'Active' },
  { id: '2', name: 'Marcus Reed', email: 'marcus.r@mail.com', role: 'Librarian', status: 'Active' },
  { id: '3', name: 'Elena Kim', email: 'elena.k@mail.com', role: 'Student', status: 'Suspended' },
  { id: '4', name: 'Jonah Price', email: 'jonah.p@mail.com', role: 'Student', status: 'Active' },
];

const MODERATION: ModerationItem[] = [
  { id: 'm1', type: 'Review', submittedBy: 'Elena Kim', preview: 'This book was way overrated, honestly not worth the hype...' },
  { id: 'm2', type: 'Reading List', submittedBy: 'Jonah Price', preview: 'Flagged for possible spam link in description' },
];

function StatCard({ label, value, icon, tint }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tint: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: tint }]}>
      <Ionicons name={icon} size={20} color={colors.card} style={{ marginBottom: 8 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const tint = role === 'Admin' ? colors.primary : role === 'Librarian' ? colors.warning : colors.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: tint + '22' }]}>
      <Text style={[styles.badgeText, { color: tint }]}>{role}</Text>
    </View>
  );
}

function StatusDot({ status }: { status: UserRow['status'] }) {
  const color = status === 'Active' ? colors.success : colors.danger;
  return (
    <View style={styles.statusRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return USERS;
    const q = query.toLowerCase();
    return USERS.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={20} color={colors.primaryDark} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <View>
            <Text style={styles.title}>Admin</Text>
            <Text style={styles.subtitle}>Library overview & controls</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total Users" value="1,204" icon="people-outline" tint={colors.primary} />
          <StatCard label="Books in Catalog" value="8,530" icon="book-outline" tint={colors.primaryDark} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Active Loans" value="342" icon="swap-horizontal-outline" tint="#9B7BFF" />
          <StatCard label="Overdue" value="27" icon="alert-circle-outline" tint={colors.danger} />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>User Management</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search users by name or email"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.card}>
          {filteredUsers.map((user, idx) => (
            <View
              key={user.id}
              style={[styles.userRow, idx !== filteredUsers.length - 1 && styles.rowDivider]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <RoleBadge role={user.role} />
                <StatusDot status={user.status} />
              </View>
            </View>
          ))}
          {filteredUsers.length === 0 && (
            <Text style={styles.emptyText}>No users match "{query}"</Text>
          )}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Content Moderation</Text>
          <View style={styles.pendingPill}>
            <Text style={styles.pendingPillText}>{MODERATION.length} pending</Text>
          </View>
        </View>

        <View style={styles.card}>
          {MODERATION.map((item, idx) => (
            <View
              key={item.id}
              style={[styles.modRow, idx !== MODERATION.length - 1 && styles.rowDivider]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.modType}>{item.type} · {item.submittedBy}</Text>
                <Text style={styles.modPreview} numberOfLines={2}>{item.preview}</Text>
              </View>
              <View style={styles.modActions}>
                <TouchableOpacity style={[styles.modBtn, { backgroundColor: colors.success + '22' }]}>
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modBtn, { backgroundColor: colors.danger + '22' }]}>
                  <Ionicons name="close" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 12, paddingHorizontal: 10, height: 38 },
  backBtnText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 18, padding: 16 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.card },
  statLabel: { fontSize: 12, color: colors.card, opacity: 0.85, marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sectionAction: { fontSize: 13, fontWeight: '600', color: colors.primary },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: colors.border, gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 6, borderWidth: 1, borderColor: colors.border },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '700' },
  userName: { fontSize: 14, fontWeight: '600', color: colors.text },
  userEmail: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: colors.textMuted, padding: 20, fontSize: 13 },
  pendingPill: { backgroundColor: colors.primaryLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pendingPillText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  modRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  modType: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 3 },
  modPreview: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  modActions: { flexDirection: 'row', gap: 8 },
  modBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});