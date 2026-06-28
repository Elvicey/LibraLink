import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Profile() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>E</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.title}>Esther Asamoah</Text>
          <Text style={styles.email}>esther@knust.edu.gh</Text>
          <Text style={styles.statusBadge}>Student member</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>14</Text>
          <Text style={styles.summaryLabel}>Borrowed this semester</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>96%</Text>
          <Text style={styles.summaryLabel}>On-time return rate</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>3</Text>
          <Text style={styles.summaryLabel}>Active holds</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Library actions</Text>
        <View style={styles.menuSection}>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/borrowed" as any)}
          >
            <Text style={styles.menuText}>Borrowing history</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/reading-lists" as any)}
          >
            <Text style={styles.menuText}>Reading lists</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/notifications" as any)}
          >
            <Text style={styles.menuText}>Notifications</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/pay-fines" as any)}
          >
            <Text style={styles.menuText}>Pay fines</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account settings</Text>
        <View style={styles.menuSection}>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/profile-details" as any)}
          >
            <Text style={styles.menuText}>Profile details</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/security" as any)}
          >
            <Text style={styles.menuText}>Security</Text>
          </Pressable>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>Sign out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f7f9fc" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#0b6efd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarInitial: { color: "white", fontSize: 28, fontWeight: "800" },
  userInfo: { flex: 1 },
  title: { fontSize: 28, fontWeight: "800" },
  email: { color: "#6b7280", marginTop: 4 },
  statusBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    color: "#0b6efd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "white",
    marginHorizontal: 4,
    minWidth: 100,
  },
  summaryValue: { fontSize: 24, fontWeight: "700" },
  summaryLabel: { color: "#6b7280", marginTop: 8, fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  menuSection: {
    backgroundColor: "white",
    borderRadius: 24,
    overflow: "hidden",
  },
  menuItem: { padding: 16, borderBottomWidth: 1, borderColor: "#f1f3f5" },
  menuText: { fontSize: 16, fontWeight: "600" },
  signOutText: { color: "#dc2626" },
});
