import { StyleSheet, Text, View } from "react-native";

export default function Admin() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard (placeholder)</Text>
      <Text>Inventory, circulation, and analytics tools go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
});
