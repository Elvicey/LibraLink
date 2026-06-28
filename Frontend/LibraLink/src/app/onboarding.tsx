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

const slides = [
  {
    title: "LibraLink",
    subtitle: "Your academic library in your pocket",
    note: "A modern library experience designed for Ghanaian universities.",
    background: "#0d253f",
    color: "white",
  },
  {
    title: "Search any book instantly",
    subtitle: "Smart search across physical books and e-resources",
    note: "Filter by title, author, subject and real-time availability.",
    background: "#f5fbf8",
    color: "#0d253f",
  },
  {
    title: "Ask AI in plain English",
    subtitle: "No codes or filters — just type natural queries",
    note: "Example: 'Find books on African economics after 2015.'",
    background: "#f7f8ff",
    color: "#0d253f",
  },
  {
    title: "Pick up without queuing",
    subtitle: "Reserve, schedule a slot, scan your QR code",
    note: "Collect reserved books in under 5 minutes with contactless pickup.",
    background: "#ffffff",
    color: "#0d253f",
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
          style={[styles.dot, idx === index && styles.dotActive]}
        />
      )),
    [index],
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
            style={[
              styles.container,
              { backgroundColor: slideItem.background, width },
            ]}
          >
            <View style={styles.header}>
              <View
                style={[
                  styles.hero,
                  {
                    backgroundColor:
                      slideItem.color === "white"
                        ? "#e6f3ea"
                        : "rgba(255,255,255,0.14)",
                  },
                ]}
              >
                <Text style={[styles.heroIcon, { color: slideItem.color }]}>
                  📚
                </Text>
              </View>
              <Text style={[styles.title, { color: slideItem.color }]}>
                {slideItem.title}
              </Text>
            </View>
            <View style={styles.body}>
              <Text style={[styles.subtitle, { color: slideItem.color }]}>
                {slideItem.subtitle}
              </Text>
              <Text
                style={[
                  styles.note,
                  {
                    color: slideItem.color === "white" ? "#6b7280" : "#556576",
                  },
                ]}
              >
                {slideItem.note}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.pagination}>{stepDots}</View>
        <View style={styles.actions}>
          <Pressable
            style={styles.skipButton}
            onPress={() => router.replace("../signin")}
          >
            <Text style={[styles.skipText, { color: slide.color }]}>Skip</Text>
          </Pressable>
          <Pressable
            style={[
              styles.nextButton,
              {
                backgroundColor: slide.color === "white" ? "#0b6efd" : "white",
              },
            ]}
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
          >
            <Text
              style={[
                styles.nextText,
                { color: slide.color === "white" ? "white" : "#0d253f" },
              ]}
            >
              {nextLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1, padding: 30, justifyContent: "space-between" },
  header: { marginTop: 60 },
  hero: {
    width: 92,
    height: 92,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  heroIcon: { fontSize: 36 },
  title: { fontSize: 36, fontWeight: "800", lineHeight: 42 },
  body: { flex: 1, justifyContent: "center" },
  subtitle: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  note: { fontSize: 16, lineHeight: 24, maxWidth: 320 },
  footer: { marginBottom: 40, paddingHorizontal: 12 },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  dotActive: { backgroundColor: "#0b6efd" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: { padding: 12 },
  skipText: { fontSize: 16, fontWeight: "600" },
  nextButton: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 14 },
  nextText: { fontSize: 16, fontWeight: "700" },
});
