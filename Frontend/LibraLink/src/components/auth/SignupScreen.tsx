import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { loginColors as Colors, loginRadius as Radius } from "../../constants/loginTheme";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/auth";
import { coursesService, Institution } from "../../services/courses";

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

function UserIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
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

export default function SignupScreen() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [studentIdError, setStudentIdError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [institutionError, setInstitutionError] = useState<string | null>(null);
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [studentIdFocused, setStudentIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    coursesService
      .getInstitutions()
      .then((list) => {
        setInstitutions(list);
        if (list[0]?.institutionId != null) {
          setInstitutionId(list[0].institutionId);
        }
      })
      .catch(() => {});
  }, []);

  const clearAllErrors = () => {
    setBannerError(null);
    setFirstNameError(null);
    setLastNameError(null);
    setEmailError(null);
    setStudentIdError(null);
    setPasswordError(null);
    setInstitutionError(null);
  };

  const handleSignUp = async () => {
    clearAllErrors();

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanStudentId = studentId.trim();
    let hasError = false;

    if (!cleanFirst) {
      setFirstNameError("Enter your first name.");
      hasError = true;
    }
    if (!cleanLast) {
      setLastNameError("Enter your last name.");
      hasError = true;
    }
    if (!cleanEmail) {
      setEmailError("Enter your email.");
      hasError = true;
    }
    if (!cleanStudentId) {
      setStudentIdError("Enter your student ID.");
      hasError = true;
    } else if (!/^\d{8}$/.test(cleanStudentId)) {
      setStudentIdError("Student ID must be 8 digits.");
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError("Enter a password.");
      hasError = true;
    }
    if (institutionId == null) {
      setInstitutionError("Select your institution.");
      hasError = true;
    }

    if (hasError) {
      setBannerError("Please resolve the errors highlighted below.");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.register({
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        passwordHash: password,
        institutionId: institutionId!,
        studentId: cleanStudentId,
      });

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
    } catch (e: any) {
      setBannerError(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topAccent} />

            <BrandLogo variant="iconWithLabel" size="auth" style={styles.logoWrap} />

            <Text style={styles.heading}>Create an account</Text>
            <Text style={styles.subheading}>
              Register your student profile to start borrowing books
            </Text>

            {bannerError && (
              <View style={styles.bannerToast}>
                <ErrorIcon />
                <Text style={styles.bannerToastText}>{bannerError}</Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <View style={styles.nameRow}>
                <View style={[styles.field, styles.nameField]}>
                  <Text style={styles.fieldLabel}>First name</Text>
                  <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!firstNameError, firstNameFocused) }]}>
                    <UserIcon />
                    <TextInput
                      style={styles.input}
                      placeholder="Esther"
                      placeholderTextColor={Colors.textPlaceholder}
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text);
                        if (firstNameError) setFirstNameError(null);
                        if (bannerError) setBannerError(null);
                      }}
                      onFocus={() => setFirstNameFocused(true)}
                      onBlur={() => setFirstNameFocused(false)}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                    {firstNameError ? <ErrorIcon /> : null}
                  </View>
                  {firstNameError ? <Text style={styles.fieldError}>{firstNameError}</Text> : null}
                </View>

                <View style={[styles.field, styles.nameField]}>
                  <Text style={styles.fieldLabel}>Last name</Text>
                  <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!lastNameError, lastNameFocused) }]}>
                    <UserIcon />
                    <TextInput
                      style={styles.input}
                      placeholder="Asamoah"
                      placeholderTextColor={Colors.textPlaceholder}
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text);
                        if (lastNameError) setLastNameError(null);
                        if (bannerError) setBannerError(null);
                      }}
                      onFocus={() => setLastNameFocused(true)}
                      onBlur={() => setLastNameFocused(false)}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                    {lastNameError ? <ErrorIcon /> : null}
                  </View>
                  {lastNameError ? <Text style={styles.fieldError}>{lastNameError}</Text> : null}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!emailError, emailFocused) }]}>
                  <EmailIcon />
                  <TextInput
                    style={styles.input}
                    placeholder="student@university.edu.gh"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError(null);
                      if (bannerError) setBannerError(null);
                    }}
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

              {institutions.length > 0 && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Institution</Text>
                  <View style={styles.institutionRow}>
                    {institutions.map((inst) => {
                      const active = inst.institutionId === institutionId;
                      return (
                        <Pressable
                          key={inst.institutionId}
                          onPress={() => {
                            setInstitutionId(inst.institutionId);
                            if (institutionError) setInstitutionError(null);
                            if (bannerError) setBannerError(null);
                          }}
                          style={[styles.institutionChip, active && styles.institutionChipActive]}
                        >
                          <Text style={[styles.institutionChipText, active && styles.institutionChipTextActive]}>
                            {inst.shortName || inst.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {institutionError ? <Text style={styles.fieldError}>{institutionError}</Text> : null}
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Student ID</Text>
                <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!studentIdError, studentIdFocused) }]}>
                  <UserIcon />
                  <TextInput
                    style={styles.input}
                    placeholder="20250001"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={studentId}
                    onChangeText={(text) => {
                      setStudentId(text);
                      if (studentIdError) setStudentIdError(null);
                      if (bannerError) setBannerError(null);
                    }}
                    onFocus={() => setStudentIdFocused(true)}
                    onBlur={() => setStudentIdFocused(false)}
                    keyboardType="number-pad"
                    maxLength={8}
                    returnKeyType="next"
                  />
                  {studentIdError ? <ErrorIcon /> : null}
                </View>
                {studentIdError ? <Text style={styles.fieldError}>{studentIdError}</Text> : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={[styles.inputWrap, { borderColor: getBorderStyle(!!passwordError, passwordFocused) }]}>
                  <LockIcon />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError(null);
                      if (bannerError) setBannerError(null);
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
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
              style={[styles.btnPrimary, loading && styles.btnPrimaryLoading]}
              onPress={handleSignUp}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? "Creating account..." : "Create account"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/signin" as any)}>
                <Text style={styles.footerLink}>Log in</Text>
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
    marginBottom: 24,
  },
  fieldGroup: {
    gap: 12,
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: "row",
    gap: 10,
  },
  nameField: {
    flex: 1,
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
  institutionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  institutionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.borderDefault,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  institutionChipActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  institutionChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  institutionChipTextActive: {
    color: Colors.tealDark,
  },
  btnPrimary: {
    height: 50,
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  btnPrimaryLoading: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.tealDark,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
