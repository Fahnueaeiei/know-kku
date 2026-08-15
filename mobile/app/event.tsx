// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Linking,
  Share,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import EventCard from "../components/EventCard";

/* =========================================================
   TYPES
========================================================= */

type Event = {
  eventId: string | number;

  title: string;

  category?: string;

  description?: string;

  image?: string;

  date?: string;

  startTime?: string;

  endTime?: string;

  location?: string;

  sourceUrl?: string;

  favorite?: boolean;
};

/* =========================================================
   DESIGN TOKENS
========================================================= */

const COLORS = {
  orange: "#FA7C35",
  orangeLight: "#FFF0E8",

  background: "#FAF7F5",
  white: "#FFFFFF",

  text: "#2A2928",
  textSecondary: "#686360",
  textLight: "#8E8985",

  border: "#EFE8E4",

  categoryBackground: "#F0ECE8",

  favorite: "#E63946",
};

/* =========================================================
   MOCK DATA
   -----------------------------------------------
   ใช้สำหรับดู UI ก่อน Backend พร้อม
========================================================= */

const MOCK_EVENTS: Event[] = [
  {
    eventId: "1",
    title: "KKU Freshmen Orientation 2026",
    category: "University",
    description:
      "กิจกรรมปฐมนิเทศนักศึกษาใหม่ มหาวิทยาลัยขอนแก่น",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
    date: "20 Aug 2026",
    startTime: "09:00",
    endTime: "12:00",
    location: "Khon Kaen University",
    sourceUrl: "https://www.kku.ac.th/",
    favorite: true,
  },

  {
    eventId: "2",
    title: "AI & Future Technology Workshop",
    category: "Workshop",
    description:
      "Workshop เรียนรู้เทคโนโลยี AI และแนวโน้มของเทคโนโลยีในอนาคต",
    image:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
    date: "24 Aug 2026",
    startTime: "13:00",
    endTime: "16:00",
    location: "College of Computing",
    sourceUrl: "https://computing.kku.ac.th/",
    favorite: false,
  },

  {
    eventId: "3",
    title: "KKU Startup Pitching Day",
    category: "Competition",
    description:
      "การแข่งขันนำเสนอแนวคิด Startup สำหรับนักศึกษา",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72",
    date: "28 Aug 2026",
    startTime: "09:30",
    endTime: "17:00",
    location: "Science Park KKU",
    sourceUrl: "https://www.kku.ac.th/",
    favorite: false,
  },

  {
    eventId: "4",
    title: "Student Club Fair 2026",
    category: "Student Activity",
    description:
      "เปิดโอกาสให้นักศึกษาเลือกชมรมและกิจกรรมที่สนใจ",
    image:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18",
    date: "2 Sep 2026",
    startTime: "10:00",
    endTime: "16:00",
    location: "Srinagarind Exhibition Hall",
    sourceUrl: "https://www.kku.ac.th/",
    favorite: true,
  },
];

/* =========================================================
   EVENT SCREEN
========================================================= */

