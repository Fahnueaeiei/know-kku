// @ts-nocheck
// Ported from screens/PlaceDetailScreen.js — route.params.placeId becomes the
// [id] dynamic segment via useLocalSearchParams, navigation.goBack() -> router.back().
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE_URL = 'http://172.20.10.2:3000';

const SHUTTLE_LINES = [
  { key: 'red', label: 'Red Line', color: '#E53935' },
  { key: 'blue', label: 'Blue Line', color: '#1E88E5' },
  { key: 'green', label: 'Green Line', color: '#43A047' },
  { key: 'yellow', label: 'Yellow Line', color: '#FBC02D' },
];

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [place, setPlace] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadPlace = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/places`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const found = data.find((item) => String(item.placeId) === String(id));
        setPlace(
          found
            ? {
                ...found,
                id: String(found.placeId),
                longDescription: found.description ?? '',
                hours: found.hours ?? 'Open hours unavailable',
                officialEntry: false,
              }
            : null
        );
      } catch (error) {
        console.error('Failed to load place:', error);
        setPlace(null);
      } finally {
        setLoading(false);
      }
    };

    loadPlace();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.notFound}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.notFound}>Place not found.</Text>
      </SafeAreaView>
    );
  }

  const openMaps = () => {
    if (place.latitude != null && place.longitude != null) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
      );
      return;
    }

    if (place.address) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
      );
    }
  };

  const isBuilding = place.category === 'Building';
  const hasReviews = !!place.reviews?.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top header: back button sits above the hero image */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Hero image */}
          <View style={styles.heroWrapper}>
            <View style={styles.heroPlaceholder}>
              <Ionicons name="location" size={40} color="#999" />
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {place.category?.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{place.name}</Text>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="more-vertical" size={18} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={15} color="#666" />
              <Text style={styles.metaText}>{place.hours}</Text>

              {place.officialEntry && (
                <>
                  <Text style={styles.metaDivider}>|</Text>
                  <Ionicons name="checkmark-circle" size={15} color="#E86A33" />
                  <Text style={[styles.metaText, { color: '#E86A33' }]}>
                    Official Entry
                  </Text>
                </>
              )}
            </View>

            <Text style={styles.description}>
              {place.longDescription || 'No description available.'}
            </Text>

            <TouchableOpacity style={styles.mapsButton} onPress={openMaps}>
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.mapsButtonText}>Navigate via Google Maps</Text>
            </TouchableOpacity>
          </View>

          {/* Rating / Avg price stat cards — restaurants & cafes */}
          {(place.rating != null || place.avgPrice) && (
            <View style={styles.statsRow}>
              {place.rating != null && (
                <View style={styles.statCard}>
                  <Ionicons name="star" size={20} color="#3D7BC2" />
                  <Text style={styles.statValue}>{place.rating}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              )}
              {place.avgPrice && (
                <View style={styles.statCard}>
                  <Ionicons name="wallet-outline" size={20} color="#3D7BC2" />
                  <Text style={styles.statValue}>{place.avgPrice}</Text>
                  <Text style={styles.statLabel}>Avg Price</Text>
                </View>
              )}
            </View>
          )}

          {/* Shuttle bus info — buildings only */}
          {isBuilding && (
            <View style={styles.shuttleCard}>
              <View style={styles.shuttleHeader}>
                <Text style={styles.sectionTitle}>Shuttle Bus Info</Text>
                <FontAwesome5 name="bus" size={16} color="#E86A33" />
              </View>

              <View style={styles.shuttleGrid}>
                {SHUTTLE_LINES.map((line) => (
                  <View key={line.key} style={styles.shuttlePill}>
                    <View
                      style={[styles.shuttleDot, { backgroundColor: line.color }]}
                    />
                    <Text style={styles.shuttleLabel}>{line.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Places nearby — buildings only */}
          {isBuilding && place.nearby?.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Places Nearby</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.nearbyRow}>
                {place.nearby.map((item) => (
                  <View key={item.id} style={styles.nearbyCard}>
                    <Image source={item.image} style={styles.nearbyImage} />
                    <View style={styles.nearbyTextWrap}>
                      <Text style={styles.nearbyTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.nearbySubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Community feedback — restaurants & cafes */}
          {hasReviews && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Community Feedback</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.feedbackGrid}>
                {place.reviews.map((review) => (
                  <View
                    key={review.id}
                    style={[styles.reviewCard, { backgroundColor: review.color }]}
                  >
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < review.rating ? 'star' : 'star-outline'}
                          size={11}
                          color="#333"
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewText}>“{review.text}”</Text>
                    <Text style={styles.reviewAuthor}>- {review.author}</Text>
                  </View>
                ))}

                <TouchableOpacity style={styles.addReviewCard}>
                  <View style={styles.addReviewIcon}>
                    <Ionicons name="add" size={20} color="#666" />
                  </View>
                  <Text style={styles.addReviewText}>Add your review</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  notFound: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  heroWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EDEAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  metaDivider: {
    color: '#ccc',
    marginHorizontal: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#555',
    marginBottom: 18,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E86A33',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  mapsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
  },
  shuttleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  shuttleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  shuttleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  shuttlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F5F2',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '47%',
  },
  shuttleDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  shuttleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E86A33',
  },
  nearbyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nearbyCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  nearbyImage: {
    width: '100%',
    height: 90,
  },
  nearbyTextWrap: {
    padding: 10,
  },
  nearbyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  nearbySubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  feedbackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reviewCard: {
    width: '47%',
    borderRadius: 16,
    padding: 14,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 12.5,
    color: '#333',
    lineHeight: 18,
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
    marginTop: 8,
  },
  addReviewCard: {
    width: '47%',
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addReviewIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addReviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});
