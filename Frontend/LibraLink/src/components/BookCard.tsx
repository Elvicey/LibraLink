import { useState } from "react";
import { Link } from "expo-router";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../constants/theme";

export default function BookCard({ book }: { book: any }) {
  const { colors, spacing, borderRadius } = useTheme();
  const [reserved, setReserved] = useState(false);

  const handleReserve = () => {
    setReserved(true);
    // Auto reset state after 3 seconds for demonstration
    setTimeout(() => {
      setReserved(false);
    }, 3000);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.xl,
          padding: spacing.md,
          borderColor: colors.border,
          marginBottom: spacing.md,
        },
      ]}
    >
      {/* Book Cover Placeholder */}
      <View
        style={[
          styles.coverPlaceholder,
          {
            backgroundColor: book.available ? colors.primaryLight : colors.secondaryLight,
            borderRadius: borderRadius.md,
            marginRight: spacing.md,
          },
        ]}
      >
        <Ionicons
          name="book"
          size={24}
          color={book.available ? colors.primary : colors.textMuted}
        />
      </View>

      {/* Book Details Container */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
          {book.author}
        </Text>
        
        {/* Availability Tag & Reserve Button Row */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.availabilityBadge,
              {
                backgroundColor: book.available ? colors.successLight : colors.dangerLight,
              },
            ]}
          >
            <Text
              style={[
                styles.availabilityText,
                { color: book.available ? colors.success : colors.danger },
              ]}
            >
              {book.available ? "Available" : "On Loan"}
            </Text>
          </View>
          
          {book.available && (
            <Pressable
              style={[
                styles.reserveBtn,
                { backgroundColor: reserved ? colors.successLight : colors.primaryLight },
              ]}
              onPress={handleReserve}
            >
              <Ionicons
                name={reserved ? "checkmark-circle" : "bookmark-outline"}
                size={11}
                color={reserved ? colors.success : colors.primary}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.reserveBtnText, { color: reserved ? colors.success : colors.primary }]}>
                {reserved ? "Reserved" : "Reserve"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Action Navigation Button */}
      <Link
        href={`/book/${book.id}` as any}
        style={[
          styles.link,
          {
            backgroundColor: colors.primaryLight,
            borderRadius: borderRadius.lg,
          },
        ]}
      >
        <View style={styles.linkContent}>
          <Text style={[styles.linkText, { color: colors.primary }]}>View</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  coverPlaceholder: {
    width: 48,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    alignItems: "center",
  },
  availabilityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  reserveBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reserveBtnText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkText: {
    fontWeight: "700",
    fontSize: 13,
  },
});