export default function EventScreen() {
  const [events, setEvents] = useState<Event[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("All Events");

  /* =======================================================
     FETCH EVENTS
  ======================================================= */

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");

        /*
          Backend จริง:

          const response = await fetch(
            `${API_URL}/events`
          );

          const data = await response.json();

          setEvents(data);
        */

        /*
          ตอนนี้ใช้ Mock Data
          เพื่อดู UI ก่อน
        */

        setTimeout(() => {
          setEvents(MOCK_EVENTS);
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error(
          "Failed to load events:",
          err
        );

        setError(
          "Unable to load events."
        );

        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categories = useMemo(() => {
    const backendCategories =
      Array.from(
        new Set(
          events
            .map(
              (event) =>
                event.category
            )
            .filter(Boolean)
        )
      );

    return [
      "All Events",
      ...backendCategories,
      "Favorites",
    ];
  }, [events]);

  /* =======================================================
     FILTER EVENTS
  ======================================================= */

  const filteredEvents = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return events.filter((event) => {
      /* -------------------------
         CATEGORY
      ------------------------- */

      let matchesCategory = true;

      if (
        activeCategory ===
        "Favorites"
      ) {
        matchesCategory =
          event.favorite === true;
      } else if (
        activeCategory !==
        "All Events"
      ) {
        matchesCategory =
          event.category
            ?.toLowerCase() ===
          activeCategory.toLowerCase();
      }

      /* -------------------------
         SEARCH
      ------------------------- */

      const matchesSearch =
        !keyword ||
        event.title
          ?.toLowerCase()
          .includes(keyword) ||
        event.description
          ?.toLowerCase()
          .includes(keyword) ||
        event.location
          ?.toLowerCase()
          .includes(keyword) ||
        event.category
          ?.toLowerCase()
          .includes(keyword);

      return (
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    events,
    activeCategory,
    search,
  ]);

  /* =======================================================
     FAVORITE
     -----------------------------------------------
     Backend-ready
  ======================================================= */

  const toggleFavorite = async (
    event: Event
  ) => {
    const newFavoriteState =
      !event.favorite;

    /*
      Optimistic UI
    */

    setEvents((previousEvents) =>
      previousEvents.map((item) =>
        item.eventId ===
        event.eventId
          ? {
              ...item,
              favorite:
                newFavoriteState,
            }
          : item
      )
    );

    /*
      Backend ในอนาคต:

      await fetch(
        `${API_URL}/events/${event.eventId}/favorite`,
        {
          method:
            newFavoriteState
              ? "POST"
              : "DELETE",
        }
      );
    */
  };

  /* =======================================================
     JOIN EVENT
     -----------------------------------------------
     เปิดเว็บไซต์ต้นทาง
  ======================================================= */

  const joinEvent = async (
    event: Event
  ) => {
    if (!event.sourceUrl) {
      console.warn(
        "Event source URL is missing."
      );

      return;
    }

    try {
      await Linking.openURL(
        event.sourceUrl
      );
    } catch (error) {
      console.error(
        "Unable to open event URL:",
        error
      );
    }
  };

  /* =======================================================
     SHARE EVENT
  ======================================================= */

  const shareEvent = async (
    event: Event
  ) => {
    try {
      await Share.share({
        title: event.title,

        message: `
${event.title}

📅 ${event.date ?? ""}
⏰ ${event.startTime ?? ""}${
          event.endTime
            ? ` - ${event.endTime}`
            : ""
        }

📍 ${event.location ?? ""}

${event.sourceUrl ?? ""}
        `.trim(),
      });
    } catch (error) {
      console.error(
        "Share event error:",
        error
      );
    }
  };

  /* =======================================================
     EVENT HEADER
  ======================================================= */

  const ListHeader = () => {
    return (
      <View>

        {/* ================= SEARCH ================= */}

        <View
          style={
            styles.searchContainer
          }
        >
          <Ionicons
            name="search-outline"
            size={14}
            color="#77716D"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#99928E"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {/* ================= CATEGORY ================= */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={styles.sectionTitle}
          >
            Categories
          </Text>

          <Ionicons
            name="calendar-outline"
            size={16}
            color={COLORS.orange}
          />
        </View>

        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({
            item,
          }) => {
            const active =
              item ===
              activeCategory;

            const isFavorite =
              item ===
              "Favorites";

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.categoryChip,

                  active &&
                    styles.categoryChipActive,

                  isFavorite &&
                    styles.favoriteChip,

                  isFavorite &&
                    active &&
                    styles.favoriteChipActive,
                ]}
                onPress={() =>
                  setActiveCategory(
                    item
                  )
                }
              >
                {isFavorite && (
                  <Ionicons
                    name={
                      active
                        ? "heart"
                        : "heart-outline"
                    }
                    size={13}
                    color={
                      active
                        ? "#FFFFFF"
                        : COLORS.favorite
                    }
                  />
                )}

                <Text
                  style={[
                    styles.categoryText,

                    active &&
                      styles.categoryTextActive,

                    isFavorite &&
                      !active &&
                      styles.favoriteText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.categoriesList
          }
        />

        {/* ================= TITLE ================= */}

        <View
          style={styles.resultHeader}
        >
          <Text
            style={styles.resultTitle}
          >
            {activeCategory ===
            "All Events"
              ? "Upcoming Events"
              : activeCategory ===
                "Favorites"
              ? "Favorite Events"
              : activeCategory}
          </Text>

          <Text
            style={styles.resultCount}
          >
            {filteredEvents.length} events
          </Text>
        </View>

      </View>
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <View
      style={styles.container}
    >
      <FlatList
        data={
          loading
            ? []
            : filteredEvents
        }
        keyExtractor={(item) =>
          String(item.eventId)
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.listContent
        }

        ListHeaderComponent={
          <ListHeader />
        }

        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => {}}
            onToggleFavorite={
              toggleFavorite
            }
            onJoin={joinEvent}
            onShare={shareEvent}
          />
        )}

        ListEmptyComponent={
          loading ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <ActivityIndicator
                size="small"
                color={
                  COLORS.orange
                }
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                Loading events...
              </Text>
            </View>
          ) : error ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Ionicons
                name="cloud-offline-outline"
                size={28}
                color="#B8B0AC"
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                {error}
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Ionicons
                name={
                  activeCategory ===
                  "Favorites"
                    ? "heart-outline"
                    : "calendar-outline"
                }
                size={30}
                color="#C8C0BC"
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                {activeCategory ===
                "Favorites"
                  ? "No favorite events yet."
                  : "No events found."}
              </Text>
            </View>
          )
        }

        ListFooterComponent={
          <View
            style={styles.bottomSpace}
          />
        }
      />
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    /* ================= SCREEN ================= */

    container: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    listContent: {
      paddingHorizontal: 10,
      paddingTop: 7,
    },

    /* ================= SEARCH ================= */

    searchContainer: {
      height: 35,
      width: "100%",

      borderRadius: 18,

      backgroundColor:
        COLORS.white,

      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 11,

      marginBottom: 16,

      borderWidth: 0.5,
      borderColor: "#F0EBE8",
    },

    searchInput: {
      flex: 1,

      height: 35,

      marginLeft: 7,

      paddingVertical: 0,

      fontSize: 9,

      color: COLORS.text,
    },

    /* ================= CATEGORY ================= */

    sectionHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginBottom: 9,
    },

    sectionTitle: {
      fontSize: 14,

      fontWeight: "700",

      color: COLORS.text,
    },

    categoriesList: {
      paddingBottom: 18,

      paddingRight: 10,
    },

    categoryChip: {
      minHeight: 34,

      paddingHorizontal: 15,

      borderRadius: 18,

      backgroundColor:
        COLORS.categoryBackground,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      marginRight: 8,

      gap: 5,
    },

    categoryChipActive: {
      backgroundColor:
        COLORS.orange,
    },

    categoryText: {
      fontSize: 9.5,

      fontWeight: "600",

      color: "#5F5955",
    },

    categoryTextActive: {
      color: "#FFFFFF",
    },

    favoriteChip: {
      borderWidth: 1,

      borderColor: "#F2C7C9",

      backgroundColor:
        "#FFF5F5",
    },

    favoriteChipActive: {
      backgroundColor:
        COLORS.favorite,

      borderColor:
        COLORS.favorite,
    },

    favoriteText: {
      color:
        COLORS.favorite,
    },

    /* ================= RESULT ================= */

    resultHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginBottom: 10,
    },

    resultTitle: {
      fontSize: 14,

      fontWeight: "700",

      color: COLORS.text,
    },

    resultCount: {
      fontSize: 8.5,

      color:
        COLORS.textLight,
    },

    /* ================= EMPTY ================= */

    emptyContainer: {
      alignItems: "center",

      justifyContent:
        "center",

      paddingTop: 45,

      paddingBottom: 30,
    },

    emptyText: {
      marginTop: 10,

      fontSize: 9,

      color:
        COLORS.textLight,

      textAlign: "center",
    },

    /* ================= BOTTOM ================= */

    bottomSpace: {
      height: 15,
    },
  });