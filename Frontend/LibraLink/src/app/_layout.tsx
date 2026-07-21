import { Stack } from "expo-router";
import { ThemeProvider } from "../constants/theme";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="lecturer-signin" />
        <Stack.Screen name="lecturer-signup" />
        <Stack.Screen name="librarian-signin" />
        <Stack.Screen name="librarian-signup" />
        <Stack.Screen name="admin-signin" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </ThemeProvider>
  );
}
