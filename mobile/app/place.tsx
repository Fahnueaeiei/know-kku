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

const MOCK_PLACES = [
  {
    placeId: "1",
    name: "Central Library",
    category: "Building",
    description: "หอสมุดกลาง มหาวิทยาลัยขอนแก่น แหล่งรวมหนังสือและพื้นที่สำหรับอ่านหนังสือ",
    image:
      "https://images.unsplash.com/photo-1568667256549-094345857637",
    favorite: true,
  },
  {
    placeId: "2",
    name: "College of Computing",
    category: "Building",
    description: "อาคารวิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585",
    favorite: false,
  },
  {
    placeId: "3",
    name: "KKU Food Court",
    category: "Restaurant",
    description: "ศูนย์อาหารภายในมหาวิทยาลัย มีร้านอาหารหลากหลายให้เลือก",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f",
    favorite: true,
  },
  {
    placeId: "4",
    name: "Class Cafe",
    category: "Cafe",
    description: "คาเฟ่สำหรับนั่งพักผ่อนและอ่านหนังสือ เหมาะสำหรับนักศึกษา",
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb",
    favorite: false,
  },
];
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
    setLoading(true);

    // จำลองข้อมูลจาก Backend
    setTimeout(() => {
      setPlaces(MOCK_PLACES);
      setLoading(false);
    }, 500);
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
    const isFavorites =
      item === "Favorites";

    const isActive =
      item === activeCategory;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.categoryChip,
          isActive && styles.categoryChipActive,
          isFavorites && styles.favoriteChip,
          isFavorites &&
            isActive &&
            styles.favoriteChipActive,
        ]}
        onPress={() =>
          setActiveCategory(item)
        }
      >
        {isFavorites ? (
          <Ionicons
            name={
              isActive
                ? "heart"
                : "heart-outline"
            }
            size={14}
            color={
              isActive
                ? "#FFFFFF"
                : COLORS.favorite
            }
          />
        ) : null}

        <Text
          style={[
            styles.categoryText,
            isActive &&
              styles.categoryTextActive,
            isFavorites &&
              !isActive &&
              styles.favoriteText,
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

          {activeCategory === "Favorites" &&
            favoriteCount > 0 && (
              <Text style={styles.favoriteCount}>
                {favoriteCount} saved
              </Text>
            )}
        </View>

        {/* ================= CATEGORY ================= */}

        <FlatList
          horizontal
          data={[
            ...categories,
            "Favorites",
          ]}
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