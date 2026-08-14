// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import EventCard from '../components/EventCard';

export default function EventScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Events');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('http://172.20.10.2:3000/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesCategory = activeCategory === 'All Events' || e.category === activeCategory;
      const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [events, activeCategory, search]);

  const toggleFavorite = (event) => {
    setEvents((prev) =>
      prev.map((e) => (e.eventId === event.eventId ? { ...e, favorite: !e.favorite } : e))
    );
  };

  const toggleJoin = (event) => {
    setEvents((prev) =>
      prev.map((e) => (e.eventId === event.eventId ? { ...e, joined: !e.joined } : e))
    );
  };

  const goToDetail = (event) => {
    router.push(`/event/${event.eventId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.categoriesRow}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Ionicons name="heart" size={20} color="#E63946" />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['All Events', ...Array.from(new Set(events.map((event) => event.category).filter(Boolean)))]}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.chipsList}
        renderItem={({ item }) => {
          const active = item === activeCategory;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.upcomingRow}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {loading && <Text style={styles.emptyText}>Loading events...</Text>}

      <FlatList
        data={loading ? [] : filteredEvents}
        keyExtractor={(item) => String(item.eventId)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={goToDetail}
            onToggleFavorite={toggleFavorite}
            onToggleJoin={toggleJoin}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No events found.</Text>}
        ListFooterComponent={
          <View style={styles.calendarCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.calendarTitle}>Event Calendar</Text>
              <Text style={styles.calendarSubtitle}>
                See what's happening this month at a glance.
              </Text>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => router.push('/event/calendar')}
              >
                <Text style={styles.calendarButtonText}>Open Calendar</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <Ionicons name="calendar" size={64} color="#EDEAE5" style={styles.calendarIcon} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  categoriesRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  chipsList: { gap: 10, paddingBottom: 20 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#EDEAE5', marginRight: 10,
  },
  chipActive: { backgroundColor: '#E86A33' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTextActive: { color: '#fff' },
  upcomingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  viewAll: { fontSize: 13, fontWeight: '600', color: '#E86A33' },
  list: { paddingBottom: 20 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
  calendarCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginTop: 4, marginBottom: 12, overflow: 'hidden',
  },
  calendarTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  calendarSubtitle: { fontSize: 12, color: '#888', marginBottom: 12, maxWidth: 180 },
  calendarButton: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, gap: 6,
  },
  calendarButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  calendarIcon: { marginLeft: 8 },
});