import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
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
  edges = ["top", "left", "right"],
}: ScreenWrapperProps) {
  const { colors, isDark } = useTheme();

  const hasNoTopSafe = edges.indexOf("top") === -1;
  const activeBg = hasNoTopSafe ? "transparent" : (statusBarColor || colors.background);
  const activeStatusStyle = statusBarStyle || (isDark ? "light-content" : "dark-content");

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        {scrollable ? (
          <ScrollView
            style={[styles.container, { backgroundColor: colors.background }, style]}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 48 },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.container, { backgroundColor: colors.background }, style]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
