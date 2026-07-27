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
          <Stack.Screen name="librarian-signin" />
          <Stack.Screen name="librarian-signup" />
          <Stack.Screen name="admin-signin" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
