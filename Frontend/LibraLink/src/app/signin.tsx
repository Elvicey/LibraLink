import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>
        Sign in to access your library account
      </Text>
      <TextInput
        placeholder="you@knust.edu.gh"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.linkButton} onPress={() => {}}>
        <Text style={styles.linkText}>Forgot password?</Text>
      </Pressable>
      <Pressable
        style={styles.submitButton}
        onPress={() => router.replace("/home" as any)}
      >
        <Text style={styles.submitText}>Sign in</Text>
      </Pressable>
      <View style={styles.socialRow}>
        <Pressable style={styles.socialButton}>
          <Text style={styles.socialText}>Google</Text>
        </Pressable>
        <Pressable style={styles.socialButton}>
          <Text style={styles.socialText}>Student ID</Text>
        </Pressable>
      </View>
      <Pressable
        style={styles.bottomLink}
        onPress={() => router.push("/signup" as any)}
      >
        <Text style={styles.bottomText}>
          No account? <Text style={styles.bottomLinkText}>Sign up</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#666", marginBottom: 24, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  linkButton: { alignSelf: "flex-end", marginBottom: 24 },
  linkText: { color: "#0b6efd", fontWeight: "600" },
  submitButton: {
    backgroundColor: "#0b6efd",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  submitText: { color: "white", fontWeight: "700", fontSize: 16 },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  socialText: { fontWeight: "600" },
  bottomLink: { alignSelf: "center" },
  bottomText: { color: "#555" },
  bottomLinkText: { color: "#0b6efd", fontWeight: "700" },
});
