import { useRouter } from "expo-router";
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
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthLibraryBackground } from "../components/auth/AuthLibraryBackground";
import { BrandLogo } from "../components/common/BrandLogo";
import { loginColors as Colors, loginRadius as Radius } from "../constants/loginTheme";
import { theme } from "../constants/theme";
import { authService } from "../services/auth";

const MIN_PASSWORD_LENGTH = 6;
const CODE_LENGTH = 6;

type Step = "email" | "code" | "password" | "success";

function EmailIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="M22 7 13.03 12.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="11" width="18" height="11" rx="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

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

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {visible ? (
        <>
          <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <Circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <Path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <Line x1="2" y1="2" x2="22" y2="22" />
        </>
      )}
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

function CheckIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={Colors.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

function getBorderStyle(hasError: boolean, isFocused: boolean): string {
  if (hasError) return Colors.borderError;
  if (isFocused) return Colors.borderFocused;
  return Colors.borderDefault;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const clearErrors = () => setBannerError(null);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(null);
    clearErrors();
  };

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setCodeError(null);
    clearErrors();
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setNewPasswordError(null);
    clearErrors();
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setConfirmPasswordError(null);
    clearErrors();
  };

  const handleRequestCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email is required.");
      setBannerError("Please enter your account email.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError("Enter a valid email address.");
      setBannerError("Please resolve the errors highlighted below.");
      return;
    }

    setLoading(true);
    clearErrors();
    try {
      await authService.forgotPassword(trimmed);
      setStep("code");
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== CODE_LENGTH) {
      setCodeError("Enter the 6-digit code from your email.");
      setBannerError("Please resolve the errors highlighted below.");
      return;
    }

    setLoading(true);
    clearErrors();
    try {
      await authService.verifyResetCode(email.trim(), code);
      setStep("password");
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    let hasError = false;

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setNewPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      hasError = true;
    }
    if (confirmPassword !== newPassword) {
      setConfirmPasswordError("Passwords do not match.");
      hasError = true;
    }
    if (hasError) {
      setBannerError("Please resolve the errors highlighted below.");
      return;
    }

    setLoading(true);
    clearErrors();
    try {
      await authService.resetPassword(email.trim(), code, newPassword);
      setStep("success");
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    step === "email"
      ? "Reset password"
      : step === "code"
        ? "Enter verification code"
        : step === "password"
          ? "Choose a new password"
          : "Password updated";

  const stepSubtitle =
    step === "email"
      ? "Enter the email linked to your LibraLink account and we'll send a 6-digit code."
      : step === "code"
        ? `We sent a code to ${email.trim()}. Enter it below to continue.`
        : step === "password"
          ? "Create a new password for your account."
          : "Your password has been reset. You can now sign in with your new password.";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <AuthLibraryBackground />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topAccent} />
            <BrandLogo variant="iconWithLabel" size="auth" style={styles.logoWrap} />

            <TouchableOpacity
              onPress={() => (step === "email" ? router.back() : setStep("email"))}
              style={styles.backRow}
              disabled={loading || step === "success"}
            >
              <Text style={styles.backText}>
                {step === "email" ? "← Back to sign in" : "← Change email"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.heading}>{stepTitle}</Text>
            <Text style={styles.subheading}>{stepSubtitle}</Text>

            {__DEV__ && step === "code" && (
              <Text style={styles.devNote}>
                Dev tip: if email is not configured, check the backend server logs for the 6-digit code.
              </Text>
            )}

            {bannerError && (
              <View style={styles.bannerToast}>
                <ErrorIcon />
                <Text style={styles.bannerToastText}>{bannerError}</Text>
              </View>
            )}

            {step === "email" && (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!emailError, emailFocused) }]}>
                    <EmailIcon />
                    <TextInput
                      style={styles.input}
                      placeholder="you@university.edu.gh"
                      placeholderTextColor={Colors.textPlaceholder}
                      value={email}
                      onChangeText={handleEmailChange}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      returnKeyType="done"
                      onSubmitEditing={handleRequestCode}
                    />
                    {emailError ? <ErrorIcon /> : null}
                  </View>
                  {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
                </View>

                <TouchableOpacity
                  style={[styles.btnPrimary, loading && styles.btnPrimaryLoading]}
                  onPress={handleRequestCode}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={styles.btnPrimaryText}>
                    {loading ? "Sending code..." : "Send verification code"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === "code" && (
              <>
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
                      onSubmitEditing={handleVerifyCode}
                    />
                    {codeError ? <ErrorIcon /> : null}
                  </View>
                  {codeError ? <Text style={styles.fieldError}>{codeError}</Text> : null}
                </View>

                <TouchableOpacity
                  style={[styles.btnPrimary, loading && styles.btnPrimaryLoading]}
                  onPress={handleVerifyCode}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={styles.btnPrimaryText}>
                    {loading ? "Verifying..." : "Verify code"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  <Text style={styles.linkText}>Resend code</Text>
                </TouchableOpacity>
              </>
            )}

            {step === "password" && (
              <>
                <View style={styles.fieldGroup}>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>New password</Text>
                    <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!newPasswordError, newPasswordFocused) }]}>
                      <LockIcon />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter new password"
                        placeholderTextColor={Colors.textPlaceholder}
                        value={newPassword}
                        onChangeText={handleNewPasswordChange}
                        onFocus={() => setNewPasswordFocused(true)}
                        onBlur={() => setNewPasswordFocused(false)}
                        secureTextEntry={!showNewPassword}
                        editable={!loading}
                        returnKeyType="next"
                      />
                      {newPasswordError ? <ErrorIcon /> : null}
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <EyeIcon visible={showNewPassword} />
                      </TouchableOpacity>
                    </View>
                    {newPasswordError ? <Text style={styles.fieldError}>{newPasswordError}</Text> : null}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Confirm password</Text>
                    <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!confirmPasswordError, confirmPasswordFocused) }]}>
                      <LockIcon />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm new password"
                        placeholderTextColor={Colors.textPlaceholder}
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        onFocus={() => setConfirmPasswordFocused(true)}
                        onBlur={() => setConfirmPasswordFocused(false)}
                        secureTextEntry={!showConfirmPassword}
                        editable={!loading}
                        returnKeyType="done"
                        onSubmitEditing={handleResetPassword}
                      />
                      {confirmPasswordError ? <ErrorIcon /> : null}
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <EyeIcon visible={showConfirmPassword} />
                      </TouchableOpacity>
                    </View>
                    {confirmPasswordError ? <Text style={styles.fieldError}>{confirmPasswordError}</Text> : null}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btnPrimary, loading && styles.btnPrimaryLoading]}
                  onPress={handleResetPassword}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={styles.btnPrimaryText}>
                    {loading ? "Updating..." : "Reset password"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === "success" && (
              <>
                <View style={styles.successBadge}>
                  <CheckIcon />
                </View>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => router.replace("/signin" as any)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnPrimaryText}>Back to sign in</Text>
                </TouchableOpacity>
              </>
            )}
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
  backRow: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 13,
    color: Colors.teal,
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
  fieldGroup: {
    gap: 12,
    marginBottom: 8,
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
  fieldError: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.error,
    marginTop: 2,
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(93, 202, 165, 0.12)",
    borderWidth: 0.5,
    borderColor: Colors.tealBorder,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 24,
  },
});
