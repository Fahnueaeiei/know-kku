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
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getPlaces } from "../api/api";
import PlaceCard from "../components/PlaceCard";

/* =========================================================
   TYPES
========================================================= */

type Place = {
  placeId: string | number;
  name: string;
  category: string;
  description?: string;
  image?: string;
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
   PLACE SCREEN
========================================================= */

export default function PlaceScreen() {
  const router = useRouter();

  /* =======================================================
     STATE
  ======================================================= */

  const [places, setPlaces] = useState<Place[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [activeCategory, setActiveCategory] = useState("All");

  /* =======================================================
     FETCH PLACES
     -----------------------------------------------
     Backend-ready:
     ภายหลังเปลี่ยน URL เป็น API จริงได้ทันที
  ======================================================= */

  useEffect(() => {
  const loadPlaces = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPlaces();

      setPlaces(
        data.map((place) => ({
          ...place,
          image: place.imageUrl
            ? { uri: place.imageUrl }
            : undefined,
        }))
      );
    } catch (error) {
      console.error("Failed to load places:", error);
      setError("Unable to load places.");
    } finally {
      setLoading(false);
    }
  };

  loadPlaces();
}, []);

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

  /* =======================================================
     FILTER PLACES
  ======================================================= */

  const filteredPlaces = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return places.filter((place) => {
      /* -------------------------
         CATEGORY
      ------------------------- */

      let matchesCategory = true;

      if (activeCategory === "Favorites") {
        matchesCategory = place.favorite === true;
      } else if (activeCategory !== "All") {
        matchesCategory =
          place.category?.toLowerCase() ===
          activeCategory.toLowerCase();
      }

      /* -------------------------
         SEARCH
      ------------------------- */

      const matchesSearch =
        !keyword ||
        place.name?.toLowerCase().includes(keyword) ||
        place.description?.toLowerCase().includes(keyword) ||
        place.category?.toLowerCase().includes(keyword);

      return matchesCategory && matchesSearch;
    });
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
        <Text
          style={[
            styles.categoryText,
            isActive &&
            styles.categoryTextActive,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  /* =======================================================
     HEADER
  ======================================================= */

  const ListHeader = () => {
    return (
      <View>

        {/* ================= SEARCH ================= */}

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={14}
            color="#77716D"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholder="Search buildings, cafes or loops..."
            placeholderTextColor="#99928E"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {/* ================= CATEGORY HEADER ================= */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Categories
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.favoriteIconButton,
              activeCategory === "Favorites" &&
              styles.favoriteIconButtonActive,
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
              size={18}
              color={COLORS.favorite}
            />
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

          <Text style={styles.resultCount}>
            {filteredPlaces.length} places
          </Text>
        </View>

      </View>
    );
  };

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

        ListHeaderComponent={
          <ListHeader />
        }

        renderItem={({ item }) => (
          <PlaceCard
            place={item}
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
            <View style={styles.emptyContainer}>
              <Ionicons
                name="cloud-offline-outline"
                size={28}
                color="#B8B0AC"
              />

              <Text style={styles.emptyText}>
                {error}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={
                  activeCategory ===
                    "Favorites"
                    ? "heart-outline"
                    : "search-outline"
                }
                size={30}
                color="#C8C0BC"
              />

              <Text style={styles.emptyText}>
                {activeCategory ===
                  "Favorites"
                  ? "No favorite places yet."
                  : "No places found."}
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

  /* ================= SECTION ================= */

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

  favoriteCount: {
    fontSize: 9,
    fontWeight: "500",
    color: COLORS.textLight,
  },

  /* ================= CATEGORIES ================= */

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
    backgroundColor: "#FFF5F5",
  },

  favoriteChipActive: {
    backgroundColor:
      COLORS.favorite,
    borderColor:
      COLORS.favorite,
  },

  favoriteText: {
    color: COLORS.favorite,
  },
  favoriteIconButton: {
    width: 30,
    height: 30,

    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFF1F2",
  },

  favoriteIconButtonActive: {
    backgroundColor: "#FFE3E5",
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
    color: COLORS.textLight,
  },

  /* ================= EMPTY ================= */

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",

    paddingTop: 45,
    paddingBottom: 30,
  },

  emptyText: {
    marginTop: 10,

    fontSize: 9,

    color: COLORS.textLight,

    textAlign: "center",
  },

  /* ================= BOTTOM ================= */

  bottomSpace: {
    height: 15,
  },
});
