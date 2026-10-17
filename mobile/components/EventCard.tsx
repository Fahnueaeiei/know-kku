// @ts-nocheck
import React from 'react';
import { View, Text, Image, TouchableOpacity, Share, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * EventCard
 * Card used in the "Upcoming Events" list on the Event screen.
 *
 * props:
 *  - event: { eventId, title, date, location, imageUrl, sourceUrl, trending, favorite }
 *  - onPress: (event) => void          // e.g. navigate to detail
 *  - onToggleFavorite: (event) => void
 */
export default function EventCard({ event, onPress, onToggleFavorite }) {
  // แชร์ชื่อ + ลิงก์ (แอปแชทส่วนใหญ่จะแสดงพรีวิวจากลิงก์ให้เอง)
  // ถ้าไม่มีลิงก์ แชร์ชื่อและวันที่แทน
  const shareEvent = () => {
    const message = event.sourceUrl
      ? `${event.title}\n${event.sourceUrl}`
      : [event.title, event.date].filter(Boolean).join(' — ');

    Share.share({ message });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress?.(event)}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={event.imageUrl ? { uri: event.imageUrl } : undefined}
          style={styles.image}
          resizeMode="cover"
          onError={(error) =>
            console.warn(
              'Event image failed to load:',
              event.imageUrl,
              error.nativeEvent
            )
          }
        />

        {event.trending && (
          <View style={styles.trendingBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.trendingText}>Trending</Text>
          </View>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.iconActions}>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={shareEvent}
            accessibilityLabel="Share event"
          >
            <Ionicons name="share-social-outline" size={22} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => onToggleFavorite?.(event)}
            accessibilityLabel="Toggle favorite"
          >
            <Ionicons
              name={event.favorite ? 'heart' : 'heart-outline'}
              size={22}
              color={event.favorite ? '#E63946' : '#333'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={14} color="#666" />
        <Text style={styles.metaText}>{event.date}</Text>
      </View>
      <View style={[styles.metaRow, styles.lastMetaRow]}>
        <Ionicons name="location-outline" size={14} color="#666" />
        <Text style={styles.metaText}>{event.location}</Text>
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
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  lastMetaRow: {
    paddingBottom: 14,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
});