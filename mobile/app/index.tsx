// @ts-nocheck

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import HeadBar from '../components/HeadBar';
import BottomNav from '../components/BottomNav';


const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/* =========================================================
   DESIGN TOKENS
========================================================= */

const COLORS = {
  orange: '#FA7C35',
  orangeDark: '#E96826',
  orangeLight: '#FFF0E8',

  background: '#FAF7F5',
  white: '#FFFFFF',

  text: '#2A2928',
  textSecondary: '#686360',
  textLight: '#8E8985',

  border: '#EFE8E4',

  wifi: '#E9F7FF',
  bus: '#FFF0E8',
  work: '#F2EEEC',

  blue: '#43A9D9',
  green: '#55A76A',
};

/* =========================================================
   TYPES
========================================================= */

type HomeFact = {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type HomeCard = {
  id: string;
  type: 'wifi' | 'bus' | 'workspace';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

/* =========================================================
   STATIC CARDS
   ---------------------------------------------------------
   ยังไม่มี table รองรับใน schema จึงคงเป็น static ไปก่อน
========================================================= */

const staticCards: HomeCard[] = [
  {
    id: 'wifi',
    type: 'wifi',
    title: 'Free Wi-Fi everywhere on campus',
    description:
      'Connect seamlessly across all faculty buildings using your student account.',
    icon: 'wifi',
  },
  {
    id: 'bus',
    type: 'bus',
    title: 'Shuttle Bus routes simplified',
    description:
      'Live tracking available for all major loops directly in the app map.',
    icon: 'bus',
  },
  {
    id: 'workspace',
    type: 'workspace',
    title: 'Co-working spaces in every faculty',
    description:
      'Discover hidden study spots and quiet places near your current class location.',
    icon: 'cafe',
  },
];

/* =========================================================
   HOME SCREEN
========================================================= */

export default function HomeScreen() {
  const router = useRouter();

  /* =======================================================
     NEWS / FACT STATE (from DB)
  ======================================================= */

  const [facts, setFacts] = useState<HomeFact[]>([]);
  const [factIndex, setFactIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/news`);

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const data = await res.json();

        const mapped: HomeFact[] = data.map((item: any) => ({
          id: String(item.newsId),
          category: item.category ?? 'NEWS',
          title: item.title,
          description: item.description ?? '',
          icon:
            (item.icon as keyof typeof Ionicons.glyphMap) ||
            'bulb-outline',
        }));

        setFacts(mapped);
      } catch (err) {
        console.error('fetchNews error:', err);
        setError('โหลดข่าวสารไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  /* =======================================================
     FLOAT ANIMATION
  ======================================================= */

  const floatAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: -4,
          duration: 1800,
          useNativeDriver: true,
        }),

        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  /* =======================================================
     AUTO CHANGE FACT
  ======================================================= */

  useEffect(() => {
    if (facts.length === 0) return;

    const interval = setInterval(() => {
      setFactIndex((current) => (current + 1) % facts.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [facts]);

  const currentFact = facts[factIndex];

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const handleAvatarPress = () => {
    router.push('/profile');
  };

  const handleSearch = () => {
    /*
      router.push({
        pathname: '/search',
        params: { q: searchText },
      });
    */
  };

  const handleFactPress = () => {
    if (currentFact) {
      // router.push(`/information/${currentFact.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      <View style={styles.screen}>
        {/* HeadBar / BottomNav render จาก root _layout.tsx แล้ว ไม่ต้อง render ซ้ำที่นี่ */}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* =================================================
              SEARCH
          ================================================= */}

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={14} color="#77716D" />

            <TextInput
              style={styles.searchInput}
              placeholder="Search buildings, cafes or loops..."
              placeholderTextColor="#99928E"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />

            <Ionicons
              name="options-outline"
              size={15}
              color={COLORS.textLight}
            />
          </View>

          {/* =================================================
              DID YOU KNOW HERO
          ================================================= */}

          <Animated.View
            style={[
              styles.heroWrapper,
              { transform: [{ translateY: floatAnimation }] },
            ]}
          >
            {loading ? (
              <View style={[styles.heroCard, styles.heroCenter]}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : error ? (
              <View style={[styles.heroCard, styles.heroCenter]}>
                <Text style={styles.heroErrorText}>{error}</Text>
              </View>
            ) : currentFact ? (
              <Pressable
                style={({ pressed }) => [
                  styles.heroCard,
                  pressed && styles.heroPressed,
                ]}
                onPress={handleFactPress}
              >
                {/* DECORATIVE CIRCLES */}
                <View style={styles.decorCircleLarge} />
                <View style={styles.decorCircleSmall} />
                <View style={styles.decorCircleTiny} />

                {/* TOP */}
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIcon}>
                    <Ionicons
                      name={currentFact.icon}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={styles.heroLabelContainer}>
                    <Text style={styles.heroLabel}>DID YOU KNOW?</Text>
                    <Text style={styles.heroCategory}>
                      {currentFact.category}
                    </Text>
                  </View>

                  <View style={styles.heroSparkle}>
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  </View>
                </View>

                {/* TITLE */}
                <Text style={styles.heroTitle} numberOfLines={3}>
                  {currentFact.title}
                </Text>

                {/* DESCRIPTION */}
                <Text style={styles.heroDescription} numberOfLines={3}>
                  {currentFact.description}
                </Text>

                {/* BOTTOM */}
                <View style={styles.heroBottomRow}>
                  <View style={styles.factIndicators}>
                    {facts.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.factDot,
                          index === factIndex && styles.factDotActive,
                        ]}
                      />
                    ))}
                  </View>

                  <View style={styles.heroReadMore}>
                    <Text style={styles.heroReadText}>Explore</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={COLORS.orange}
                    />
                  </View>
                </View>
              </Pressable>
            ) : (
              <View style={[styles.heroCard, styles.heroCenter]}>
                <Text style={styles.heroErrorText}>ยังไม่มีข่าวสาร</Text>
              </View>
            )}
          </Animated.View>

          {/* =================================================
              QUICK ACCESS
          ================================================= */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Quick Access</Text>
              <Text style={styles.sectionSubtitle}>
                Useful information for your campus life
              </Text>
            </View>

            <Ionicons
              name="grid-outline"
              size={17}
              color={COLORS.textLight}
            />
          </View>

          {/* =================================================
              INFORMATION CARDS
          ================================================= */}

          <View style={styles.cardsContainer}>
            {staticCards.map((card) => (
              <InformationCard
                key={card.id}
                card={card}
                onPress={() => {
                  /*
                    switch (card.id) {
                      case 'wifi':
                        router.push(...)
                        break
                      case 'bus':
                        router.push(...)
                        break
                    }
                  */
                }}
              />
            ))}
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   INFORMATION CARD
========================================================= */

function InformationCard({
  card,
  onPress,
}: {
  card: HomeCard;
  onPress?: () => void;
}) {
  const iconBackground =
    card.type === 'wifi'
      ? COLORS.wifi
      : card.type === 'bus'
        ? COLORS.bus
        : COLORS.work;

  const iconColor =
    card.type === 'wifi'
      ? COLORS.blue
      : card.type === 'bus'
        ? COLORS.orange
        : '#77716D';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={styles.infoCard}
    >
      <View
        style={[styles.infoIcon, { backgroundColor: iconBackground }]}
      >
        <Ionicons name={card.icon} size={16} color={iconColor} />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{card.title}</Text>
        <Text style={styles.infoDescription}>{card.description}</Text>
      </View>

      <View style={styles.infoArrow}>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={COLORS.textLight}
        />
      </View>
    </TouchableOpacity>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 20,
  },

  /* SEARCH */

  searchContainer: {
    height: 38,
    width: '100%',
    borderRadius: 19,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#F0EBE8',
    shadowColor: '#AFA7A2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },

  searchInput: {
    flex: 1,
    height: 38,
    marginLeft: 7,
    marginRight: 6,
    paddingVertical: 0,
    fontSize: 9,
    color: COLORS.text,
  },

  /* HERO */

  heroWrapper: {
    width: '100%',
    marginBottom: 16,
  },

  heroCard: {
    width: '100%',
    minHeight: 181,
    borderRadius: 28,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#C85E25',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 5,
  },

  heroCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroErrorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },

  heroPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
  },

  /* DECORATIVE CIRCLES */

  decorCircleLarge: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 73,
    right: -55,
    top: -62,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  decorCircleSmall: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    right: 20,
    bottom: -40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  decorCircleTiny: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    left: -13,
    bottom: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  /* HERO TOP */

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  heroIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  heroLabelContainer: {
    flex: 1,
  },

  heroLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  heroCategory: {
    fontSize: 6.8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  heroSparkle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* HERO TEXT */

  heroTitle: {
    maxWidth: '92%',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 7,
  },

  heroDescription: {
    maxWidth: '90%',
    fontSize: 7.8,
    lineHeight: 11.5,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.90)',
  },

  /* HERO BOTTOM */

  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  factIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  factDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.40)',
  },

  factDotActive: {
    width: 17,
    backgroundColor: '#FFFFFF',
  },

  heroReadMore: {
    height: 27,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  heroReadText: {
    fontSize: 7.8,
    fontWeight: '800',
    color: COLORS.orange,
  },

  /* SECTION HEADER */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.text,
  },

  sectionSubtitle: {
    fontSize: 7.5,
    color: COLORS.textLight,
    marginTop: 2,
  },

  /* INFORMATION CARDS */

  cardsContainer: {
    width: '100%',
    gap: 9,
  },

  infoCard: {
    width: '100%',
    minHeight: 78,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#AFA7A2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  infoContent: {
    flex: 1,
    paddingRight: 6,
  },

  infoTitle: {
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },

  infoDescription: {
    fontSize: 7.5,
    lineHeight: 10.5,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },

  infoArrow: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#F7F3F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* BOTTOM */

  bottomSpace: {
    height: 10,
  },
});
