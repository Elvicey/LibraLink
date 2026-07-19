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
  edges?: Array<"top" | "bottom" | "left" | "right">;
}

export default function ScreenWrapper({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  statusBarColor,
  statusBarStyle,
  edges = ["top", "left", "right"], // default to including top safe area
}: ScreenWrapperProps) {
  const { colors, isDark } = useTheme();
  
  const hasNoTopSafe = edges.indexOf("top") === -1;
  const activeBg = hasNoTopSafe ? "transparent" : (statusBarColor || colors.background);
  const activeStatusStyle = statusBarStyle || (isDark ? "light-content" : "dark-content");
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: hasNoTopSafe ? "transparent" : activeBg }]}
      edges={edges}
    >
      <StatusBar
        translucent={hasNoTopSafe}
        backgroundColor={hasNoTopSafe ? "transparent" : activeBg}
        barStyle={activeStatusStyle}
      />
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
