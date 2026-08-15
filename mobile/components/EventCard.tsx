// @ts-nocheck
import React from 'react';
import { View, Text, Image, TouchableOpacity, Share, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * EventCard
 * Card used in the "Upcoming Events" list on the Event screen.
 *
 * props:
 *  - event: { id, title, dateLabel, location, image, trending, favorite, joined }
 *  - onPress: (event) => void          // e.g. navigate to detail
 *  - onToggleFavorite: (event) => void
 *  - onToggleJoin: (event) => void
 */
export default function EventCard({ event, onPress, onToggleFavorite, onToggleJoin }) {
  const shareEvent = () => {
    Share.share({
      message: `${event.title} — ${event.dateLabel} @ ${event.location}`,
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress?.(event)}
    >
      <View style={styles.imageWrapper}>
        <Image source={event.image} style={styles.image} />

        {event.trending && (
          <View style={styles.trendingBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.trendingText}>Trending</Text>
          </View>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.title}>{event.title}</Text>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => onToggleFavorite?.(event)}
        >
          <Ionicons
            name={event.favorite ? 'heart' : 'heart-outline'}
            size={22}
            color={event.favorite ? '#E63946' : '#333'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={14} color="#666" />
        <Text style={styles.metaText}>{event.dateLabel}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={14} color="#666" />
        <Text style={styles.metaText}>{event.location}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.joinButton, event.joined && styles.joinButtonActive]}
          onPress={() => onToggleJoin?.(event)}
        >
          <Text style={styles.joinButtonText}>
            {event.joined ? 'Joined' : 'Join Event'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={shareEvent}>
          <Ionicons name="share-social-outline" size={18} color="#333" />
        </TouchableOpacity>
      </View>
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
  trendingBadge: {
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
  trendingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#E86A33',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinButtonActive: {
    backgroundColor: '#C9C9C9',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F0EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
