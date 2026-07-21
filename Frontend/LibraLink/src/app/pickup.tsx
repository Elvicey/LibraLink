import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ScreenWrapper from "../components/common/ScreenWrapper";
import { useTheme } from "../constants/theme";

interface QueueItem {
  id: string;
  student: string;
  book: string;
  time: string;
  status: "ready" | "processing";
}

const INITIAL_QUEUE: QueueItem[] = [];

export default function BookPickup() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"student" | "staff">("student");
  
  // Student Booking Form states
  const [selectedDay, setSelectedDay] = useState("Tue 21");
  const [selectedSlot, setSelectedSlot] = useState("11:00 AM - 01:00 PM");
  const [selectedDesk, setSelectedDesk] = useState("Desk A (KNUST Main)");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  
  // Staff Queue states
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  
  const { colors, spacing, borderRadius, typography, isDark } = useTheme();
  const styles = createStyles(colors, spacing, borderRadius, typography, isDark);

  const handleCreateBooking = () => {
    setBookingConfirmed(true);
    setTimeout(() => setBookingConfirmed(false), 4000);
  };

  const handleCompletePickup = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleNotifyStudent = (name: string) => {
    alert(`Alert notification sent to ${name}!`);
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
      {/* Back button with chevron icon */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </View>
      </Pressable>

      <Text style={[styles.title, { fontSize: typography.titleMedium.fontSize, color: colors.text, marginBottom: spacing.xs }]}>
        Pick-Up Scheduler
      </Text>
      <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.bodyMedium.fontSize, lineHeight: typography.bodyMedium.lineHeight, marginBottom: spacing.lg }]}>
        Schedule collection times at KNUST desks, or monitor checkout pick-up queues.
      </Text>

      {/* Role Selector Tabs */}
      <View style={styles.roleTabs}>
        <Pressable
          style={[styles.roleTab, viewMode === "student" && styles.activeRoleTab]}
          onPress={() => setViewMode("student")}
        >
          <Text style={[styles.roleTabText, viewMode === "student" && styles.activeRoleTabText, { color: viewMode === "student" ? colors.textLight : colors.textMuted }]}>
            Student Booking
          </Text>
        </Pressable>
        <Pressable
          style={[styles.roleTab, viewMode === "staff" && styles.activeRoleTab]}
          onPress={() => setViewMode("staff")}
        >
          <Text style={[styles.roleTabText, viewMode === "staff" && styles.activeRoleTabText, { color: viewMode === "staff" ? colors.textLight : colors.textMuted }]}>
            Staff Queue Monitor
          </Text>
        </Pressable>
      </View>

      {/* STUDENT BOOKING SCREEN */}
      {viewMode === "student" && (
        <View style={styles.section}>
          {bookingConfirmed && (
            <View style={[styles.successBanner, { backgroundColor: colors.successLight, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ marginRight: spacing.xs }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.successTitle, { color: colors.success }]}>Pick-Up Reserved!</Text>
                <Text style={[styles.successDesc, { color: colors.success }]}>
                  Location: {selectedDesk}. Time: {selectedDay} at {selectedSlot.split(" - ")[0]}.
                </Text>
              </View>
            </View>
          )}

          {/* Date Picker Grid */}
          <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: spacing.sm }]}>Select Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.dateRow, { marginBottom: spacing.md }]}>
            {["Mon 20", "Tue 21", "Wed 22", "Thu 23", "Fri 24"].map((day) => {
              const isSelected = selectedDay === day;
              return (
                <Pressable
                  key={day}
                  style={[
                    styles.dateChip,
                    isSelected && { borderColor: colors.primary, backgroundColor: isDark ? "rgba(11, 110, 253, 0.12)" : colors.primaryLight },
                    { borderColor: colors.border, borderRadius: borderRadius.md },
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dateChipText, isSelected && { color: colors.primary, fontWeight: "700" }, { color: colors.text }]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Time Slot Picker Grid */}
          <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: spacing.sm }]}>Select Time Slot</Text>
          <View style={[styles.gridRow, { marginBottom: spacing.md }]}>
            {["09:00 AM - 11:00 AM", "11:00 AM - 01:00 PM", "01:00 PM - 03:00 PM", "03:00 PM - 05:00 PM"].map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <Pressable
                  key={slot}
                  style={[
                    styles.slotTile,
                    isSelected && { borderColor: colors.primary, backgroundColor: isDark ? "rgba(11, 110, 253, 0.12)" : colors.primaryLight },
                    { borderColor: colors.border, borderRadius: borderRadius.md },
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotTileText, isSelected && { color: colors.primary, fontWeight: "700" }, { color: colors.text }]}>
                    {slot.split(" - ")[0]}
                  </Text>
                  <Text style={[styles.slotTileSub, { color: colors.textMuted }]}>
                    {slot.split(" - ")[1]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Desk Selector Grid */}
          <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: spacing.sm }]}>Select Distribution Desk</Text>
          <View style={[styles.deskContainer, { marginBottom: spacing.lg }]}>
            {["Desk A (KNUST Main)", "Desk B (Science Lab)", "Desk C (Business Block)"].map((desk) => {
              const isSelected = selectedDesk === desk;
              return (
                <Pressable
                  key={desk}
                  style={[
                    styles.deskTile,
                    isSelected && { borderColor: colors.primary, backgroundColor: isDark ? "rgba(11, 110, 253, 0.12)" : colors.primaryLight },
                    { borderColor: colors.border, borderRadius: borderRadius.lg },
                  ]}
                  onPress={() => setSelectedDesk(desk)}
                >
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={isSelected ? colors.primary : colors.textMuted}
                    style={{ marginRight: spacing.sm }}
                  />
                  <Text style={[styles.deskTileText, isSelected && { color: colors.primary, fontWeight: "700" }, { color: colors.text }]}>
                    {desk}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: "auto" }} />}
                </Pressable>
              );
            })}
          </View>

          <Button
            title="Book Time Slot"
            onPress={handleCreateBooking}
            icon={<Ionicons name="calendar-outline" size={18} color={colors.textLight} />}
          />
        </View>
      )}

      {/* STAFF QUEUE MONITOR SCREEN */}
      {viewMode === "staff" && (
        <View style={styles.section}>
          <Text style={[styles.subSectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Live Pickup Queue</Text>
          {queue.length === 0 ? (
            <Text style={[styles.emptyQueue, { color: colors.textMuted }]}>No pending pickups at this desk window.</Text>
          ) : (
            queue.map((item) => (
              <Card key={item.id} style={[styles.queueCard, isDark ? styles.cardDark : null, { marginBottom: spacing.md, borderColor: colors.border }]}>
                <View style={styles.queueInfo}>
                  <View style={styles.queueHeaderRow}>
                    <Text style={[styles.studentName, { color: colors.text }]}>{item.student}</Text>
                    <Text style={[styles.pickupTime, { color: colors.primary }]}>{item.time}</Text>
                  </View>
                  <Text style={[styles.bookTitle, { color: colors.textMuted, marginTop: 2 }]}>{item.book}</Text>
                  
                  <View style={styles.queueFooterRow}>
                    {/* Status badges */}
                    <View style={[styles.statusBadge, { backgroundColor: item.status === "ready" ? colors.successLight : colors.warningLight }]}>
                      <Text style={[styles.statusText, { color: item.status === "ready" ? colors.success : colors.warning }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actionButtons}>
                      <Pressable
                        style={[styles.actionIconBtn, { backgroundColor: colors.primaryLight }]}
                        onPress={() => handleNotifyStudent(item.student)}
                      >
                        <Ionicons name="notifications-outline" size={16} color={colors.primary} />
                      </Pressable>
                      <Pressable
                        style={[styles.actionIconBtn, { backgroundColor: colors.successLight }]}
                        onPress={() => handleCompletePickup(item.id)}
                      >
                        <Ionicons name="checkmark-outline" size={16} color={colors.success} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}

const createStyles = (colors: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: "transparent",
    },
    backButton: {
      marginBottom: 16,
      alignSelf: "flex-start",
    },
    backButtonRow: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: -4,
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
    roleTabs: {
      flexDirection: "row",
      backgroundColor: isDark ? "rgba(24, 28, 51, 0.85)" : colors.surface,
      borderColor: colors.border,
      borderWidth: 1.2,
      borderRadius: borderRadius.xl,
      padding: 4,
      marginBottom: spacing.lg,
    },
    roleTab: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.lg,
    },
    activeRoleTab: {
      backgroundColor: colors.primary,
    },
    roleTabText: {
      fontSize: 14,
      fontWeight: "700",
    },
    activeRoleTabText: {
      fontWeight: "800",
    },
    section: {
      marginTop: spacing.xs,
    },
    successBanner: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(21, 128, 61, 0.15)",
    },
    successTitle: {
      fontSize: 14,
      fontWeight: "800",
    },
    successDesc: {
      fontSize: 12,
      marginTop: 2,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: "700",
    },
    dateRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    dateChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.xs,
    },
    dateChipText: {
      fontSize: 13,
      fontWeight: "600",
    },
    gridRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    slotTile: {
      width: "47%",
      padding: spacing.md,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    slotTileText: {
      fontSize: 13,
      fontWeight: "800",
    },
    slotTileSub: {
      fontSize: 10,
      marginTop: 2,
    },
    deskContainer: {
      gap: spacing.sm,
    },
    deskTile: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.md,
      borderWidth: 1.5,
    },
    deskTileText: {
      fontSize: 14,
      fontWeight: "600",
    },
    // Staff styles
    subSectionTitle: {
      fontSize: 15,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    emptyQueue: {
      fontSize: 13,
      fontStyle: "italic",
    },
    queueCard: {
      padding: spacing.md,
      borderWidth: 1,
    },
    cardDark: {
      backgroundColor: "rgba(24, 28, 51, 0.85)",
      borderColor: "rgba(255, 255, 255, 0.06)",
      borderWidth: 1,
    },
    queueInfo: {
      flex: 1,
    },
    queueHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    studentName: {
      fontSize: 15,
      fontWeight: "700",
    },
    pickupTime: {
      fontSize: 13,
      fontWeight: "800",
    },
    bookTitle: {
      fontSize: 13,
    },
    queueFooterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: "rgba(0,0,0,0.03)",
      paddingTop: spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 9,
      fontWeight: "900",
    },
    actionButtons: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    actionIconBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
  });
