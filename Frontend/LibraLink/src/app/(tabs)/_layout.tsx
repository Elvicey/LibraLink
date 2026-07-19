import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../constants/theme";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              {focused && <View style={[styles.activeIndicatorLine, { backgroundColor: colors.primary }]} />}
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={color}
                style={{ marginTop: focused ? 6 : 4 }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              {focused && <View style={[styles.activeIndicatorLine, { backgroundColor: colors.primary }]} />}
              <Ionicons
                name={focused ? "search" : "search-outline"}
                size={22}
                color={color}
                style={{ marginTop: focused ? 6 : 4 }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="borrowed"
        options={{
          title: "Loans",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              {focused && <View style={[styles.activeIndicatorLine, { backgroundColor: colors.primary }]} />}
              <Ionicons
                name={focused ? "book" : "book-outline"}
                size={22}
                color={color}
                style={{ marginTop: focused ? 6 : 4 }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              {focused && <View style={[styles.activeIndicatorLine, { backgroundColor: colors.primary }]} />}
              <Ionicons
                name={focused ? "sparkles" : "sparkles-outline"}
                size={22}
                color={color}
                style={{ marginTop: focused ? 6 : 4 }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              {focused && <View style={[styles.activeIndicatorLine, { backgroundColor: colors.primary }]} />}
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={22}
                color={color}
                style={{ marginTop: focused ? 6 : 4 }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: 60,
    position: "relative",
  },
  activeIndicatorLine: {
    position: "absolute",
    top: -6, // Align line at the top boundary of the tab bar
    width: 28,
    height: 3,
    borderRadius: 1.5,
  },
});
