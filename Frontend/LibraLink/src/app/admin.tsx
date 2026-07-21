import React, { useState, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import Button from "../components/common/Button";
import { useTheme } from "../constants/theme";

// Types
type TransactionStatus = "Overdue" | "Returned" | "Borrowed" | "Ready";
type AdminTab = "overview" | "transactions" | "inventory" | "alerts";

interface Transaction {
  id: string;
  user: string;
  studentId: string;
  book: string;
  isbn: string;
  status: TransactionStatus;
  date: string;
  dueDate: string;
  fineAmount?: string;
  isDanger?: boolean;
  isSuccess?: boolean;
  isPrimary?: boolean;
  isInfo?: boolean;
}

interface InventoryItem {
  id: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  location: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_INVENTORY: InventoryItem[] = [];

export default function Admin() {
  const router = useRouter();
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();

  // Safe Navigation Back handler
  const handleLeaveAdmin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  // State Management
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [isAddBookModalVisible, setIsAddBookModalVisible] = useState(false);
  const [isBroadcastModalVisible, setIsBroadcastModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // New Book Form state
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookCategory, setNewBookCategory] = useState("Computer Science");
  const [newBookCopies, setNewBookCopies] = useState("10");

  // Broadcast Message state
  const [broadcastNoticeText, setBroadcastNoticeText] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalVisible(false);
    router.replace("/signin" as any);
  };

  // Chart Data
  const CHART_DATA = [];

  // Category Breakdown Data
  const CATEGORY_STATS = [];

  // Transaction Helpers
  const getTxnColor = (status: TransactionStatus) => {
    switch (status) {
      case "Overdue": return colors.danger;
      case "Returned": return colors.success;
      case "Borrowed": return colors.primary;
      case "Ready": return colors.info;
      default: return colors.textMuted;
    }
  };

  const getTxnBg = (status: TransactionStatus) => {
    switch (status) {
      case "Overdue": return colors.dangerLight;
      case "Returned": return colors.successLight;
      case "Borrowed": return colors.primaryLight;
      case "Ready": return colors.infoLight;
      default: return colors.border;
    }
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        txn.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.book.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.studentId.includes(searchQuery) ||
        txn.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === "All" || txn.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

  // Handle Action in Modal
  const handleMarkReturned = (txnId: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txnId ? { ...t, status: "Returned", isSuccess: true, isDanger: false, isPrimary: false } : t
      )
    );
    setSelectedTxn(null);
    showToast(`Transaction ${txnId} marked as Returned.`);
  };

  const handleSendReminder = (user: string) => {
    setSelectedTxn(null);
    showToast(`Overdue reminder sent to ${user}.`);
  };

  const handleAddBookSubmit = () => {
    if (!newBookTitle.trim() || !newBookAuthor.trim()) {
      showToast("Please enter book title and author.");
      return;
    }
    const newBook: InventoryItem = {
      id: `B-00${inventory.length + 1}`,
      title: newBookTitle,
      author: newBookAuthor,
      category: newBookCategory,
      totalCopies: parseInt(newBookCopies, 10) || 5,
      availableCopies: parseInt(newBookCopies, 10) || 5,
      location: "Main Library - New Arrivals Desk",
    };
    setInventory([newBook, ...inventory]);
    setIsAddBookModalVisible(false);
    setNewBookTitle("");
    setNewBookAuthor("");
    showToast(`"${newBookTitle}" added to inventory!`);
  };

  const handleSendBroadcast = () => {
    if (!broadcastNoticeText.trim()) {
      showToast("Please enter a notice message.");
      return;
    }
    setIsBroadcastModalVisible(false);
    setBroadcastNoticeText("");
    showToast("Campus overdue broadcast alert dispatched!");
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <View style={[styles.toastContainer, { backgroundColor: colors.secondary }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[styles.toastText, { color: colors.textLight }]}>{toastMessage}</Text>
        </View>
      )}

      {/* Back navigation & Top Action Bar */}
      <View style={styles.topNavRow}>
        <Pressable
          style={styles.backButton}
          onPress={handleLeaveAdmin}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.backButtonRow}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
          </View>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={styles.systemStatusPill}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.systemStatusText, { color: colors.textMuted }]}>
              RFID: <Text style={{ color: colors.success, fontWeight: "700" }}>Online</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.homeIconButton,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.replace("/(tabs)" as any)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="home-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.logoutIconButton,
              {
                backgroundColor: colors.dangerLight,
                borderColor: "rgba(220, 38, 38, 0.2)",
              },
            ]}
            onPress={() => setIsLogoutModalVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Header Banner */}
      <View style={styles.headerBlock}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.adminBadgeIcon, { backgroundColor: isDark ? "rgba(59, 130, 246, 0.16)" : colors.primaryLight }]}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleBadgeGroup}>
              <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text }]}>
                Admin Dashboard
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.roleBadgeText}>LIBRARIAN</Text>
              </View>
            </View>
            <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodySmall.fontSize }]}>
              KNUST Central Library circulation metrics, inventory logs & user management.
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "overview" && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab("overview")}
        >
          <Ionicons name="grid-outline" size={16} color={activeTab === "overview" ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === "overview" ? colors.primary : colors.textMuted }]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "transactions" && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab("transactions")}
        >
          <Ionicons name="swap-horizontal-outline" size={16} color={activeTab === "transactions" ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === "transactions" ? colors.primary : colors.textMuted }]}>Loans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "inventory" && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab("inventory")}
        >
          <Ionicons name="book-outline" size={16} color={activeTab === "inventory" ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === "inventory" ? colors.primary : colors.textMuted }]}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "alerts" && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab("alerts")}
        >
          <Ionicons name="notifications-outline" size={16} color={activeTab === "alerts" ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === "alerts" ? colors.primary : colors.textMuted }]}>System</Text>
        </TouchableOpacity>
      </View>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <>
          {/* Analytics KPI Metrics Grid */}
          <View style={styles.metricsGrid}>
            <Card style={[styles.metricCard, isDark && styles.cardDark]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Loans</Text>
                <View style={[styles.metricIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="book" size={14} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>1,248</Text>
              <Text style={[styles.metricChange, { color: colors.success }]}>+12% vs last week</Text>
            </Card>

            <Card style={[styles.metricCard, isDark && styles.cardDark]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Overdue</Text>
                <View style={[styles.metricIconWrap, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: colors.danger }]}>24</Text>
              <Text style={[styles.metricChange, { color: colors.danger }]}>Requires alerts</Text>
            </Card>

            <Card style={[styles.metricCard, isDark && styles.cardDark]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Active Members</Text>
                <View style={[styles.metricIconWrap, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="people" size={14} color={colors.success} />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>3,850</Text>
              <Text style={[styles.metricChange, { color: colors.success }]}>+8.4% growth</Text>
            </Card>

            <Card style={[styles.metricCard, isDark && styles.cardDark]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Fines Collected</Text>
                <View style={[styles.metricIconWrap, { backgroundColor: colors.warningLight }]}>
                  <Ionicons name="cash" size={14} color={colors.warning} />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>GH₵ 5,040</Text>
              <Text style={[styles.metricChange, { color: colors.textMuted }]}>This month</Text>
            </Card>
          </View>

          {/* Quick Action Shortcuts Grid */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Quick Actions</Text>
          <View style={styles.quickActionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, isDark && styles.cardDark]}
              onPress={() => router.push("/course?mode=librarian" as any)}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="journal" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Course Reading</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textMuted }]}>Assign Textbooks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, isDark && styles.cardDark]}
              onPress={() => router.push("/scan" as any)}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.successLight }]}>
                <Ionicons name="qr-code" size={20} color={colors.success} />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Scan Barcode</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textMuted }]}>Check in / Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, isDark && styles.cardDark]}
              onPress={() => router.push("/pay-fines" as any)}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="card" size={20} color={colors.warning} />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Pay Fines</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textMuted }]}>Process Student Fines</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, isDark && styles.cardDark]}
              onPress={() => setIsAddBookModalVisible(true)}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="add-circle" size={20} color={colors.info} />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Add New Book</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textMuted }]}>Register Item</Text>
            </TouchableOpacity>
          </View>

          {/* Weekly Circulation Traffic chart */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Circulation Traffic</Text>
            <View style={[styles.badgePill, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.badgePillText, { color: colors.primary }]}>Peak: Wednesday</Text>
            </View>
          </View>

          <Card style={[styles.cardBg, isDark && styles.cardDark, { marginBottom: spacing.lg }]}>
            <View style={styles.chartColumns}>
              {CHART_DATA.map((item) => (
                <View key={item.day} style={styles.chartCol}>
                  <Text style={[styles.chartCount, { color: item.isPeak ? colors.success : colors.textMuted, fontWeight: item.isPeak ? "800" : "600" }]}>
                    {item.count}
                  </Text>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: item.height,
                        backgroundColor: item.color,
                        borderRadius: borderRadius.sm,
                        opacity: isDark ? 0.9 : 1,
                      },
                    ]}
                  />
                  <Text style={[styles.chartLabel, { color: colors.textMuted, marginTop: spacing.sm }]}>{item.day}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Department / Category Breakdown */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Loans by Subject Category</Text>
          <Card style={[styles.cardBg, isDark && styles.cardDark, { marginBottom: spacing.lg }]}>
            {CATEGORY_STATS.map((cat, idx) => (
              <View key={cat.category} style={[styles.catRow, idx !== CATEGORY_STATS.length - 1 && { marginBottom: spacing.md }]}>
                <View style={styles.catHeader}>
                  <Text style={[styles.catName, { color: colors.text }]}>{cat.category}</Text>
                  <Text style={[styles.catValue, { color: colors.textMuted }]}>
                    {cat.count} loans ({cat.percentage}%)
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : colors.border }]}>
                  <View style={[styles.progressBar, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                </View>
              </View>
            ))}
          </Card>

          {/* Recent Circulation Transactions */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => setActiveTab("transactions")}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>View All ({transactions.length})</Text>
            </TouchableOpacity>
          </View>

          <Card style={[styles.cardBg, isDark && styles.cardDark, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.xxl }]}>
            {transactions.slice(0, 4).map((txn, idx) => {
              const txnColor = getTxnColor(txn.status);
              const txnBg = getTxnBg(txn.status);
              return (
                <TouchableOpacity
                  key={txn.id}
                  style={[
                    styles.txnRow,
                    { paddingVertical: spacing.md, borderColor: colors.border },
                    idx === 3 && styles.lastTxnRow,
                  ]}
                  onPress={() => setSelectedTxn(txn)}
                >
                  <View style={[styles.txnLeft, { gap: spacing.md }]}>
                    <View style={[styles.avatarMini, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : colors.background }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>{txn.user[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txnUser, { color: colors.text }]} numberOfLines={1}>{txn.user}</Text>
                      <Text style={[styles.txnBook, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>{txn.book}</Text>
                    </View>
                  </View>

                  <View style={styles.txnRight}>
                    <View style={[styles.statusPill, { backgroundColor: txnBg, marginBottom: 4 }]}>
                      <Text style={[styles.statusText, { color: txnColor }]}>{txn.status.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.txnDate, { color: colors.textMuted }]}>{txn.date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>
        </>
      )}

      {/* TAB CONTENT: TRANSACTIONS / LOANS */}
      {activeTab === "transactions" && (
        <View style={{ marginBottom: spacing.xxl }}>
          {/* Search & Status Filter Controls */}
          <View style={[styles.searchFilterBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.searchBarRow}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search user, book title, or ID..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              {["All", "Overdue", "Borrowed", "Returned", "Ready"].map((filter) => {
                const isSelected = statusFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                          ? "rgba(255,255,255,0.06)"
                          : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setStatusFilter(filter)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isSelected ? colors.textLight : colors.textMuted, fontWeight: isSelected ? "700" : "500" },
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Transactions List */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
            Circulation Log ({filteredTransactions.length})
          </Text>

          <Card style={[styles.cardBg, isDark && styles.cardDark, { paddingHorizontal: spacing.md }]}>
            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-disagree" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyStateText, { color: colors.textMuted, marginTop: spacing.sm }]}>
                  No circulation records found matching your filters.
                </Text>
              </View>
            ) : (
              filteredTransactions.map((txn, idx) => {
                const txnColor = getTxnColor(txn.status);
                const txnBg = getTxnBg(txn.status);
                return (
                  <TouchableOpacity
                    key={txn.id}
                    style={[
                      styles.txnRow,
                      { paddingVertical: spacing.md, borderColor: colors.border },
                      idx === filteredTransactions.length - 1 && styles.lastTxnRow,
                    ]}
                    onPress={() => setSelectedTxn(txn)}
                  >
                    <View style={[styles.txnLeft, { gap: spacing.md, flex: 1 }]}>
                      <View style={[styles.avatarMini, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : colors.background }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>{txn.user[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.txnUser, { color: colors.text }]} numberOfLines={1}>
                          {txn.user} <Text style={{ color: colors.textMuted, fontSize: 12 }}>({txn.studentId})</Text>
                        </Text>
                        <Text style={[styles.txnBook, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
                          {txn.book}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                          Due: {txn.dueDate} {txn.fineAmount ? `• Fine: ${txn.fineAmount}` : ""}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.txnRight}>
                      <View style={[styles.statusPill, { backgroundColor: txnBg, marginBottom: 4 }]}>
                        <Text style={[styles.statusText, { color: txnColor }]}>{txn.status.toUpperCase()}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginTop: 4 }} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </Card>
        </View>
      )}

      {/* TAB CONTENT: INVENTORY */}
      {activeTab === "inventory" && (
        <View style={{ marginBottom: spacing.xxl }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Library Book Catalog</Text>
            <TouchableOpacity style={[styles.addBookButton, { backgroundColor: colors.primary }]} onPress={() => setIsAddBookModalVisible(true)}>
              <Ionicons name="add" size={16} color={colors.textLight} />
              <Text style={{ color: colors.textLight, fontWeight: "700", fontSize: 12, marginLeft: 4 }}>Add Book</Text>
            </TouchableOpacity>
          </View>

          {/* Catalog items list */}
          <Card style={[styles.cardBg, isDark && styles.cardDark, { paddingHorizontal: spacing.md }]}>
            {inventory.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.inventoryRow,
                  { paddingVertical: spacing.md, borderColor: colors.border },
                  idx === inventory.length - 1 && styles.lastTxnRow,
                ]}
              >
                <View style={[styles.bookIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="book-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginHorizontal: spacing.md }}>
                  <Text style={[styles.inventoryTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.inventoryAuthor, { color: colors.textMuted }]}>Author: {item.author}</Text>
                  <Text style={[styles.inventoryLocation, { color: colors.textMuted }]}>{item.location}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <View style={[styles.stockPill, { backgroundColor: item.availableCopies > 5 ? colors.successLight : colors.warningLight }]}>
                    <Text
                      style={[
                        styles.stockPillText,
                        { color: item.availableCopies > 5 ? colors.success : colors.warning },
                      ]}
                    >
                      {item.availableCopies} / {item.totalCopies} Available
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{item.category}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* TAB CONTENT: ALERTS & SYSTEM */}
      {activeTab === "alerts" && (
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>System & Notifications</Text>

          {/* Send Broadcast Action Card */}
          <Card style={[styles.cardBg, isDark && styles.cardDark, { marginBottom: spacing.lg }]}>
            <View style={styles.broadcastHeader}>
              <Ionicons name="megaphone" size={24} color={colors.warning} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.broadcastTitle, { color: colors.text }]}>Campus Overdue Broadcast</Text>
                <Text style={[styles.broadcastSubtitle, { color: colors.textMuted }]}>
                  Send automated push notifications to all users with overdue loans.
                </Text>
              </View>
            </View>
            <Button
              title="Dispatch Broadcast Notice"
              onPress={() => setIsBroadcastModalVisible(true)}
              style={{ marginTop: spacing.md }}
            />
          </Card>

          {/* System Health Logs */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>System Status & Audit Log</Text>
          <Card style={[styles.cardBg, isDark && styles.cardDark, { paddingHorizontal: spacing.md, marginBottom: spacing.lg }]}>
            {[].map((log, idx) => (
              <View
                key={idx}
                style={[
                  styles.sysLogRow,
                  { paddingVertical: spacing.md, borderColor: colors.border },
                  idx === 3 && styles.lastTxnRow,
                ]}
              >
                <Ionicons name={log.icon as any} size={20} color={log.color} style={{ marginRight: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sysLogText, { color: colors.text }]}>{log.text}</Text>
                  <Text style={[styles.sysLogTime, { color: colors.textMuted }]}>{log.time}</Text>
                </View>
              </View>
            ))}
          </Card>

          {/* Explicit Logout Button at bottom of System Tab */}
          <Button
            title="Log Out of Admin Session"
            variant="outline"
            onPress={() => setIsLogoutModalVisible(true)}
            style={{ borderColor: colors.danger }}
            textStyle={{ color: colors.danger, fontWeight: "700" }}
          />
        </View>
      )}

      {/* MODAL 1: Transaction Detail & Actions */}
      <Modal visible={selectedTxn !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Circulation Log Details</Text>
              <TouchableOpacity onPress={() => setSelectedTxn(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedTxn && (
              <ScrollView style={{ marginTop: spacing.md }}>
                <View style={[styles.modalInfoBox, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.background }]}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>TRANSACTION ID</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{selectedTxn.id}</Text>

                  <View style={styles.divider} />

                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>BORROWER NAME & ID</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {selectedTxn.user} ({selectedTxn.studentId})
                  </Text>

                  <View style={styles.divider} />

                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>BOOK TITLE & ISBN</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{selectedTxn.book}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>ISBN: {selectedTxn.isbn}</Text>

                  <View style={styles.divider} />

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>DUE DATE</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{selectedTxn.dueDate}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: getTxnBg(selectedTxn.status) }]}>
                      <Text style={[styles.statusText, { color: getTxnColor(selectedTxn.status) }]}>
                        {selectedTxn.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {selectedTxn.fineAmount && (
                    <View style={{ marginTop: spacing.md }}>
                      <Text style={[styles.infoLabel, { color: colors.danger }]}>PENDING FINE</Text>
                      <Text style={[styles.infoValue, { color: colors.danger, fontSize: 18, fontWeight: "800" }]}>
                        {selectedTxn.fineAmount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Modal Action Buttons */}
                <View style={[styles.modalActionsStack, { gap: spacing.md, marginTop: spacing.lg }]}>
                  {selectedTxn.status !== "Returned" && (
                    <Button
                      title="Mark as Returned"
                      onPress={() => handleMarkReturned(selectedTxn.id)}
                    />
                  )}
                  {selectedTxn.status === "Overdue" && (
                    <Button
                      title="Send Overdue Notification"
                      variant="secondary"
                      onPress={() => handleSendReminder(selectedTxn.user)}
                    />
                  )}
                  <Button
                    title="Close"
                    variant="outline"
                    onPress={() => setSelectedTxn(null)}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Add New Book Registration */}
      <Modal visible={isAddBookModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Register New Book</Text>
              <TouchableOpacity onPress={() => setIsAddBookModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: spacing.md }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Book Title</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Modern Software Engineering"
                placeholderTextColor={colors.textMuted}
                value={newBookTitle}
                onChangeText={setNewBookTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.md }]}>Author Name</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Dave Thomas"
                placeholderTextColor={colors.textMuted}
                value={newBookAuthor}
                onChangeText={setNewBookAuthor}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.md }]}>Category</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Computer Science, Economics, etc."
                placeholderTextColor={colors.textMuted}
                value={newBookCategory}
                onChangeText={setNewBookCategory}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: spacing.md }]}>Total Copies</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="10"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                value={newBookCopies}
                onChangeText={setNewBookCopies}
              />

              <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
                <Button title="Save Book to Catalog" onPress={handleAddBookSubmit} />
                <Button title="Cancel" variant="outline" onPress={() => setIsAddBookModalVisible(false)} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Campus Overdue Broadcast */}
      <Modal visible={isBroadcastModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Campus Broadcast Alert</Text>
              <TouchableOpacity onPress={() => setIsBroadcastModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Notice Message</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { color: colors.text, borderColor: colors.border, height: 90, textAlignVertical: "top" },
                ]}
                multiline
                placeholder="Attention students: Overdue loans must be returned to the Main Library by Friday to avoid account locks."
                placeholderTextColor={colors.textMuted}
                value={broadcastNoticeText}
                onChangeText={setBroadcastNoticeText}
              />

              <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
                <Button title="Send Campus Push Alert" onPress={handleSendBroadcast} />
                <Button title="Cancel" variant="outline" onPress={() => setIsBroadcastModalVisible(false)} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Logout Confirmation Sheet */}
      <Modal visible={isLogoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: spacing.xl }]}>
            <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
              <View style={[styles.logoutModalIconCircle, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="log-out" size={32} color={colors.danger} />
              </View>
              <Text style={[styles.logoutModalTitle, { color: colors.text, marginTop: spacing.md }]}>
                Log Out of Admin Session?
              </Text>
              <Text style={[styles.logoutModalSubtitle, { color: colors.textMuted, marginTop: spacing.xs }]}>
                This will terminate your librarian session and return to the Sign In screen.
              </Text>
            </View>

            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              <Button
                title="Log Out Now"
                onPress={handleConfirmLogout}
                style={{ backgroundColor: colors.danger }}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setIsLogoutModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: "700",
  },
  topNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -4,
  },
  backText: {
    fontWeight: "700",
    fontSize: 15,
  },
  homeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  systemStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 128, 61, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  systemStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  headerBlock: {
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  adminBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontWeight: "800",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  description: {
    fontWeight: "500",
    marginTop: 2,
  },
  // Tab Bar
  tabBar: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: "48%",
    padding: 14,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  metricIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  metricChange: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  // Quick Actions Grid
  quickActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: "48%",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  actionCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  // Section Headers & Titles
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardBg: {
    padding: 16,
  },
  cardDark: {
    backgroundColor: "rgba(24, 28, 51, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
  },
  // Chart Styles
  chartColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
    paddingTop: 16,
  },
  chartCol: {
    alignItems: "center",
    flex: 1,
  },
  chartCount: {
    fontSize: 10,
    marginBottom: 6,
  },
  chartBar: {
    width: 22,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  // Category Stats
  catRow: {
    width: "100%",
  },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  catName: {
    fontSize: 13,
    fontWeight: "700",
  },
  catValue: {
    fontSize: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  // Transaction rows
  txnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  lastTxnRow: {
    borderBottomWidth: 0,
  },
  txnLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "800",
    fontSize: 15,
  },
  txnUser: {
    fontSize: 14,
    fontWeight: "700",
  },
  txnBook: {
    fontSize: 12,
  },
  txnRight: {
    alignItems: "flex-end",
  },
  txnDate: {
    fontSize: 11,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  // Search & Filter
  searchFilterBlock: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  filterChipRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 13,
  },
  // Inventory
  addBookButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  inventoryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  bookIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inventoryTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  inventoryAuthor: {
    fontSize: 12,
    marginTop: 2,
  },
  inventoryLocation: {
    fontSize: 11,
    marginTop: 2,
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  // Alerts System
  broadcastHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  broadcastTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  broadcastSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sysLogRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  sysLogText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sysLogTime: {
    fontSize: 11,
    marginTop: 2,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalInfoBox: {
    padding: 16,
    borderRadius: 16,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 10,
  },
  modalActionsStack: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  // Logout Modal
  logoutModalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  logoutModalSubtitle: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
