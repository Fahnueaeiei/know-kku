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
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import ChatbotButton from '../components/ChatbotButton';
import ChatbotSheet from '../components/ChatbotSheet';

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

  blue: '#43A9D9',
  green: '#55A76A',

  reminder: '#FFF7E8',
  reminderIcon: '#F3A72F',

  newsBackground: '#F3EFED',
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
  sourceUrl?: string;
  imageUrl?: string;
};

type ChecklistSummary = {
  todayCount: number;
  overdueCount?: number;
};

type HomeNews = {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  imageUrl?: string;
  sourceUrl?: string;
};

type HomeData = {
  facts: HomeFact[];
  checklist: ChecklistSummary;
  latestNews: HomeNews[];
};

/* =========================================================
   MOCK HOME DATA
========================================================= */

const homeData: HomeData = {
  facts: [
    {
      id: 'fact-001',
      category: 'STUDENT SERVICES',
      title:
        'รู้ไหม? มหาวิทยาลัยขอนแก่นมี Notebook ให้นักศึกษาสามารถยืมได้ด้วยนะ',
      description:
        'นักศึกษาสามารถยืม Notebook เพื่อใช้สำหรับการเรียนและการทำงานได้ที่หอสมุดมหาวิทยาลัย',
      icon: 'laptop-outline',
      sourceUrl: 'https://library.kku.ac.th/',
      imageUrl:
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
    },

    {
      id: 'fact-002',
      category: 'CAMPUS LIFE',
      title:
        'รู้ไหม? นักศึกษา KKU สามารถใช้พื้นที่อ่านหนังสือของหอสมุดได้ฟรี',
      description:
        'หอสมุดมีพื้นที่สำหรับอ่านหนังสือ ค้นคว้า และใช้ทรัพยากรต่าง ๆ สำหรับนักศึกษา',
      icon: 'book-outline',
      sourceUrl: 'https://library.kku.ac.th/',
      imageUrl:
        'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
    },

    {
      id: 'fact-003',
      category: 'TRANSPORTATION',
      title:
        'รู้ไหม? KKU มี Shuttle Bus สำหรับเดินทางภายในมหาวิทยาลัย',
      description:
        'สามารถตรวจสอบเส้นทางและข้อมูลการเดินทางภายในมหาวิทยาลัยได้',
      icon: 'bus-outline',
      sourceUrl: 'https://www.kku.ac.th/',
      imageUrl:
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    },
  ],

  checklist: {
    todayCount: 2,
    overdueCount: 0,
  },

  latestNews: [
    {
      id: 'news-001',
      title: 'เปิดลงทะเบียนกิจกรรมสำหรับนักศึกษาใหม่',
      category: 'ANNOUNCEMENT',
      publishedAt: '20 Aug 2026',
      imageUrl:
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
      sourceUrl: 'https://www.kku.ac.th/',
    },

    {
      id: 'news-002',
      title:
        'กำหนดการสำคัญสำหรับนักศึกษา ประจำภาคการศึกษา',
      category: 'ACADEMIC',
      publishedAt: '19 Aug 2026',
      imageUrl:
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
      sourceUrl: 'https://www.kku.ac.th/',
    },

    {
      id: 'news-003',
      title:
        'กิจกรรมและข่าวสารใหม่จากมหาวิทยาลัยขอนแก่น',
      category: 'CAMPUS',
      publishedAt: '18 Aug 2026',
      imageUrl:
        'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=80',
      sourceUrl: 'https://www.kku.ac.th/',
    },
  ],
};

/* =========================================================
   HOME SCREEN
========================================================= */

