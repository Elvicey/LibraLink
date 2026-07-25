import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  AUTH_LIBRARY_OVERLAY,
  AuthLibraryBackground,
  LIGHT_LIBRARY_OVERLAY,
} from '../components/auth/AuthLibraryBackground';
import { useTheme } from '../constants/theme';
import { usersService, AppUser, primaryRole } from '../services/users';
import { booksService } from '../services/books';
import { borrowsService } from '../services/borrows';

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

const ROLE_LABEL: Record<string, string> = { ADMIN: 'Admin', LIBRARIAN: 'Librarian', STUDENT: 'Student' };

function displayName(u: AppUser): string {
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User #${u.id}`;
}

function StatCard({ label, value, icon, tint }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tint: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: tint }]}>
      <Ionicons name={icon} size={20} color={colors.card} style={{ marginBottom: 8 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RoleBadge({ role }: { role: string }) {
  const tint = role === 'ADMIN' ? colors.primary : role === 'LIBRARIAN' ? colors.warning : colors.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: tint + '22' }]}>
      <Text style={[styles.badgeText, { color: tint }]}>{ROLE_LABEL[role] || role}</Text>
    </View>
  );
}

function StatusDot({ active }: { active: boolean }) {
  const color = active ? colors.success : colors.danger;
  return (
    <View style={styles.statusRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{active ? 'Active' : 'Suspended'}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [bookCount, setBookCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningOverdue, setRunningOverdue] = useState(false);

  const runOverdueCheck = async () => {
    if (runningOverdue) return;
    setRunningOverdue(true);
    try {
      const { processed } = await borrowsService.runOverdueCheck();
      Alert.alert(
        'Overdue check complete',
        processed > 0
          ? `${processed} overdue loan(s) were flagged and their fines updated.`
          : 'No overdue loans found — everything is on time.'
      );
    } catch (e: any) {
      Alert.alert('Could not run overdue check', e?.message || 'Please try again.');
    } finally {
      setRunningOverdue(false);
    }
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const [userList, books] = await Promise.all([
        usersService.list(),
        booksService.list().catch(() => []),
      ]);
      setUsers(userList);
      setBookCount(books.length);
    } catch (e: any) {
      setError(e?.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const assignRole = (user: AppUser) => {
    const apply = async (role: string) => {
      try {
        await usersService.assignRole(user.id, role);
        await load();
      } catch (e: any) {
        Alert.alert('Could not update role', e?.message || 'Please try again.');
      }
    };
    Alert.alert(
      `Manage ${displayName(user)}`,
      'Grant a role to this user.',
      [
        { text: 'Student', onPress: () => apply('STUDENT') },
        { text: 'Librarian', onPress: () => apply('LIBRARIAN') },
        { text: 'Admin', onPress: () => apply('ADMIN') },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter(
      (u) => displayName(u).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    );
  }, [query, users]);

  const librarianCount = useMemo(
    () => users.filter((u) => primaryRole(u) === 'LIBRARIAN' || primaryRole(u) === 'ADMIN').length,
    [users]
  );
  const suspendedCount = useMemo(() => users.filter((u) => u.active === false).length, [users]);

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

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {error && (
              <TouchableOpacity style={styles.errorBox} onPress={load}>
                <Text style={styles.errorText}>{error} — tap to retry</Text>
              </TouchableOpacity>
            )}

            <View style={styles.statsRow}>
              <StatCard label="Total Users" value={String(users.length)} icon="people-outline" tint={colors.primary} />
              <StatCard label="Books in Catalog" value={bookCount == null ? '—' : String(bookCount)} icon="book-outline" tint={colors.primaryDark} />
            </View>
            <View style={styles.statsRow}>
              <StatCard label="Staff" value={String(librarianCount)} icon="shield-checkmark-outline" tint="#3FAE86" />
              <StatCard label="Suspended" value={String(suspendedCount)} icon="alert-circle-outline" tint={colors.danger} />
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Admin Tools</Text>
            </View>
            <View style={styles.toolsRow}>
              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => router.push('/reports' as any)}
                accessibilityLabel="Reports and analytics"
              >
                <Ionicons name="bar-chart-outline" size={22} color={colors.primary} />
                <Text style={styles.toolTitle}>Reports</Text>
                <Text style={styles.toolSub}>Analytics & insights</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={runOverdueCheck}
                disabled={runningOverdue}
                accessibilityLabel="Run the overdue check"
              >
                {runningOverdue ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons name="time-outline" size={22} color={colors.primary} />
                )}
                <Text style={styles.toolTitle}>Overdue check</Text>
                <Text style={styles.toolSub}>{runningOverdue ? 'Running…' : 'Flag late loans & fines'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>User Management</Text>
              <Text style={styles.sectionAction}>{users.length} total</Text>
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
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userRow, idx !== filteredUsers.length - 1 && styles.rowDivider]}
                  onPress={() => assignRole(user)}
                  accessibilityLabel={`Manage ${displayName(user)}`}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{displayName(user).charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{displayName(user)}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <RoleBadge role={primaryRole(user)} />
                    <StatusDot active={user.active !== false} />
                  </View>
                </TouchableOpacity>
              ))}
              {filteredUsers.length === 0 && (
                <Text style={styles.emptyText}>
                  {query ? `No users match "${query}"` : 'No users found.'}
                </Text>
              )}
            </View>
          </>
        )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 12, paddingHorizontal: 10, height: 38 },
  backBtnText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  errorBox: { backgroundColor: colors.danger + '18', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 18, padding: 16 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.card },
  statLabel: { fontSize: 12, color: colors.card, opacity: 0.85, marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sectionAction: { fontSize: 13, fontWeight: '600', color: colors.primary },
  toolsRow: { flexDirection: 'row', gap: 12 },
  toolCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 4 },
  toolTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 },
  toolSub: { fontSize: 12, color: colors.textMuted },
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
});
