import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an account</Text>
      <Text style={styles.subtitle}>
        Register your student profile to start borrowing books
      </Text>
      <TextInput
        placeholder="Full name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Student email"
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
      <Pressable
        style={styles.submitButton}
        onPress={() => router.replace("/home" as any)}
      >
        <Text style={styles.submitText}>Sign up</Text>
      </Pressable>
      <Pressable
        style={styles.bottomLink}
        onPress={() => router.replace("/signin" as any)}
      >
        <Text style={styles.bottomText}>
          Already have an account?{" "}
          <Text style={styles.bottomLinkText}>Sign in</Text>
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
  submitButton: {
    backgroundColor: "#0b6efd",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  submitText: { color: "white", fontWeight: "700", fontSize: 16 },
  bottomLink: { alignSelf: "center" },
  bottomText: { color: "#555" },
  bottomLinkText: { color: "#0b6efd", fontWeight: "700" },
});