export default function HomeScreen() {
  const router = useRouter();

  /* =======================================================
     STATE
  ======================================================= */

  const [searchText, setSearchText] = useState('');

  const [factIndex, setFactIndex] = useState(0);

  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<HomeData>(homeData);

  const [chatbotVisible, setChatbotVisible] =
  useState(false);

  /* =======================================================
     FLOAT ANIMATION
  ======================================================= */

  const floatAnimation = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: -3,
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
  }, [floatAnimation]);

  /* =======================================================
     AUTO CHANGE DID YOU KNOW
  ======================================================= */

  useEffect(() => {
    if (!data.facts || data.facts.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setFactIndex((current) => {
        return (
          (current + 1) % data.facts.length
        );
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [data.facts]);

  /* =======================================================
     CURRENT FACT
  ======================================================= */

  const currentFact =
    data.facts?.[factIndex];

  /* =======================================================
     SEARCH
  ======================================================= */

  const handleSearch = () => {
    const query = searchText.trim();

    if (!query) {
      return;
    }

    router.push({
      pathname: '/search',
      params: {
        q: query,
      },
    });
  };

  /* =======================================================
     OPEN EXTERNAL SOURCE
  ======================================================= */

  const openExternalLink = async (
    url?: string
  ) => {
    if (!url) {
      return;
    }

    try {
      const supported =
        await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log(
        'Unable to open URL:',
        error
      );
    }
  };

  /* =======================================================
     FACT PRESS
  ======================================================= */

  const handleFactPress = () => {
    if (!currentFact) {
      return;
    }

    if (currentFact.sourceUrl) {
      openExternalLink(
        currentFact.sourceUrl
      );

      return;
    }
  };

  /* =======================================================
     CHECKLIST PRESS
  ======================================================= */

  const handleChecklistPress = () => {
    router.push('/checklist');
  };

  /* =======================================================
     NEWS PRESS
  ======================================================= */

  const handleNewsPress = (
    news: HomeNews
  ) => {
    if (news.sourceUrl) {
      openExternalLink(
        news.sourceUrl
      );

      return;
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            COLORS.background
          }
        />

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="small"
            color={COLORS.orange}
          />

          <Text
            style={styles.loadingText}
          >
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          COLORS.background
        }
      />

      <View
        style={styles.screen}
      >

        {/* =================================================
            MAIN SCROLL
        ================================================= */}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* =================================================
              SEARCH
          ================================================= */}

          <View
            style={
              styles.searchContainer
            }
          >
            <Ionicons
              name="search-outline"
              size={17}
              color={
                COLORS.textLight
              }
            />

            <TextInput
              value={searchText}
              onChangeText={
                setSearchText
              }
              style={
                styles.searchInput
              }
              placeholder="Search all..."
              placeholderTextColor="#99928E"
              returnKeyType="search"
              onSubmitEditing={
                handleSearch
              }
            />

            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  setSearchText('')
                }
                style={
                  styles.clearButton
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={
                    COLORS.textLight
                  }
                />
              </TouchableOpacity>
            )}
          </View>

          {/* =================================================
              DID YOU KNOW
          ================================================= */}

          {currentFact && (
            <Animated.View
              style={[
                styles.heroWrapper,
                {
                  transform: [
                    {
                      translateY:
                        floatAnimation,
                    },
                  ],
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.heroCard,
                  pressed &&
                    styles.heroPressed,
                ]}
                onPress={
                  handleFactPress
                }
              >

                {/* IMAGE */}

                {currentFact.imageUrl ? (
                  <Image
                    source={{
                      uri:
                        currentFact.imageUrl,
                    }}
                    style={
                      styles.heroImage
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.heroImagePlaceholder
                    }
                  >
                    <Ionicons
                      name={
                        currentFact.icon
                      }
                      size={42}
                      color="#FFFFFF"
                    />
                  </View>
                )}

                {/* OVERLAY */}

                <View
                  style={
                    styles.heroOverlay
                  }
                />

                {/* CONTENT */}

                <View
                  style={
                    styles.heroContent
                  }
                >
                  <View
                    style={
                      styles.heroTopRow
                    }
                  >
                    <View
                      style={
                        styles.heroBadge
                      }
                    >
                      <Ionicons
                        name="bulb-outline"
                        size={13}
                        color={
                          COLORS.orange
                        }
                      />

                      <Text
                        style={
                          styles.heroBadgeText
                        }
                      >
                        DID YOU KNOW?
                      </Text>
                    </View>

                    <View
                      style={
                        styles.heroCategoryBadge
                      }
                    >
                      <Text
                        style={
                          styles.heroCategoryText
                        }
                      >
                        {
                          currentFact.category
                        }
                      </Text>
                    </View>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.heroTitle
                      }
                      numberOfLines={3}
                    >
                      {
                        currentFact.title
                      }
                    </Text>

                    <Text
                      style={
                        styles.heroDescription
                      }
                      numberOfLines={2}
                    >
                      {
                        currentFact.description
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.heroBottomRow
                    }
                  >
                    <View
                      style={
                        styles.factIndicators
                      }
                    >
                      {data.facts.map(
                        (_, index) => (
                          <View
                            key={
                              index
                            }
                            style={[
                              styles.factDot,
                              index ===
                                factIndex &&
                                styles.factDotActive,
                            ]}
                          />
                        )
                      )}
                    </View>

                    <View
                      style={
                        styles.heroReadMore
                      }
                    >
                      <Text
                        style={
                          styles.heroReadText
                        }
                      >
                        ดูรายละเอียด
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={13}
                        color={
                          COLORS.orange
                        }
                      />
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* =================================================
              TODAY REMINDER
          ================================================= */}

          <TodayReminder
            checklist={
              data.checklist
            }
            onPress={
              handleChecklistPress
            }
          />

          {/* =================================================
              LATEST NEWS
          ================================================= */}

          <View
            style={
              styles.newsSection
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  ข่าวล่าสุด
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  เรื่องราวที่น่าสนใจจาก KKU
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push(
                    '/news'
                  )
                }
                activeOpacity={0.7}
              >
                <Text
                  style={
                    styles.seeAllText
                  }
                >
                  ดูทั้งหมด
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.newsScrollContent
              }
            >
              {data.latestNews.map(
                (news) => (
                  <NewsCard
                    key={
                      news.id
                    }
                    news={news}
                    onPress={() =>
                      handleNewsPress(
                        news
                      )
                    }
                  />
                )
              )}
            </ScrollView>
          </View>

          {/* Extra space so floating button
              does not cover content */}
          <View
            style={
              styles.bottomSpace
            }
          />
        </ScrollView>

        {/* =================================================
            P'DIN-DANG CHATBOT
            Floating button
        ================================================= */}

        <ChatbotButton
  onPress={() =>
    setChatbotVisible(true)
  }
/>

<ChatbotSheet
  visible={chatbotVisible}
  onClose={() =>
    setChatbotVisible(false)
  }
/>

      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   TODAY REMINDER
========================================================= */

function TodayReminder({
  checklist,
  onPress,
}: {
  checklist: ChecklistSummary;
  onPress?: () => void;
}) {
  const count =
    checklist?.todayCount || 0;

  const overdue =
    checklist?.overdueCount || 0;

  if (count === 0) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={
          styles.reminderEmpty
        }
      >
        <View
          style={
            styles.reminderIconEmpty
          }
        >
          <Ionicons
            name="checkmark"
            size={15}
            color={
              COLORS.green
            }
          />
        </View>

        <View
          style={
            styles.reminderContent
          }
        >
          <Text
            style={
              styles.reminderTitleEmpty
            }
          >
            วันนี้ยังไม่มีรายการที่ต้องทำ ✨
          </Text>

          <Text
            style={
              styles.reminderSubtitle
            }
          >
            ดู Checklist ของคุณ
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={
            COLORS.textLight
          }
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={
        styles.reminderCard
      }
    >
      <View
        style={
          styles.reminderIcon
        }
      >
        <Ionicons
          name={
            overdue > 0
              ? 'alert-outline'
              : 'notifications-outline'
          }
          size={17}
          color={
            overdue > 0
              ? COLORS.orangeDark
              : COLORS.reminderIcon
          }
        />
      </View>

      <View
        style={
          styles.reminderContent
        }
      >
        <Text
          style={
            styles.reminderTitle
          }
        >
          {overdue > 0
            ? `มี ${overdue} รายการที่เลยกำหนด`
            : `วันนี้มี ${count} รายการที่ต้องทำ`}
        </Text>

        <Text
          style={
            styles.reminderSubtitle
          }
        >
          อย่าลืมเช็ก Checklist ของคุณนะ
        </Text>
      </View>

      <View
        style={
          styles.reminderArrow
        }
      >
        <Ionicons
          name="chevron-forward"
          size={16}
          color={
            COLORS.textSecondary
          }
        />
      </View>
    </TouchableOpacity>
  );
}

