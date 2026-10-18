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
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getPlaces } from "../api/api";
import PlaceCard from "../components/PlaceCard";
import { COLORS, getCategoryMeta } from "../constants/appTheme";
import { searchPlaces } from "../utils/searchPlaces";

/* =========================================================
   TYPES
========================================================= */

type Place = {
  placeId: string | number;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  distance?: string; // ถ้า backend ส่งมา จะแสดงบนการ์ดให้เอง
  favorite?: boolean;
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StatPill({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={13} color="#FFFFFF" />
      <Text style={styles.statPillText}>{label}</Text>
    </View>
  );
}

/* =========================================================
   PLACE SCREEN
========================================================= */

export default function PlaceScreen() {
  const router = useRouter();

  /* =======================================================
     STATE
  ======================================================= */

  const [places, setPlaces] = useState<Place[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [activeCategory, setActiveCategory] = useState("All");

  /* =======================================================
     FETCH PLACES
     -----------------------------------------------
     Backend-ready:
     ภายหลังเปลี่ยน URL เป็น API จริงได้ทันที
     ดึงลงเพื่อรีเฟรชได้ และคงสถานะ favorite ในเครื่องไว้
  ======================================================= */

  const loadPlaces = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getPlaces();

      setPlaces((previous) => {
        const localFavorites = new Set(
          previous
            .filter((p) => p.favorite)
            .map((p) => String(p.placeId))
        );

        return data.map((place) => ({
          ...place,
          favorite:
            localFavorites.has(String(place.placeId)) ||
            place.favorite === true,
          image: place.imageUrl
            ? { uri: place.imageUrl }
            : undefined,
        }));
      });
    } catch (err) {
      console.error("Failed to load places:", err);
      setError("Unable to load places.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  /* =======================================================
     CATEGORIES
     -----------------------------------------------
     Backend สามารถส่ง category ใหม่มาได้
     ระบบจะสร้าง Category ให้อัตโนมัติ
  ======================================================= */

  const categories = useMemo(() => {
    const backendCategories = Array.from(
      new Set(
        places
          .map((place) => place.category)
          .filter(Boolean)
      )
    );

    return [
      "All",
      ...backendCategories,
    ];
  }, [places]);

  // จำนวนสถานที่ในแต่ละประเภท (แสดงเป็นตัวเลขบนชิป)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    places.forEach((place) => {
      if (place.category) {
        counts[place.category] =
          (counts[place.category] ?? 0) + 1;
      }
    });

    return counts;
  }, [places]);

  /* =======================================================
     FILTER PLACES
     -----------------------------------------------
     1) กรองตามหมวดก่อน
     2) ค้นหาด้วย searchPlaces (รองรับ sc09 / sc9 / ตึกวิทยวิภาส ฯลฯ)
        ช่องค้นหาว่าง = คืนทั้งหมดตามลำดับเดิม
  ======================================================= */

  const filteredPlaces = useMemo(() => {
    const byCategory = places.filter((place) => {
      if (activeCategory === "Favorites") {
        return place.favorite === true;
      }

      if (activeCategory === "All") return true;

      return (
        place.category?.toLowerCase() ===
        activeCategory.toLowerCase()
      );
    });

    return searchPlaces(byCategory, search);
  }, [
    places,
    activeCategory,
    search,
  ]);

  /* =======================================================
     FAVORITE CATEGORY
  ======================================================= */

  const favoriteCount = useMemo(() => {
    return places.filter(
      (place) => place.favorite === true
    ).length;
  }, [places]);

  /* =======================================================
     TOGGLE FAVORITE
     -----------------------------------------------
     ตอนนี้เปลี่ยน state ในเครื่องก่อน

     ภายหลังสามารถเปลี่ยนเป็น:

     await api.toggleFavorite(place.placeId)

     ได้ง่าย
  ======================================================= */

  const toggleFavorite = async (place: Place) => {
    try {
      const newFavoriteState = !place.favorite;

      /* ---------------------------------------------
         Optimistic UI
         เปลี่ยน UI ทันที
      --------------------------------------------- */

      setPlaces((previousPlaces) =>
        previousPlaces.map((item) =>
          item.placeId === place.placeId
            ? {
              ...item,
              favorite: newFavoriteState,
            }
            : item
        )
      );

      /* ---------------------------------------------
         BACKEND - FUTURE

         await fetch(
           `http://172.20.10.2:3000/places/${place.placeId}/favorite`,
           {
             method: newFavoriteState ? "POST" : "DELETE",
           }
         );
      --------------------------------------------- */
    } catch (err) {
      console.error(
        "Toggle favorite error:",
        err
      );
    }
  };

  /* =======================================================
     PLACE DETAIL
  ======================================================= */

  const goToDetail = (place: Place) => {
    router.push(`/place/${place.placeId}`);
  };

  /* =======================================================
     CATEGORY ITEM
  ======================================================= */

  const renderCategory = ({
    item,
  }: {
    item: string;
  }) => {
    const isActive = item === activeCategory;

    const icon =
      item === "All"
        ? "apps-outline"
        : getCategoryMeta(item).icon;

    const count =
      item === "All"
        ? places.length
        : categoryCounts[item] ?? 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.categoryChip,
          isActive &&
          styles.categoryChipActive,
        ]}
        onPress={() =>
          setActiveCategory(item)
        }
      >
        <Ionicons
          name={icon}
          size={15}
          color={isActive ? "#FFFFFF" : COLORS.brick}
        />

        <Text
          style={[
            styles.categoryText,
            isActive &&
            styles.categoryTextActive,
          ]}
        >
          {item}
        </Text>

        <View
          style={[
            styles.countBubble,
            isActive && styles.countBubbleActive,
          ]}
        >
          <Text
            style={[
              styles.countText,
              isActive && styles.countTextActive,
            ]}
          >
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /* =======================================================
     HEADER
     -----------------------------------------------
     ส่งเป็น element (ไม่ใช่ component ที่ประกาศในฟังก์ชัน)
     ไม่งั้นช่องค้นหาจะถูกสร้างใหม่ทุกครั้งที่พิมพ์
     ทำให้คีย์บอร์ดหลุดทุกตัวอักษร
  ======================================================= */

  const listHeader = (
    <View>

      {/* ================= SEARCH ================= */}

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={COLORS.textLight}
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholder="Search buildings, cafes or loops..."
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
        <Text style={styles.sectionTitle}>
          Categories
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.favoritePill,
            activeCategory === "Favorites" &&
            styles.favoritePillActive,
          ]}
          onPress={() =>
            setActiveCategory(
              activeCategory === "Favorites"
                ? "All"
                : "Favorites"
            )
          }
        >
          <Ionicons
            name={
              activeCategory === "Favorites"
                ? "heart"
                : "heart-outline"
            }
            size={16}
            color={
              activeCategory === "Favorites"
                ? "#FFFFFF"
                : COLORS.favorite
            }
          />

          <Text
            style={[
              styles.favoritePillText,
              activeCategory === "Favorites" && {
                color: "#FFFFFF",
              },
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
        contentContainerStyle={
          styles.categoriesList
        }
      />

      {/* ================= RESULT HEADER ================= */}

      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>
          {activeCategory === "All"
            ? "Places"
            : activeCategory === "Favorites"
              ? "Favorite Places"
              : activeCategory}
        </Text>

        <View style={styles.resultCountPill}>
          <Text style={styles.resultCount}>
            {filteredPlaces.length} places
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
        data={filteredPlaces}
        keyExtractor={(item) =>
          String(item.placeId)
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.listContent
        }

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={COLORS.orange}
            colors={[COLORS.orange]}
            onRefresh={() => loadPlaces(true)}
          />
        }

        ListHeaderComponent={listHeader}

        renderItem={({ item, index }) => (
          <PlaceCard
            place={item}
            index={index}
            variant={index === 0 ? "featured" : "compact"}
            onPress={goToDetail}
            onToggleFavorite={
              toggleFavorite
            }
          />
        )}

        ListFooterComponent={
          <View style={styles.bottomSpace} />
        }

        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator
                size="small"
                color={COLORS.orange}
              />

              <Text style={styles.emptyText}>
                Loading places...
              </Text>
            </View>
          ) : error ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.emptyContainer}
              onPress={() => loadPlaces()}
            >
              <Ionicons
                name="cloud-offline-outline"
                size={28}
                color="#B8B0AC"
              />

              <Text style={styles.emptyText}>
                {error} Tap to retry.
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={
                    activeCategory ===
                      "Favorites"
                      ? "heart-outline"
                      : "search-outline"
                  }
                  size={28}
                  color={COLORS.brick}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {activeCategory ===
                  "Favorites"
                  ? "No favorite places yet"
                  : "No places found"}
              </Text>

              <Text style={styles.emptyText}>
                {activeCategory ===
                  "Favorites"
                  ? "Tap the heart on a place to save it here."
                  : "Try a different keyword or category."}
              </Text>
            </View>
          )
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

  /* ---------- banner ---------- */

  banner: {
    backgroundColor: COLORS.orange,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 22,
    overflow: "hidden",
    shadowColor: COLORS.brick,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },

  bannerCircleLarge: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -60,
    top: -70,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  bannerCircleSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    left: -35,
    bottom: -40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  bannerWatermark: {
    position: "absolute",
    right: 12,
    top: 18,
  },

  bannerTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },

  bannerTagText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: COLORS.orange,
  },

  bannerTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    maxWidth: "80%",
  },

  bannerSubtitle: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
    color: "rgba(255,255,255,0.92)",
  },

  bannerStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statPillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
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

  bottomSpace: {
    height: 32,
  },
});