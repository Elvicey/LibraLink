import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
  StyleProp,
  View,
} from "react-native";
import { useTheme } from "../../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  /** Overrides colors.primary for the primary fill, outline border, outline/text text color, and the outline/text loading spinner. Defaults to colors.primary. */
  accentColor?: string;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  accentColor,
}: ButtonProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const accent = accentColor ?? colors.primary;

  const variantStyles = {
    primary: {
      backgroundColor: accent,
    },
    secondary: {
      backgroundColor: colors.secondary,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: accent,
    },
    text: {
      backgroundColor: "transparent",
    },
  };

  const textVariantStyles = {
    primary: {
      color: colors.textLight,
    },
    secondary: {
      color: colors.textLight,
    },
    outline: {
      color: accent,
    },
    text: {
      color: accent,
    },
  };

  const disabledStyle = {
    backgroundColor: colors.border,
    borderColor: colors.border,
  };

  const disabledTextStyle = {
    color: colors.textMuted,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { borderRadius: borderRadius.lg },
        styles[size],
        variantStyles[variant],
        disabled && disabledStyle,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "text"
              ? accent
              : colors.textLight
          }
          size="small"
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: spacing.xs }}>{icon}</View>}
          <Text
            style={[
              styles.baseText,
              styles[`${size}Text`],
              textVariantStyles[variant],
              disabled && disabledTextStyle,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  pressed: {
    opacity: 0.8,
  },
  // Sizes
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  // Texts
  baseText: {
    fontWeight: "700",
    textAlign: "center",
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
});
