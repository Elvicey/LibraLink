import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useRef, useState, type ReactNode } from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  ListRenderItem,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandLogo } from "../components/common/BrandLogo";
import { theme } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ONBOARDING_SEEN_KEY = "hasSeenOnboarding";
const LIBRARY_BG = require("../../assets/images/onboarding-library-bg.png");

const Colors = {
  bgDeep: "#0a1628",
  teal: "#5DCAA5",
  tealDark: "#04342C",
  textWhite: "#ffffff",
  textSecondary: "rgba(255,255,255,0.72)",
  textMuted: "rgba(255,255,255,0.45)",
  dotInactive: "rgba(255,255,255,0.25)",
  borderDefault: "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.28)",
  cardBg: "rgba(10, 22, 40, 0.82)",
  cardBorder: "rgba(255,255,255,0.14)",
};

interface Slide {
  id: string;
  heading: string;
  body: string;
  illustration?: ReactNode;
}

function PhotoCardFrame({
  crop = "center",
  children,
}: {
  crop?: "left" | "center" | "right";
  children: ReactNode;
}) {
  const cropStyle =
    crop === "left"
      ? { transform: [{ scale: 1.45 }, { translateX: 36 }] }
      : crop === "right"
        ? { transform: [{ scale: 1.45 }, { translateX: -36 }] }
        : { transform: [{ scale: 1.3 }] };

  return (
    <View style={styles.photoCard}>
      <ImageBackground
        source={LIBRARY_BG}
        style={styles.photoCardBg}
        imageStyle={[styles.photoCardImage, cropStyle]}
        resizeMode="cover"
      >
        <View style={styles.photoCardScrim} />
        <View style={styles.photoCardContent}>{children}</View>
      </ImageBackground>
    </View>
  );
}

const SearchPreview = () => (
  <PhotoCardFrame crop="left">
    <View style={styles.mockCard}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.searchQuery} numberOfLines={1}>
          African economics after 2015
        </Text>
      </View>

      <View style={styles.resultRow}>
        <View style={[styles.resultCover, { backgroundColor: "#D85A30" }]} />
        <View style={styles.resultMeta}>
          <Text style={styles.resultTitle}>Development Economics</Text>
          <Text style={styles.resultSub}>3 copies · Ground floor</Text>
        </View>
        <View style={styles.resultBadge}>
          <Text style={styles.resultBadgeText}>Match</Text>
        </View>
      </View>

      <View style={[styles.resultRow, styles.resultRowMuted]}>
        <View style={[styles.resultCover, { backgroundColor: "#378ADD" }]} />
        <View style={styles.resultMeta}>
          <Text style={styles.resultTitle}>African Growth Models</Text>
          <Text style={styles.resultSub}>1 copy · Level 2</Text>
        </View>
      </View>
    </View>
  </PhotoCardFrame>
);

const ReservePreview = () => (
  <PhotoCardFrame crop="right">
    <View style={styles.mockCard}>
      <View style={styles.reserveBookRow}>
        <View style={[styles.resultCover, styles.reserveCover]} />
        <View style={styles.resultMeta}>
          <Text style={styles.resultTitle}>Introduction to Statistics</Text>
          <Text style={styles.reserveStatus}>Available · Science wing</Text>
        </View>
      </View>

      <View style={styles.reserveTimeline}>
        <View style={styles.timelineDot} />
        <Text style={styles.timelineText}>Held for 48 hours · Pick up by Friday</Text>
      </View>

      <View style={styles.reserveButton}>
        <Text style={styles.reserveButtonText}>Reserved · Ready to collect</Text>
      </View>
    </View>
  </PhotoCardFrame>
);

