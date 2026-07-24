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
import { BrandLogo } from "../common/BrandLogo";
import { AuthLibraryBackground } from "./AuthLibraryBackground";
import { loginColors as Colors, loginRadius as Radius } from "../../constants/loginTheme";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/auth";

export type LoginRole = "student" | "librarian" | "admin";

const ROLES: { key: LoginRole; label: string }[] = [
  { key: "student", label: "Student" },
  { key: "librarian", label: "Librarian" },
  { key: "admin", label: "Admin" },
];

const ROLE_HINTS: Record<LoginRole, string> = {
  student: "Log in to your student account",
  librarian: "Login as a librarian",
  admin: "Login as an admin",
};

const EMAIL_LABELS: Record<LoginRole, string> = {
  student: "Email or student ID",
  librarian: "Email",
  admin: "Email",
};

const EMAIL_PLACEHOLDERS: Record<LoginRole, string> = {
  student: "student@university.edu.gh",
  librarian: "librarian@university.edu.gh",
  admin: "admin@libralink.com",
};

const SIGNUP_ROUTES: Partial<Record<LoginRole, string>> = {
  student: "/signup",
};

const SHOW_SIGNUP: Record<LoginRole, boolean> = {
  student: true,
  librarian: false,
  admin: false,
};

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

function getBorderStyle(hasError: boolean, isFocused: boolean): string {
  if (hasError) return Colors.borderError;
  if (isFocused) return Colors.borderFocused;
  return Colors.borderDefault;
}

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

function validateRoleAccess(role: LoginRole, roles: string[]): void {
  switch (role) {
    case "student":
      if (!roles.includes("STUDENT")) {
        throw new Error("This account does not have student privileges.");
      }
      break;
    case "librarian":
      if (!roles.includes("LIBRARIAN")) {
        throw new Error("This account does not have librarian privileges.");
      }
      break;
    case "admin":
      if (!roles.includes("ADMIN")) {
        throw new Error("This account does not have admin privileges.");
      }
      break;
  }
}

function getPostLoginRoute(role: LoginRole): string {
  switch (role) {
    case "librarian":
      return "/librarian";
    case "admin":
      return "/admin";
    default:
      return "/(tabs)/home";
  }
}

function getEmailRequiredMessage(role: LoginRole): string {
  return role === "student" ? "Enter your email or student ID." : "Enter your email.";
}

function getRoleLabel(role: LoginRole): string {
  return ROLES.find((r) => r.key === role)?.label.toLowerCase() ?? role;
}

function getApiLoginErrors(
  role: LoginRole,
  message: string,
): { banner: string; email: string | null; password: string | null } {
  const lower = message.toLowerCase();

  if (lower.includes("privileges") || lower.includes("does not have")) {
    return {
      banner: message,
      email: `This account can't sign in as a ${getRoleLabel(role)}.`,
      password: null,
    };
  }

  return {
    banner: "Invalid credentials. Check your details and try again.",
    email: null,
    password: "Incorrect password. Try again or reset it below.",
  };
}

interface LoginScreenProps {
  initialRole?: LoginRole | null;
}

export default function LoginScreen({ initialRole = null }: LoginScreenProps) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const formVisible = selectedRole !== null;

  const clearAllErrors = () => {
    setBannerError(null);
    setEmailError(null);
    setPasswordError(null);
  };

  const handleRoleSelect = (role: LoginRole) => {
    setSelectedRole(role);
    clearAllErrors();
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
    if (bannerError) setBannerError(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
    if (bannerError) setBannerError(null);
  };

  const handleLogin = async () => {
    setBannerError(null);
    setEmailError(null);
    setPasswordError(null);

    if (!selectedRole) {
      setBannerError("Choose a role to continue.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    let hasError = false;

    if (!cleanEmail) {
      setEmailError(getEmailRequiredMessage(selectedRole));
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError("Enter your password.");
      hasError = true;
    }
    if (hasError) {
      setBannerError("Please resolve the errors highlighted below.");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.login(cleanEmail, password);
      validateRoleAccess(selectedRole, data.roles || []);

      await setSession({
        token: data.token,
        userId: data.userId,
        roles: data.roles,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        institutionId: data.institutionId ?? null,
      });

      router.replace(getPostLoginRoute(selectedRole) as any);
    } catch (e: any) {
      const message = e.message || "Invalid email or password.";
      const errors = getApiLoginErrors(selectedRole, message);
      setBannerError(errors.banner);
      setEmailError(errors.email);
      setPasswordError(errors.password);
    } finally {
      setLoading(false);
    }
  };

  const signupRoute = selectedRole ? SIGNUP_ROUTES[selectedRole] : "/signup";
  const showSignup = selectedRole ? SHOW_SIGNUP[selectedRole] : false;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <AuthLibraryBackground />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topAccent} />

            <BrandLogo variant="iconWithLabel" size="auth" style={styles.logoWrap} />

            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>
              {selectedRole ? ROLE_HINTS[selectedRole] : "Choose a role to continue"}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.roleRow}
              style={[styles.roleScroll, !bannerError && styles.roleScrollSpaced]}
            >
              {ROLES.map((role) => {
                const active = selectedRole === role.key;
                return (
                  <TouchableOpacity
                    key={role.key}
                    style={[styles.roleChip, active && styles.roleChipActive]}
                    onPress={() => handleRoleSelect(role.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {bannerError && (
              <View style={styles.bannerToast}>
                <ErrorIcon />
                <Text style={styles.bannerToastText}>{bannerError}</Text>
              </View>
            )}

            {formVisible && selectedRole && (
              <>
                <View style={styles.fieldGroup}>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>{EMAIL_LABELS[selectedRole]}</Text>
                    <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!emailError, emailFocused) }]}>
                      <EmailIcon />
                      <TextInput
                        style={styles.input}
                        placeholder={EMAIL_PLACEHOLDERS[selectedRole]}
                        placeholderTextColor={Colors.textPlaceholder}
                        value={email}
                        onChangeText={handleEmailChange}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                      />
                      {emailError ? <ErrorIcon /> : null}
                    </View>
                    {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!passwordError, passwordFocused) }]}>
                      <LockIcon />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={Colors.textPlaceholder}
                        value={password}
                        onChangeText={handlePasswordChange}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        secureTextEntry={!showPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                      />
                      {passwordError ? <ErrorIcon /> : null}
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <EyeIcon visible={showPassword} />
                      </TouchableOpacity>
                    </View>
                    {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => router.push("/forgot-password" as any)}
                  style={styles.forgotRow}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnPrimary, loading && styles.btnPrimaryLoading]}
                  onPress={handleLogin}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={styles.btnPrimaryText}>{loading ? "Logging in..." : "Log in"}</Text>
                </TouchableOpacity>

                {showSignup && signupRoute && (
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                    <TouchableOpacity onPress={() => router.push(signupRoute as any)}>
                      <Text style={styles.footerLink}>Create one</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
  roleScroll: {
    flexGrow: 0,
  },
  roleScrollSpaced: {
    marginBottom: 24,
  },
  roleRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.borderDefault,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  roleChipActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  roleChipTextActive: {
    color: Colors.tealDark,
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
  forgotRow: {
    alignItems: "flex-end",
    marginTop: 8,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 12,
    color: Colors.teal,
  },
  btnPrimary: {
    height: 50,
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  btnPrimaryLoading: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.tealDark,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.borderDefault,
  },
  dividerText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  btnGoogle: {
    height: 48,
    borderWidth: 0.5,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  btnGoogleText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto" as any,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footerLink: {
    fontSize: 12,
    color: Colors.teal,
  },
  bannerToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
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
});
