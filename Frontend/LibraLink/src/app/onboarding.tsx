import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Button from "../components/common/Button";
import { theme, darkColors } from "../constants/theme";

const slides = [
  {
    title: "LibraLink",
    subtitle: "Your academic library in your pocket",
    note: "A modern library experience designed for Ghanaian universities.",
    orbColors: ["rgba(11, 110, 253, 0.35)", "rgba(253, 230, 138, 0.15)"],
    neonColor: "#0b6efd",
    emoji: "📚",
  },
  {
    title: "Search any book instantly",
    subtitle: "Smart search across physical books and e-resources",
    note: "Filter by title, author, subject and real-time availability.",
    orbColors: ["rgba(16, 185, 129, 0.3)", "rgba(167, 243, 208, 0.15)"],
    neonColor: "#10b981",
    emoji: "🔍",
  },
  {
    title: "Ask AI in plain English",
    subtitle: "No codes or filters — just type natural queries",
    note: "Example: 'Find books on African economics after 2015.'",
    orbColors: ["rgba(139, 92, 246, 0.35)", "rgba(244, 63, 94, 0.15)"],
    neonColor: "#8b5cf6",
    emoji: "🤖",
  },
  {
    title: "Pick up without queuing",
    subtitle: "Reserve, schedule a slot, scan your QR code",
    note: "Collect reserved books in under 5 minutes with contactless pickup.",
    orbColors: ["rgba(6, 182, 212, 0.35)", "rgba(245, 158, 11, 0.15)"],
    neonColor: "#06b6d4",
    emoji: "⚡",
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);

  const slide = slides[index];
  const nextLabel = index === slides.length - 1 ? "Get started" : "Next";

  const stepDots = useMemo(
    () =>
      slides.map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.dot,
            idx === index ? [styles.dotActive, { backgroundColor: slide.neonColor }] : null,
          ]}
        />
      )),
    [index, slide.neonColor],
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const page = Math.round(event.nativeEvent.contentOffset.x / width);
          setIndex(page);
        }}
      >
        {slides.map((slideItem, slideIndex) => (
          <View
            key={slideIndex}
            style={[styles.container, { width }]}
          >
            {/* Ambient Glowing Orbs */}
            <View
              style={[
                styles.orb,
                {
                  backgroundColor: slideItem.orbColors[0],
                  top: "15%",
                  left: "10%",
                  shadowColor: slideItem.neonColor,
                },
              ]}
            />
            <View
              style={[
                styles.orb,
                {
                  backgroundColor: slideItem.orbColors[1],
                  bottom: "25%",
                  right: "10%",
                  width: 250,
                  height: 250,
                  borderRadius: 125,
                  shadowColor: "#fff",
                },
              ]}
            />

            {/* Glassmorphic Slide Card */}
            <View style={styles.glassCard}>
              <View style={styles.header}>
                <View
                  style={[
                    styles.heroIconContainer,
                    {
                      borderColor: slideItem.neonColor,
                      shadowColor: slideItem.neonColor,
                    },
                  ]}
                >
                  <Text style={styles.heroEmoji}>{slideItem.emoji}</Text>
                </View>
                <Text style={styles.title}>{slideItem.title}</Text>
              </View>

              <View style={styles.body}>
                <Text style={styles.subtitle}>{slideItem.subtitle}</Text>
                <Text style={styles.note}>{slideItem.note}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <View style={styles.pagination}>{stepDots}</View>
        <View style={styles.actions}>
          <Pressable
            style={styles.skipButton}
            onPress={() => router.replace("../signin")}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
          <Button
            title={nextLabel}
            onPress={() => {
              if (index === slides.length - 1) {
                router.replace("../signin");
              } else {
                ref.current?.scrollTo({
                  x: (index + 1) * width,
                  animated: true,
                });
                setIndex((prev) => prev + 1);
              }
            }}
            style={[styles.nextButton, { backgroundColor: slide.neonColor }]}
            textStyle={styles.nextButtonText}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#060913", // Deep dark canvas background
  },
  container: {
    flex: 1,
    padding: theme.spacing.xxl,
    justifyContent: "center",
    position: "relative",
  },
  orb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.28,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 70,
    elevation: 0,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: theme.borderRadius.huge,
    padding: theme.spacing.xxl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  heroIconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    // Neon glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 4,
  },
  heroEmoji: {
    fontSize: 38,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: darkColors.textLight,
    textAlign: "center",
  },
  body: {
    alignItems: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: darkColors.textLight,
    textAlign: "center",
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255, 255, 255, 0.65)",
    textAlign: "center",
    maxWidth: 280,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.xxl + 8,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: theme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 5,
  },
  dotActive: {
    width: 22,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  nextButton: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: {
    color: darkColors.textLight,
    fontSize: 16,
    fontWeight: "700",
  },
});