const SLIDES: Slide[] = [
  {
    id: "1",
    heading: "Your campus library, in your pocket",
    body: "Search, reserve, and borrow books from anywhere on campus",
  },
  {
    id: "2",
    heading: "Smart search powered by AI",
    body: 'Ask in plain language — "Find African economics books after 2015" — and get instant results',
    illustration: <SearchPreview />,
  },
  {
    id: "3",
    heading: "Reserve books before you arrive",
    body: "Hold a title for 48 hours — pick it up at a time that works for you",
    illustration: <ReservePreview />,
  },
];

const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

export default function Onboarding() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const isLast = activeIndex === SLIDES.length - 1;

  const finishOnboarding = async (route: "/signup" | "/signin") => {
    if (!__DEV__) {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    }
    router.replace(route);
  };

  const handleNext = () => {
    if (isLast) {
      void finishOnboarding("/signup");
      return;
    }

    const next = activeIndex + 1;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const renderItem: ListRenderItem<Slide> = ({ item, index }) => (
    <View style={[styles.slide, index === 0 && styles.slideFirst]}>
      {item.illustration ? (
        <View style={styles.illustrationWrap}>{item.illustration}</View>
      ) : (
        <View style={styles.slideSpacer} />
      )}
      <Text style={styles.slideHeading}>{item.heading}</Text>
      <Text style={styles.slideBody}>{item.body}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.content} edges={["top", "bottom", "left", "right"]}>
        <View style={styles.logoArea}>
          <BrandLogo variant="iconWithLabel" size="onboarding" />
        </View>

        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          style={styles.flatList}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.ctaArea}>
          <Pressable style={styles.btnPrimary} onPress={handleNext}>
            <Text style={styles.btnPrimaryText}>
              {isLast ? "Create an account" : activeIndex === 0 ? "Get Started" : "Next"}
            </Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>already have an account</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.btnGhost} onPress={() => void finishOnboarding("/signin")}>
            <Text style={styles.btnGhostText}>Log in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  content: {
    flex: 1,
  },
  logoArea: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: theme.spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  slideFirst: {
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.lg,
  },
  slideSpacer: {
    height: 24,
  },
  illustrationWrap: {
    alignItems: "center",
    width: "100%",
  },
  photoCard: {
    width: SCREEN_WIDTH - 48,
    height: 196,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  photoCardBg: {
    flex: 1,
    justifyContent: "flex-end",
  },
  photoCardImage: {
    borderRadius: theme.borderRadius.xl,
  },
  photoCardScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 22, 40, 0.55)",
  },
  photoCardContent: {
    padding: theme.spacing.md,
  },
  mockCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.teal,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    color: Colors.teal,
  },
  searchQuery: {
    flex: 1,
    fontSize: 12,
    color: Colors.textWhite,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: 6,
  },
  resultRowMuted: {
    opacity: 0.72,
  },
  resultCover: {
    width: 28,
    height: 38,
    borderRadius: 4,
  },
  resultMeta: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textWhite,
  },
  resultSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  resultBadge: {
    backgroundColor: Colors.teal,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  resultBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.tealDark,
  },
  reserveBookRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  reserveCover: {
    backgroundColor: "#639922",
  },
  reserveStatus: {
    fontSize: 10,
    color: Colors.teal,
  },
  reserveTimeline: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF9F27",
  },
  timelineText: {
    flex: 1,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  reserveButton: {
    backgroundColor: Colors.teal,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  reserveButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.tealDark,
  },
  slideHeading: {
    fontSize: 22,
    fontWeight: "500",
    color: Colors.textWhite,
    textAlign: "center",
    lineHeight: 30,
    paddingHorizontal: theme.spacing.sm,
  },
  slideBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: theme.spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dotInactive,
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: Colors.teal,
  },
  ctaArea: {
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: theme.spacing.huge,
    gap: 10,
  },
  btnPrimary: {
    height: 50,
    backgroundColor: Colors.teal,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.tealDark,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.borderDefault,
  },
  dividerText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  btnGhost: {
    height: 46,
    borderWidth: 0.5,
    borderColor: Colors.borderStrong,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhostText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
