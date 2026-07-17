import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import { useTheme } from "../../constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: "light" | "glass";
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export default function Input({
  label,
  error,
  variant = "light",
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { colors, spacing, borderRadius } = useTheme();

  const isGlass = variant === "glass";

  // Dynamic colors matching theme
  const labelColor = isGlass ? "rgba(255, 255, 255, 0.9)" : colors.text;
  const inputBg = isGlass ? "rgba(255, 255, 255, 0.06)" : colors.surface;
  const inputBorder = isGlass ? "rgba(255, 255, 255, 0.12)" : colors.border;
  const inputTextColor = isGlass ? colors.textLight : colors.text;
  
  const activeInputBorder = isFocused
    ? colors.primary
    : error
    ? colors.danger
    : inputBorder;

  const activeInputBg = isFocused && isGlass ? "rgba(255, 255, 255, 0.08)" : inputBg;

  return (
    <View style={[styles.container, { marginBottom: spacing.md }, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: labelColor, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.lg,
            borderColor: activeInputBorder,
            backgroundColor: activeInputBg,
            color: inputTextColor,
          },
          inputStyle,
        ]}
        placeholderTextColor={isGlass ? "rgba(255, 255, 255, 0.4)" : colors.textMuted}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error && <Text style={[styles.errorText, { color: colors.danger, marginTop: spacing.xs }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
