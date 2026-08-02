import { Tabs } from "expo-router";
import { Text } from "react-native";

const iconStyle = {
  fontSize: 20,
  marginBottom: 4,
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0b6efd",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
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
