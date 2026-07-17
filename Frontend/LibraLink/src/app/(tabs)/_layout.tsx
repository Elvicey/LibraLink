import { Tabs } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "../../constants/theme";

const iconStyle = {
  fontSize: 20,
  marginBottom: 4,
};

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
          tabBarIcon: ({ color }) => (
            <Text style={[iconStyle, { color }]}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => (
            <Text style={[iconStyle, { color }]}>🔍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="borrowed"
        options={{
          title: "Loans",
          tabBarIcon: ({ color }) => (
            <Text style={[iconStyle, { color }]}>📚</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI",
          tabBarIcon: ({ color }) => (
            <Text style={[iconStyle, { color }]}>🤖</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={[iconStyle, { color }]}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
