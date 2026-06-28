import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function BookDetail() {
  const params = useLocalSearchParams();
  const { id } = params as { id: string };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Details</Text>
      <Text style={styles.field}>ID: {id}</Text>
      <Text style={styles.field}>Title: Sample Title for {id}</Text>
      <Text style={styles.field}>Author: Unknown</Text>
      <Text style={styles.field}>Availability: Available</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  field: { fontSize: 16, marginBottom: 8 },
});
