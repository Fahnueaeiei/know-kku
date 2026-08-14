// @ts-nocheck
// Placeholder — Profile screen has no design/code yet in the chats provided.
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNav from '../components/BottomNav';

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color="#999" />
        </View>
        <Text style={styles.name}>Profile</Text>
        <Text style={styles.note}>
          Profile screen not built yet — send a design/screenshot to build it out
          like Place and Event.
        </Text>
      </View>
      <BottomNav activeTab="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5F2' },
  container: { flex: 1, paddingHorizontal: 20, alignItems: 'center', paddingTop: 20 },
  backButton: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EDEAE5', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E86A33' },
  name: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginTop: 12 },
  note: { fontSize: 13, color: '#888', lineHeight: 20, marginTop: 12, textAlign: 'center' },
});
