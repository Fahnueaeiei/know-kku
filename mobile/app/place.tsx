// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PlaceCard from '../components/PlaceCard';

export default function PlaceScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('http://172.20.10.2:3000/places');
        if (!response.ok) throw new Error('Failed to fetch places');
        const data = await response.json();
        setPlaces(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load places.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(places.map((p) => p.category).filter(Boolean)))],
    [places]
  );

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = (p.name ?? '').toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [places, activeCategory, search]);

  const toggleFavorite = (place) => {
    setPlaces((prev) =>
      prev.map((p) => (p.placeId === place.placeId ? { ...p, favorite: !p.favorite } : p))
    );
  };

  const goToDetail = (place) => {
    router.push(`/place/${place.placeId}`);
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
        data={categories}
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

      <View style={styles.nearestRow}>
        <Text style={styles.sectionTitle}>Nearest to You</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPlaces}
        keyExtractor={(item) => String(item.placeId)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          loading ? (
            <Text style={styles.emptyText}>Loading places...</Text>
          ) : error ? (
            <Text style={styles.emptyText}>{error}</Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <PlaceCard place={item} onPress={goToDetail} onToggleFavorite={toggleFavorite} />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No places found.</Text>}
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
  nearestRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  viewAll: { fontSize: 13, fontWeight: '600', color: '#E86A33' },
  list: { paddingBottom: 20 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
});