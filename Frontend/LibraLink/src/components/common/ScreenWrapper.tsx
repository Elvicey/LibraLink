import React from "react";
import { ScrollView, StatusBar, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../constants/theme";

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  statusBarColor?: string;
  statusBarStyle?: "light-content" | "dark-content" | "default";
}

export default function ScreenWrapper({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  statusBarColor,
  statusBarStyle,
}: ScreenWrapperProps) {
  const { colors, isDark } = useTheme();
  
  const activeBg = statusBarColor || colors.background;
  const activeStatusStyle = statusBarStyle || (isDark ? "light-content" : "dark-content");
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: activeBg }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar backgroundColor={activeBg} barStyle={activeStatusStyle} />
      <Container
        style={[styles.container, { backgroundColor: colors.background }, style]}
        contentContainerStyle={
          scrollable
            ? [styles.scrollContent, contentContainerStyle]
            : undefined
        }
        keyboardShouldPersistTaps={scrollable ? "handled" : undefined}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
