// @ts-nocheck
// Placeholder — no screenshot/design for Event Detail yet.
// Wire this up to data/events.js the same way app/place/[id].tsx uses data/places.ts
// once the design is ready.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await fetch(`http://172.20.10.2:3000/events/${id}`);
        if (!response.ok) throw new Error('Failed to fetch event');
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadEvent();
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
      </TouchableOpacity>

      {loading ? (
        <Text style={styles.note}>Loading event...</Text>
      ) : error ? (
        <Text style={styles.note}>Unable to load event.</Text>
      ) : event ? (
        <>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.meta}>{event.category}</Text>
          <Text style={styles.note}>{event.description}</Text>
          <Text style={styles.info}>📍 {event.location}</Text>
          <Text style={styles.info}>
            📅 {new Date(event.eventDate).toLocaleDateString()}
          </Text>
          <Text style={styles.info}>👥 Capacity: {event.capacity}</Text>
        </>
      ) : (
        <Text style={styles.note}>Event not found.</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5F2', padding: 20 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  meta: { fontSize: 13, color: '#E86A33', fontWeight: '600', marginBottom: 12 },
  info: { fontSize: 14, color: '#555', marginTop: 12 },
  note: { fontSize: 13, color: '#888', lineHeight: 20 },
});

