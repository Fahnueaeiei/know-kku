// @ts-nocheck

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getEvents } from "../api/api";
import { KKU_EVENTS_PAGE_URL, fetchKkuEvents } from "../api/events";
import EventCard from "../components/EventCard";
import { COLORS } from "../constants/appTheme";

/* =========================================================
   TYPES
========================================================= */

type Event = {
  eventId: string | number;
  title: string;
  categories: string[]; // กิจกรรมหนึ่งมีได้หลายหมวด
  description?: string;
  imageUrl?: string;
  date?: string;
  location?: string;
  sourceUrl?: string;
  favorite?: boolean;
  source?: "app" | "kku";
};

const ALL = "All Events";
const KKU_LIMIT = 20;

/* =========================================================
   EVENT SCREEN
   รวมกิจกรรมของแอป (DB) + ปฏิทินกิจกรรม มข. ไว้ในลิสต์เดียวกัน
========================================================= */

export default function EventScreen() {
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL);

  /* =======================================================
     FETCH EVENTS
     - ดึงจาก DB ของแอป + kku.ac.th พร้อมกัน
     - ฝั่งใดฝั่งหนึ่งล่ม อีกฝั่งยังแสดงได้
     - ดึงลงเพื่อรีเฟรชได้ / คงสถานะ favorite ในเครื่องไว้
  ======================================================= */

  const loadEvents = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [appRes, kkuRes] = await Promise.allSettled([
        getEvents(),
        fetchKkuEvents(KKU_LIMIT),
      ]);

      if (appRes.status === "rejected" && kkuRes.status === "rejected") {
        throw appRes.reason;
      }

      const appEvents: Event[] =
        appRes.status === "fulfilled"
          ? appRes.value.map((event) => ({
              ...event,
              source: "app",
              categories: event.category ? [event.category] : [],
              imageUrl: event.imageUrl ?? undefined,

              date: new Date(event.eventDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),

              sourceUrl: event.externalLink ?? undefined,
            }))
          : [];

      const kkuEvents: Event[] =
        kkuRes.status === "fulfilled"
          ? kkuRes.value.map((ev) => ({
              eventId: `kku-${ev.id}`,
              source: "kku",
              title: ev.title,
              categories: ev.categories ?? [],
              imageUrl: ev.imageUrl ?? undefined,
              date: ev.dateLabel,
              location: ev.venue ?? undefined,
              sourceUrl: ev.url,
            }))
          : [];

      setEvents((previous) => {
        const localFavorites = new Set(
          previous
            .filter((e) => e.favorite)
            .map((e) => String(e.eventId))
        );

        return [...appEvents, ...kkuEvents].map((e) => ({
          ...e,
          favorite: localFavorites.has(String(e.eventId)),
        }));
      });
    } catch (err) {
      console.error("Failed to load events:", err);
      setError("Unable to load events.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  /* =======================================================
     CATEGORIES
     นับแต่ละหมวดจากทุกกิจกรรม (กิจกรรมหนึ่งนับได้หลายหมวด)
  ======================================================= */

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    events.forEach((event) => {
      new Set(event.categories).forEach((category) => {
        counts[category] = (counts[category] ?? 0) + 1;
      });
    });

    return counts;
  }, [events]);

  const categories = useMemo(
    () => [ALL, ...Object.keys(categoryCounts)],
    [categoryCounts]
  );

  /* =======================================================
     FILTER EVENTS
  ======================================================= */

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return events.filter((event) => {
      let matchesCategory = true;

      if (activeCategory === "Favorites") {
        matchesCategory = event.favorite === true;
      } else if (activeCategory !== ALL) {
        matchesCategory = event.categories.some(
          (category) => category.toLowerCase() === activeCategory.toLowerCase()
        );
      }

      const matchesSearch =
        !keyword ||
        event.title?.toLowerCase().includes(keyword) ||
        event.description?.toLowerCase().includes(keyword) ||
        event.location?.toLowerCase().includes(keyword) ||
        event.categories.some((category) =>
          category.toLowerCase().includes(keyword)
        );

      return matchesCategory && matchesSearch;
    });
  }, [events, activeCategory, search]);

  const favoriteCount = useMemo(
    () => events.filter((event) => event.favorite === true).length,
    [events]
  );

  /* =======================================================
     FAVORITE (Backend-ready)
  ======================================================= */

  const toggleFavorite = async (event: Event) => {
    const newFavoriteState = !event.favorite;

    // Optimistic UI
    setEvents((previousEvents) =>
      previousEvents.map((item) =>
        item.eventId === event.eventId
          ? { ...item, favorite: newFavoriteState }
          : item
      )
    );

    /*
      Backend ในอนาคต:

      await fetch(`${API_URL}/events/${event.eventId}/favorite`, {
        method: newFavoriteState ? "POST" : "DELETE",
      });
    */
  };

  /* =======================================================
     OPEN EVENT DETAIL
     - กิจกรรมของแอป: ส่ง id ไปให้หน้ารายละเอียดดึงจาก DB
     - กิจกรรมของ มข.: ส่งข้อมูลผ่าน params (หน้ารายละเอียดจะดึงข้อมูลเต็มเอง)
  ======================================================= */

  const openEvent = (item: Event) => {
    if (item.source === "kku") {
      router.push({
        pathname: "/event/[id]" as any,
        params: {
          id: String(item.eventId),
          source: "kku",
          title: item.title,
          dateLabel: item.date ?? "",
          venue: item.location ?? "",
          imageUrl: item.imageUrl ?? "",
          url: item.sourceUrl ?? "",
        },
      });
      return;
    }

    router.push(`/event/${item.eventId}`);
  };

  /* =======================================================
     CATEGORY ITEM
  ======================================================= */

  const renderCategory = ({ item }: { item: string }) => {
    const isActive = item === activeCategory;

    const icon = item === ALL ? "apps-outline" : "pricetag-outline";

    const count = item === ALL ? events.length : categoryCounts[item] ?? 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.categoryChip, isActive && styles.categoryChipActive]}
        onPress={() => setActiveCategory(item)}
      >
        <Ionicons
          name={icon}
          size={15}
          color={isActive ? "#FFFFFF" : COLORS.brick}
        />

        <Text
          style={[styles.categoryText, isActive && styles.categoryTextActive]}
        >
          {item}
        </Text>

        <View
          style={[styles.countBubble, isActive && styles.countBubbleActive]}
        >
          <Text
            style={[styles.countText, isActive && styles.countTextActive]}
          >
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /* =======================================================
     HEADER
     ส่งเป็น element (ไม่ใช่ component) กันคีย์บอร์ดหลุดตอนพิมพ์
  ======================================================= */

  const listHeader = (
    <View>
      {/* ================= SEARCH ================= */}

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.textLight} />

        <TextInput
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor="#99928E"
          returnKeyType="search"
        />

        {search.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.clearButton}
            onPress={() => setSearch("")}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ================= CATEGORY HEADER ================= */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.favoritePill,
            activeCategory === "Favorites" && styles.favoritePillActive,
          ]}
          onPress={() =>
            setActiveCategory(activeCategory === "Favorites" ? ALL : "Favorites")
          }
        >
          <Ionicons
            name={activeCategory === "Favorites" ? "heart" : "heart-outline"}
            size={16}
            color={activeCategory === "Favorites" ? "#FFFFFF" : COLORS.favorite}
          />

          <Text
            style={[
              styles.favoritePillText,
              activeCategory === "Favorites" && { color: "#FFFFFF" },
            ]}
          >
            {favoriteCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= CATEGORY ================= */}

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        renderItem={renderCategory}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      />

      {/* ================= RESULT HEADER ================= */}

      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>
          {activeCategory === ALL
            ? "Upcoming Events"
            : activeCategory === "Favorites"
              ? "Favorite Events"
              : activeCategory}
        </Text>

        <View style={styles.resultCountPill}>
          <Text style={styles.resultCount}>
            {filteredEvents.length} events
          </Text>
        </View>
      </View>
    </View>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : filteredEvents}
        keyExtractor={(item) => String(item.eventId)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={COLORS.orange}
            colors={[COLORS.orange]}
            onRefresh={() => loadEvents(true)}
          />
        }
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => openEvent(item)}
            onToggleFavorite={toggleFavorite}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color={COLORS.orange} />

              <Text style={styles.emptyText}>Loading events...</Text>
            </View>
          ) : error ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.emptyContainer}
              onPress={() => loadEvents()}
            >
              <Ionicons
                name="cloud-offline-outline"
                size={28}
                color="#B8B0AC"
              />

              <Text style={styles.emptyText}>{error} Tap to retry.</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={
                    activeCategory === "Favorites"
                      ? "heart-outline"
                      : "calendar-outline"
                  }
                  size={28}
                  color={COLORS.brick}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {activeCategory === "Favorites"
                  ? "No favorite events yet"
                  : "No events found"}
              </Text>

              <Text style={styles.emptyText}>
                {activeCategory === "Favorites"
                  ? "Tap the heart on an event to save it here."
                  : "Try a different keyword or category."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.allButton}
              onPress={() => Linking.openURL(KKU_EVENTS_PAGE_URL)}
            >
              <Text style={styles.allButtonText}>ดูข่าวทั้งหมดที่ kku.ac.th</Text>
              <Ionicons name="open-outline" size={17} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.bottomSpace} />
          </View>
        }
      />
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  /* ---------- search ---------- */

  searchContainer: {
    height: 46,
    width: "100%",
    borderRadius: 23,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#F0EBE8",
    shadowColor: "#AFA7A2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 1,
  },

  searchInput: {
    flex: 1,
    height: 46,
    marginLeft: 8,
    paddingVertical: 0,
    fontSize: 14,
    color: COLORS.ink,
  },

  clearButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ---------- categories ---------- */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.ink,
  },

  favoritePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#F7D0D3",
  },

  favoritePillActive: {
    backgroundColor: COLORS.favorite,
    borderColor: COLORS.favorite,
  },

  favoritePillText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.favorite,
  },

  categoriesList: {
    paddingBottom: 20,
    paddingRight: 4,
  },

  categoryChip: {
    minHeight: 40,
    paddingLeft: 13,
    paddingRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    gap: 6,
  },

  categoryChipActive: {
    backgroundColor: COLORS.brick,
    borderColor: COLORS.brick,
  },

  categoryText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.inkSoft,
  },

  categoryTextActive: {
    color: "#FFFFFF",
  },

  countBubble: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  countBubbleActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  countText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: COLORS.brick,
  },

  countTextActive: {
    color: "#FFFFFF",
  },

  /* ---------- result header ---------- */

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.ink,
  },

  resultCountPill: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  resultCount: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.brick,
  },

  /* ---------- empty ---------- */

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.ink,
    marginBottom: 4,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSoft,
    textAlign: "center",
  },

  /* ---------- footer ---------- */

  allButton: {
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.brick,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },

  allButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  bottomSpace: {
    height: 32,
  },
});