/* =========================================================
   NEWS CARD
========================================================= */

function NewsCard({
  news,
  onPress,
}: {
  news: HomeNews;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={
        styles.newsCard
      }
    >
      {news.imageUrl ? (
        <Image
          source={{
            uri:
              news.imageUrl,
          }}
          style={
            styles.newsImage
          }
        />
      ) : (
        <View
          style={
            styles.newsImagePlaceholder
          }
        >
          <Ionicons
            name="newspaper-outline"
            size={30}
            color={
              COLORS.orange
            }
          />
        </View>
      )}

      <View
        style={
          styles.newsContent
        }
      >
        <View
          style={
            styles.newsMeta
          }
        >
          <Text
            style={
              styles.newsCategory
            }
            numberOfLines={1}
          >
            {news.category}
          </Text>

          <Text
            style={
              styles.newsDate
            }
          >
            {news.publishedAt}
          </Text>
        </View>

        <Text
          style={
            styles.newsTitle
          }
          numberOfLines={3}
        >
          {news.title}
        </Text>

        <View
          style={
            styles.newsReadMore
          }
        >
          <Text
            style={
              styles.newsReadText
            }
          >
            อ่านเพิ่มเติม
          </Text>

          <Ionicons
            name="arrow-forward"
            size={12}
            color={
              COLORS.orange
            }
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* =======================================================
     SCREEN
  ======================================================= */

  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 90,
  },

  /* =======================================================
     SEARCH
  ======================================================= */

  searchContainer: {
    height: 42,
    width: '100%',
    borderRadius: 21,
    backgroundColor:
      COLORS.white,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,
    marginBottom: 14,

    borderWidth: 0.5,
    borderColor: '#F0EBE8',

    shadowColor: '#AFA7A2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,

    elevation: 1,
  },

  searchInput: {
    flex: 1,
    height: 42,

    marginLeft: 8,
    paddingVertical: 0,

    fontSize: 11,
    color: COLORS.text,
  },

  clearButton: {
    width: 25,
    height: 25,

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* =======================================================
     HERO
  ======================================================= */

  heroWrapper: {
    width: '100%',
    marginBottom: 14,
  },

  heroCard: {
    width: '100%',
    height: 265,

    borderRadius: 27,
    overflow: 'hidden',

    backgroundColor:
      COLORS.orange,

    position: 'relative',

    shadowColor: '#C85E25',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,

    elevation: 5,
  },

  heroPressed: {
    transform: [
      {
        scale: 0.985,
      },
    ],

    opacity: 0.96,
  },

  heroImage: {
    position: 'absolute',

    width: '100%',
    height: '100%',

    resizeMode: 'cover',
  },

  heroImagePlaceholder: {
    position: 'absolute',

    width: '100%',
    height: '100%',

    backgroundColor:
      COLORS.orange,

    alignItems: 'center',
    justifyContent: 'center',
  },

  heroOverlay: {
    position: 'absolute',

    width: '100%',
    height: '100%',

    backgroundColor:
      'rgba(0,0,0,0.38)',
  },

  heroContent: {
    flex: 1,

    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 13,

    justifyContent:
      'space-between',
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroBadge: {
    height: 28,

    paddingHorizontal: 9,
    borderRadius: 14,

    backgroundColor:
      COLORS.white,

    flexDirection: 'row',
    alignItems: 'center',
  },

  heroBadgeText: {
    fontSize: 7.5,
    fontWeight: '900',

    color: COLORS.orange,

    letterSpacing: 0.5,

    marginLeft: 5,
  },

  heroCategoryBadge: {
    height: 28,

    paddingHorizontal: 9,
    borderRadius: 14,

    backgroundColor:
      'rgba(255,255,255,0.18)',

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 7,
  },

  heroCategoryText: {
    fontSize: 6.5,
    fontWeight: '700',

    color: COLORS.white,

    letterSpacing: 0.5,
  },

  heroTitle: {
    fontSize: 18,
    lineHeight: 25,

    fontWeight: '800',

    color: COLORS.white,

    maxWidth: '95%',

    marginTop: 10,
  },

  heroDescription: {
    fontSize: 9.5,
    lineHeight: 14,

    fontWeight: '400',

    color:
      'rgba(255,255,255,0.92)',

    maxWidth: '93%',

    marginTop: 5,
  },

  heroBottomRow: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent:
      'space-between',

    marginTop: 8,
  },

  factIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  factDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor:
      'rgba(255,255,255,0.45)',

    marginRight: 4,
  },

  factDotActive: {
    width: 17,

    backgroundColor:
      COLORS.white,
  },

  heroReadMore: {
    height: 31,

    paddingHorizontal: 11,
    borderRadius: 16,

    backgroundColor:
      COLORS.white,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroReadText: {
    fontSize: 8,
    fontWeight: '800',

    color: COLORS.orange,

    marginRight: 5,
  },

  /* =======================================================
     TODAY REMINDER
  ======================================================= */

  reminderCard: {
    minHeight: 60,
    width: '100%',

    borderRadius: 19,

    backgroundColor:
      COLORS.reminder,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,
    paddingVertical: 9,

    marginBottom: 19,

    borderWidth: 0.5,
    borderColor: '#F4E7CF',
  },

  reminderEmpty: {
    minHeight: 55,
    width: '100%',

    borderRadius: 19,

    backgroundColor:
      '#F1F8F2',

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,
    paddingVertical: 8,

    marginBottom: 19,

    borderWidth: 0.5,
    borderColor: '#E0EEE1',
  },

  reminderIcon: {
    width: 35,
    height: 35,

    borderRadius: 13,

    backgroundColor:
      '#FFF0D1',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,
  },

  reminderIconEmpty: {
    width: 35,
    height: 35,

    borderRadius: 13,

    backgroundColor:
      '#E2F2E4',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,
  },

  reminderContent: {
    flex: 1,
    paddingRight: 7,
  },

  reminderTitle: {
    fontSize: 10.5,

    fontWeight: '800',

    color: COLORS.text,

    marginBottom: 2,
  },

  reminderTitleEmpty: {
    fontSize: 10,

    fontWeight: '700',

    color: COLORS.text,

    marginBottom: 2,
  },

  reminderSubtitle: {
    fontSize: 7.5,
    color: COLORS.textLight,
  },

  reminderArrow: {
    width: 27,
    height: 27,

    borderRadius: 14,

    backgroundColor:
      'rgba(255,255,255,0.65)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* =======================================================
     NEWS
  ======================================================= */

  newsSection: {
    width: '100%',
    marginBottom: 10,
  },

  sectionHeader: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent:
      'space-between',

    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: 14,

    fontWeight: '800',

    color: COLORS.text,
  },

  sectionSubtitle: {
    fontSize: 7.5,

    color: COLORS.textLight,

    marginTop: 2,
  },

  seeAllText: {
    fontSize: 8.5,

    fontWeight: '700',

    color: COLORS.orange,
  },

  newsScrollContent: {
    paddingRight: 10,
  },

  /* =======================================================
     NEWS CARD
  ======================================================= */

  newsCard: {
    width: 205,
    minHeight: 220,

    borderRadius: 22,

    backgroundColor:
      COLORS.white,

    overflow: 'hidden',

    shadowColor: '#AFA7A2',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.07,
    shadowRadius: 8,

    elevation: 2,

    marginRight: 10,
  },

  newsImage: {
    width: '100%',
    height: 105,

    resizeMode: 'cover',
  },

  newsImagePlaceholder: {
    width: '100%',
    height: 105,

    backgroundColor:
      COLORS.newsBackground,

    alignItems: 'center',
    justifyContent: 'center',
  },

  newsContent: {
    flex: 1,

    paddingHorizontal: 11,
    paddingVertical: 10,
  },

  newsMeta: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent:
      'space-between',

    marginBottom: 6,
  },

  newsCategory: {
    flex: 1,

    fontSize: 6.5,

    fontWeight: '800',

    color: COLORS.orange,

    letterSpacing: 0.5,

    marginRight: 5,
  },

  newsDate: {
    fontSize: 6.5,
    color: COLORS.textLight,
  },

  newsTitle: {
    fontSize: 10.5,
    lineHeight: 15,

    fontWeight: '700',

    color: COLORS.text,
  },

  newsReadMore: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 'auto',
    paddingTop: 8,
  },

  newsReadText: {
    fontSize: 7.5,

    fontWeight: '800',

    color: COLORS.orange,

    marginRight: 4,
  },
  
  /* =======================================================
     LOADING
  ======================================================= */

  loadingContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.background,
  },

  loadingText: {
    fontSize: 9,

    color: COLORS.textLight,

    marginTop: 8,
  },

  /* =======================================================
     BOTTOM
  ======================================================= */

  bottomSpace: {
    height: 30,
  },
});