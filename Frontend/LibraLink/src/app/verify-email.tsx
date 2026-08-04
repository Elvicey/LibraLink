import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandLogo } from "../components/common/BrandLogo";
import { loginColors as Colors, loginRadius as Radius } from "../constants/loginTheme";
import { theme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth";

const CODE_LENGTH = 6;

function KeyIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="8" cy="15" r="4" />
      <Path d="M12 15h8" />
      <Path d="M17 15v3" />
      <Path d="M20 15v2" />
      <Path d="M10.5 12.5 15 8" />
    </Svg>
  );
}

function ErrorIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={Colors.error} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="8" x2="12" y2="12" />
      <Line x1="12" y1="16" x2="12.01" y2="16" />
    </Svg>
  );
}

function getBorderStyle(hasError: boolean, isFocused: boolean): string {
  if (hasError) return Colors.borderError;
  if (isFocused) return Colors.borderFocused;
  return Colors.borderDefault;
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = (emailParam || "").trim();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeFocused, setCodeFocused] = useState(false);

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setCodeError(null);
    setBannerError(null);
    setResendMessage(null);
  };

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) {
      setCodeError("Enter the 6-digit code from your email.");
      setBannerError("Please resolve the errors highlighted below.");
      return;
    }

    setLoading(true);
    setBannerError(null);
    try {
      const data = await authService.verifyEmail(email, code);
      await setSession({
        token: data.token,
        userId: data.userId,
        roles: data.roles || [],
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        institutionId: data.institutionId,
      });
      router.replace("/(tabs)/home" as any);
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setBannerError(null);
    setResendMessage(null);
    try {
      await authService.resendVerification(email);
      setResendMessage("A new code has been sent to your email.");
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topAccent} />
            <BrandLogo variant="iconWithLabel" size="auth" style={styles.logoWrap} />

            <Text style={styles.heading}>Verify your email</Text>
            <Text style={styles.subheading}>
              We sent a 6-digit code to {email || "your email"}. Enter it below to finish creating your account.
            </Text>

            {__DEV__ && (
              <Text style={styles.devNote}>
                Dev tip: if email is not configured, check the backend server logs for the code.
              </Text>
            )}

            {bannerError && (
              <View style={styles.bannerToast}>
                <ErrorIcon />
                <Text style={styles.bannerToastText}>{bannerError}</Text>
              </View>
            )}

            {resendMessage && !bannerError && (
              <View style={styles.successToast}>
                <Text style={styles.successToastText}>{resendMessage}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>6-digit code</Text>
              <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!codeError, codeFocused) }]}>
                <KeyIcon />
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="000000"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={code}
                  onChangeText={handleCodeChange}
                  onFocus={() => setCodeFocused(true)}
                  onBlur={() => setCodeFocused(false)}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                />
                {codeError ? <ErrorIcon /> : null}
              </View>
              {codeError ? <Text style={styles.fieldError}>{codeError}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnPrimaryLoading]}
              onPress={handleVerify}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.btnPrimaryText}>{loading ? "Verifying..." : "Verify code"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={handleResend} disabled={resending || loading}>
              <Text style={styles.linkText}>{resending ? "Resending..." : "Resend code"}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.replace("/signin" as any)}>
                <Text style={styles.footerLink}>← Back to sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
  },
  topAccent: {
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.teal,
    alignSelf: "center",
    marginBottom: 28,
  },
  logoWrap: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: "500",
    color: Colors.textWhite,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  devNote: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
    marginBottom: 12,
    fontStyle: "italic",
  },
  field: {
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgInput,
    borderWidth: 0.5,
    borderRadius: Radius.md,
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  codeInput: {
    letterSpacing: 6,
    fontWeight: "600",
  },
  btnPrimary: {
    height: 50,
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  btnPrimaryLoading: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.tealDark,
  },
  linkRow: {
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    fontSize: 12,
    color: Colors.teal,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerLink: {
    fontSize: 12,
    color: Colors.teal,
  },
  bannerToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.errorBg,
    borderWidth: 0.5,
    borderColor: Colors.borderError,
  },
  bannerToastText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.errorLight,
  },
  successToast: {
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: "rgba(93, 202, 165, 0.12)",
    borderWidth: 0.5,
    borderColor: Colors.tealBorder,
  },
  successToastText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.teal,
  },
  fieldError: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.error,
    marginTop: 2,
  },
});
