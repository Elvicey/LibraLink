import { Redirect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return <Redirect href="/onboarding" />;
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
