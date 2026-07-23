import { useState } from "react";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ExploreSheet from "../../components/ExploreSheet";
import { useTheme } from "../../constants/theme";

const PILL_TABS: { name: string; icon: string; iconOutline: string }[] = [
  { name: "reading-lists", icon: "bookmark", iconOutline: "bookmark-outline" },
  { name: "profile", icon: "person", iconOutline: "person-outline" },
];

interface FloatingTabBarProps extends BottomTabBarProps {
  exploreOpen: boolean;
  onExplorePress: () => void;
}

function FloatingTabBar({
  state,
  navigation,
  exploreOpen,
  onExplorePress,
}: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const activeRouteName = state.routes[state.index]?.name;

  const navigateTo = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const homeActive = activeRouteName === "home" && !exploreOpen;

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 12 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Home"
        accessibilityState={{ selected: homeActive }}
        style={[styles.homeCircle, !homeActive && styles.homeCircleInactive]}
        onPress={() => navigateTo("home")}
      >
        <Ionicons
          name={homeActive ? "home" : "home-outline"}
          size={24}
          color={homeActive ? colors.textLight : colors.textMuted}
        />
      </Pressable>

      <View style={styles.pill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Explore"
          accessibilityState={{ selected: exploreOpen }}
          style={[styles.pillItem, exploreOpen && styles.pillItemActive]}
          onPress={onExplorePress}
        >
          <Ionicons
            name={exploreOpen ? "compass" : "compass-outline"}
            size={23}
            color={exploreOpen ? colors.textLight : colors.textMuted}
          />
        </Pressable>

        {PILL_TABS.map((tab) => {
          const focused = activeRouteName === tab.name && !exploreOpen;
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="button"
              accessibilityLabel={tab.name === "reading-lists" ? "Reading list" : "Profile"}
              accessibilityState={{ selected: focused }}
              style={[styles.pillItem, focused && styles.pillItemActive]}
              onPress={() => navigateTo(tab.name)}
            >
              <Ionicons
                name={(focused ? tab.icon : tab.iconOutline) as any}
                size={23}
                color={focused ? colors.textLight : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const [exploreOpen, setExploreOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <FloatingTabBar
            {...props}
            exploreOpen={exploreOpen}
            onExplorePress={() => setExploreOpen(true)}
          />
        )}
      >
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="reading-lists" options={{ title: "Reading list" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>

      <ExploreSheet visible={exploreOpen} onClose={() => setExploreOpen(false)} />
    </>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      position: "absolute",
      left: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    homeCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    homeCircleInactive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
    },
    pill: {
      flex: 1,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
    },
    pillItem: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    pillItemActive: {
      backgroundColor: colors.primary,
    },
  });
