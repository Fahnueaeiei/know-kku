// @ts-nocheck
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * PlaceCard
 * Card used in the "Nearest to You" list on the Place screen.
 *
 * props:
 *  - place: { id, name, description, image, distance, popular, favorite }
 *  - onPress: (place) => void        // navigate to detail
 *  - onToggleFavorite: (place) => void
 */
export default function PlaceCard({ place, onPress, onToggleFavorite }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress?.(place)}
    >
      <View style={styles.imageWrapper}>
        <Image source={place.image} style={styles.image} />

        {place.popular && (
          <View style={styles.popularBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}

        <View style={styles.distanceBadge}>
          <Ionicons name="location-sharp" size={12} color="#E86A33" />
          <Text style={styles.distanceText}>{place.distance} away</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{place.name}</Text>
          {!place.tags && (
            <Text style={styles.description} numberOfLines={1}>
              {place.description}
            </Text>
          )}
        </View>

        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => onToggleFavorite?.(place)}
        >
          <Ionicons
            name={place.favorite ? 'heart' : 'heart-outline'}
            size={22}
            color={place.favorite ? '#E63946' : '#333'}
          />
        </TouchableOpacity>
      </View>

      {place.tags && (
        <View style={styles.tagsRow}>
          {place.tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  imageWrapper: {
    width: '100%',
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  popularBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E86A33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 3,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  tagPill: {
    backgroundColor: '#EAF2FB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3D7BC2',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#888',
  },
});
