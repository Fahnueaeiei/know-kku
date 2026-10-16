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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFE8E4',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  imageWrapper: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3E9E1',
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
    backgroundColor: '#E8692B',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#EFE8E4',
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A4644',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  tagPill: {
    backgroundColor: '#F7D6E4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#75445B',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#8E8985',
    lineHeight: 18,
  },
});
