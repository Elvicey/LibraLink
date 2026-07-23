import { Stack } from "expo-router";
import { ThemeProvider } from "../constants/theme";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="role-select" />
          <Stack.Screen name="signin" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="lecturer-signin" />
          <Stack.Screen name="lecturer-signup" />
          <Stack.Screen name="lecturer/index" />
          <Stack.Screen name="lecturer/[courseId]" />
          <Stack.Screen name="librarian-signin" />
          <Stack.Screen name="librarian-signup" />
          <Stack.Screen name="admin-signin" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="search" />
          <Stack.Screen name="ai" />
          <Stack.Screen name="borrowed" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
