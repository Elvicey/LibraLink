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
import { BrandLogo } from "../components/common/BrandLogo";
import { loginColors as Colors, loginRadius as Radius } from "../constants/loginTheme";
import { theme } from "../constants/theme";
import { authService } from "../services/auth";

const MIN_PASSWORD_LENGTH = 6;

function LockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="11" width="18" height="11" rx="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [newError, setNewError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [currentFocused, setCurrentFocused] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const showConfirmField = newPassword.length > 0;

  const clearBanners = () => {
    setBannerError(null);
    setBannerSuccess(null);
  };

  const handleSubmit = async () => {
    let hasError = false;
    setCurrentError(null);
    setNewError(null);
    setConfirmError(null);
    clearBanners();

    if (!currentPassword.trim()) {
      setCurrentError("Enter your current password.");
      hasError = true;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setNewError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      hasError = true;
    }
    if (showConfirmField && confirmPassword !== newPassword) {
      setConfirmError("Passwords do not match.");
      hasError = true;
    }
    if (!showConfirmField) {
      setNewError("Enter a new password.");
      hasError = true;
    }
    if (hasError) {
      setBannerError("Please resolve the errors highlighted below.");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      setSucceeded(true);
      setBannerSuccess(result.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password.";
      setBannerError(message);
      if (/current password/i.test(message)) {
        setCurrentError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

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
              onPress={() => router.back()}
              style={styles.backRow}
              disabled={loading}
            >
              <Text style={styles.backText}>← Back to profile</Text>
            </TouchableOpacity>

            <Text style={styles.heading}>
              {succeeded ? "Password updated" : "Change password"}
            </Text>
            <Text style={styles.subheading}>
              {succeeded
                ? "Your password has been changed. You can continue using the app with your new credentials."
                : "Enter your current password, then choose a new one."}
            </Text>

            {bannerError ? (
              <View style={styles.bannerToast}>
                <ErrorIcon />
                <Text style={styles.bannerToastText}>{bannerError}</Text>
              </View>
            ) : null}

            {bannerSuccess ? (
              <View style={styles.successToast}>
                <CheckIcon />
                <Text style={styles.successToastText}>{bannerSuccess}</Text>
              </View>
            ) : null}

            {succeeded ? (
              <>
                <View style={styles.successBadge}>
                  <CheckIcon />
                </View>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => router.back()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnPrimaryText}>Back to profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Current password</Text>
                    <View
                      style={[
                        styles.inputWrap,
                        { borderColor: getBorderStyle(!!currentError, currentFocused) },
                      ]}
                    >
                      <LockIcon />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter current password"
                        placeholderTextColor={Colors.textPlaceholder}
                        value={currentPassword}
                        onChangeText={(value) => {
                          setCurrentPassword(value);
                          setCurrentError(null);
                          clearBanners();
                        }}
                        onFocus={() => setCurrentFocused(true)}
                        onBlur={() => setCurrentFocused(false)}
                        secureTextEntry={!showCurrent}
                        editable={!loading}
                        returnKeyType="next"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {currentError ? <ErrorIcon /> : null}
                      <TouchableOpacity
                        onPress={() => setShowCurrent(!showCurrent)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <EyeIcon visible={showCurrent} />
                      </TouchableOpacity>
                    </View>
                    {currentError ? <Text style={styles.fieldError}>{currentError}</Text> : null}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>New password</Text>
                    <View
                      style={[
                        styles.inputWrap,
                        { borderColor: getBorderStyle(!!newError, newFocused) },
                      ]}
                    >
                      <LockIcon />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter new password"
                        placeholderTextColor={Colors.textPlaceholder}
                        value={newPassword}
                        onChangeText={(value) => {
                          setNewPassword(value);
                          setNewError(null);
                          if (!value) setConfirmPassword("");
                          clearBanners();
                        }}
                        onFocus={() => setNewFocused(true)}
                        onBlur={() => setNewFocused(false)}
                        secureTextEntry={!showNew}
                        editable={!loading}
                        returnKeyType={showConfirmField ? "next" : "done"}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {newError ? <ErrorIcon /> : null}
                      <TouchableOpacity
                        onPress={() => setShowNew(!showNew)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <EyeIcon visible={showNew} />
                      </TouchableOpacity>
                    </View>
                    {newError ? <Text style={styles.fieldError}>{newError}</Text> : null}
                  </View>

                  {showConfirmField ? (
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Confirm password</Text>
                      <View
                        style={[
                          styles.inputWrap,
                          { borderColor: getBorderStyle(!!confirmError, confirmFocused) },
                        ]}
                      >
                        <LockIcon />
                        <TextInput
                          style={styles.input}
                          placeholder="Confirm new password"
                          placeholderTextColor={Colors.textPlaceholder}
                          value={confirmPassword}
                          onChangeText={(value) => {
                            setConfirmPassword(value);
                            setConfirmError(null);
                            clearBanners();
                          }}
                          onFocus={() => setConfirmFocused(true)}
                          onBlur={() => setConfirmFocused(false)}
                          secureTextEntry={!showConfirm}
                          editable={!loading}
                          returnKeyType="done"
                          onSubmitEditing={handleSubmit}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        {confirmError ? <ErrorIcon /> : null}
                        <TouchableOpacity
                          onPress={() => setShowConfirm(!showConfirm)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <EyeIcon visible={showConfirm} />
                        </TouchableOpacity>
                      </View>
                      {confirmError ? (
                        <Text style={styles.fieldError}>{confirmError}</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[styles.btnPrimary, loading && styles.btnPrimaryLoading]}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={styles.btnPrimaryText}>
                    {loading ? "Updating..." : "Change password"}
                  </Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: "rgba(93, 202, 165, 0.12)",
    borderWidth: 0.5,
    borderColor: Colors.tealBorder,
  },
  successToastText: {
    flex: 1,
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
