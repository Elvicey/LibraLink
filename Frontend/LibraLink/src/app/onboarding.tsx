import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Button from "../components/common/Button";
import { theme, lightColors } from "../constants/theme";

const slides = [
  {
    title: "LibraLink",
    subtitle: "Your academic library in your pocket",
    note: "A modern library experience designed for Ghanaian universities.",
    orbColors: ["rgba(11, 110, 253, 0.12)", "rgba(253, 230, 138, 0.06)"],
    neonColor: "#0b6efd",
    emoji: "📚",
  },
  {
    title: "Search any book instantly",
    subtitle: "Smart search across physical books and e-resources",
    note: "Filter by title, author, subject and real-time availability.",
    orbColors: ["rgba(16, 185, 129, 0.10)", "rgba(167, 243, 208, 0.06)"],
    neonColor: "#10b981",
    emoji: "🔍",
  },
  {
    title: "Ask AI in plain English",
    subtitle: "No codes or filters — just type natural queries",
    note: "Example: 'Find books on African economics after 2015.'",
    orbColors: ["rgba(139, 92, 246, 0.12)", "rgba(244, 63, 94, 0.06)"],
    neonColor: "#8b5cf6",
    emoji: "🤖",
  },
  {
    title: "Pick up without queuing",
    subtitle: "Reserve, schedule a slot, scan your QR code",
    note: "Collect reserved books in under 5 minutes with contactless pickup.",
    orbColors: ["rgba(6, 182, 212, 0.12)", "rgba(245, 158, 11, 0.06)"],
    neonColor: "#06b6d4",
    emoji: "⚡",
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
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
    <View style={styles.outerContainer}>
      {/* Absolute background image filling entire viewport */}
      <ImageBackground
        source={require("../../assets/images/onboarding-bg.jpg")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      
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
              style={[styles.container, { width, height }]}
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
                    shadowColor: "#ddd",
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
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    position: "relative",
  },
  wrapper: {
    flex: 1,
    backgroundColor: "rgba(247, 249, 252, 0.22)", // Translucent overlay mask
  },
  container: {
    paddingHorizontal: theme.spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  orb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 50,
    elevation: 0,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1.8,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: theme.borderRadius.huge,
    paddingVertical: theme.spacing.huge,
    paddingHorizontal: theme.spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
    marginVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  heroIconContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  heroEmoji: {
    fontSize: 52,
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "900",
    color: lightColors.text,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  body: {
    alignItems: "center",
  },
  subtitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "800",
    color: lightColors.text,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  note: {
    fontSize: 18,
    lineHeight: 26,
    color: lightColors.text,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 300,
  },
  footer: {
    position: "absolute",
    bottom: 50,
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
    backgroundColor: "rgba(0, 0, 0, 0.16)",
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
    fontWeight: "700",
    color: lightColors.textMuted,
  },
  nextButton: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: {
    color: lightColors.textLight,
    fontSize: 16,
    fontWeight: "700",
  },
});
