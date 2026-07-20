import { Stack } from "expo-router";
import { ThemeProvider } from "../constants/theme";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
