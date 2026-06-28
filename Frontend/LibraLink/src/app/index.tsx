import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace("./onboarding");
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LibraLink — Redirecting to onboarding…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
});
