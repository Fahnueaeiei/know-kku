// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChecklistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.note}>
        Checklist screen not built yet — send a design/screenshot to build it out
        like Place and Event.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  note: { fontSize: 13, color: '#888', lineHeight: 20, marginTop: 12 },
});