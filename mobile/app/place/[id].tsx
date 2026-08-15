// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

/* =========================================================
   COLORS
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

  red: "#E63946",

  green: "#55A76A",
  blue: "#4BA6D8",
};

/* =========================================================
   TYPES
   -----------------------------------------------
   โครงสร้างนี้ออกแบบให้ตรงกับ Backend ได้ง่าย
========================================================= */

type NearbyPlace = {
  placeId: string;
  name: string;
  category: string;
  distance: string;
  image: any;
};

type ShuttleRoute = {
  id: string;
  name: string;
  color: string;
};

type PlaceDetail = {
  placeId: string;
  name: string;
  category: string;
  image: any;

  description: string;

  openingHours: {
    open: string;
    close: string;
  };

  latitude: number;
  longitude: number;

  shuttleRoutes: ShuttleRoute[];

  nearbyPlaces: NearbyPlace[];
};

/* =========================================================
   MOCK DATA
   -----------------------------------------------
   ภายหลังสามารถเปลี่ยนเป็น API ได้
========================================================= */

const MOCK_PLACE_DETAIL: PlaceDetail = {
  placeId: "central-library",

  name: "Central Library",

  category: "Building",

  image: require("../../assets/images/central-library.jpg"),

  description:
    "The Central Library is a convenient place for students to study, borrow books, use computers and access various learning resources.",

  openingHours: {
    open: "08:00 AM",
    close: "08:00 PM",
  },

  latitude: 16.4419,
  longitude: 102.8359,

  shuttleRoutes: [
    {
      id: "blue",
      name: "Blue Line",
      color: "#4B8FD8",
    },
    {
      id: "orange",
      name: "Orange Line",
      color: "#FA7C35",
    },
  ],

  nearbyPlaces: [
    {
      placeId: "food-court",
      name: "KKU Food Court",
      category: "Restaurant",
      distance: "120 m",
      image: require("../../assets/images/food-court.jpg"),
    },

    {
      placeId: "coffee-shop",
      name: "Library Coffee",
      category: "Cafe",
      distance: "180 m",
      image: require("../../assets/images/coffee-shop.jpg"),
    },

    {
      placeId: "sc-building",
      name: "Science Building",
      category: "Building",
      distance: "350 m",
      image: require("../../assets/images/science-building.jpg"),
    },

    {
      placeId: "student-center",
      name: "Student Center",
      category: "Building",
      distance: "500 m",
      image: require("../../assets/images/student-center.jpg"),
    },
  ],
};

/* =========================================================
   PLACE DETAIL SCREEN
========================================================= */

export default function PlaceDetailScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams();

  const [place, setPlace] =
    useState<PlaceDetail | null>(null);

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     LOAD PLACE DETAIL
  ======================================================= */

  useEffect(() => {
    const loadPlaceDetail = async () => {
      try {
        setLoading(true);

        /*
          ===================================================
          BACKEND VERSION
          ===================================================

          const response = await fetch(
            `${API_URL}/places/${id}`
          );

          if (!response.ok) {
            throw new Error(
              "Failed to fetch place"
            );
          }

          const data =
            await response.json();

          setPlace(data);

          ===================================================
        */

        /*
         * MOCK DATA
         */

        await new Promise((resolve) =>
          setTimeout(resolve, 300)
        );

        setPlace(MOCK_PLACE_DETAIL);
      } catch (error) {
        console.error(
          "Failed to load place:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPlaceDetail();
    }
  }, [id]);

  /* =======================================================
     GOOGLE MAPS
  ======================================================= */

  const openGoogleMaps = () => {
    if (!place) return;

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${place.latitude},${place.longitude}`;

    Linking.openURL(url);
  };

  /* =======================================================
     NEARBY PLACE
  ======================================================= */

  const openNearbyPlace = (
    nearbyPlace: NearbyPlace
  ) => {
    router.push(
      `/place/${nearbyPlace.placeId}`
    );
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color={COLORS.orange}
        />

        <Text style={styles.loadingText}>
          Loading place...
        </Text>
      </View>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (!place) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="location-outline"
          size={35}
          color={COLORS.textLight}
        />

        <Text style={styles.errorTitle}>
          Place not found
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.topBackButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={COLORS.text}
          />

          <Text style={styles.backText}>
            Back
          </Text>
        </TouchableOpacity>

        {/* =================================================
            MAIN PLACE CARD
        ================================================= */}

        <View style={styles.mainCard}>

          {/* IMAGE */}

          <View style={styles.imageContainer}>

            <Image
              source={place.image}
              style={styles.mainImage}
            />

            {/* CATEGORY */}

            <View style={styles.categoryBadge}>

              <Ionicons
                name="business-outline"
                size={12}
                color={COLORS.orange}
              />

              <Text
                style={styles.categoryText}
              >
                {place.category}
              </Text>

            </View>

          </View>

          {/* CONTENT */}

          <View style={styles.mainContent}>

            <Text style={styles.placeName}>
              {place.name}
            </Text>

            {/* OPENING HOURS */}

            <View style={styles.infoRow}>

              <View style={styles.infoIcon}>
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={COLORS.orange}
                />
              </View>

              <View>
                <Text style={styles.infoLabel}>
                  Opening Hours
                </Text>

                <Text style={styles.infoValue}>
                  {place.openingHours.open}
                  {" - "}
                  {place.openingHours.close}
                </Text>
              </View>

            </View>

            {/* DESCRIPTION */}

            <Text
              style={styles.description}
            >
              {place.description}
            </Text>

            {/* DIRECTIONS */}

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.directionButton}
              onPress={openGoogleMaps}
            >

              <Ionicons
                name="navigate-outline"
                size={17}
                color="#FFFFFF"
              />

              <Text
                style={styles.directionText}
              >
                Get Directions
              </Text>

              <Ionicons
                name="arrow-forward"
                size={14}
                color="#FFFFFF"
              />

            </TouchableOpacity>

          </View>

        </View>

        {/* =================================================
            SHUTTLE BUS
        ================================================= */}

        <View style={styles.sectionHeader}>

          <View>
            <Text style={styles.sectionTitle}>
              Shuttle Bus Info
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Shuttle routes passing nearby
            </Text>
          </View>

          <View style={styles.busIcon}>
            <Ionicons
              name="bus-outline"
              size={18}
              color={COLORS.orange}
            />
          </View>

        </View>

        <View style={styles.shuttleCard}>

          {place.shuttleRoutes.map(
            (route, index) => (
              <View
                key={route.id}
                style={[
                  styles.routeItem,

                  index !==
                    place.shuttleRoutes
                      .length -
                      1 &&
                    styles.routeDivider,
                ]}
              >

                <View
                  style={[
                    styles.routeDot,
                    {
                      backgroundColor:
                        route.color,
                    },
                  ]}
                />

                <View
                  style={styles.routeInfo}
                >
                  <Text
                    style={styles.routeName}
                  >
                    {route.name}
                  </Text>

                  <Text
                    style={styles.routeSubtitle}
                  >
                    Stops near {place.name}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.textLight}
                />

              </View>
            )
          )}

        </View>

        {/* =================================================
            PLACES NEARBY
        ================================================= */}

        <View style={styles.nearbyHeader}>

          <View>
            <Text style={styles.sectionTitle}>
              Places Nearby
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Explore places around here
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openGoogleMaps}
          >
            <Text style={styles.mapText}>
              Map
            </Text>
          </TouchableOpacity>

        </View>

        {/* NEARBY LIST */}

        <View style={styles.nearbyList}>

          {place.nearbyPlaces.map(
            (nearby) => (
              <NearbyPlaceCard
                key={nearby.placeId}
                place={nearby}
                onPress={() =>
                  openNearbyPlace(
                    nearby
                  )
                }
              />
            )
          )}

        </View>

        <View style={styles.bottomSpace} />

      </ScrollView>

    </View>
  );
}

/* =========================================================
   NEARBY PLACE CARD
========================================================= */

function NearbyPlaceCard({
  place,
  onPress,
}: {
  place: NearbyPlace;
  onPress: () => void;
}) {
  /* =======================================================
     CATEGORY ICON
  ======================================================= */

  const categoryIcon =
    place.category === "Restaurant"
      ? "restaurant-outline"
      : place.category === "Cafe"
        ? "cafe-outline"
        : "business-outline";

  const categoryColor =
    place.category === "Restaurant"
      ? COLORS.red
      : place.category === "Cafe"
        ? COLORS.orange
        : COLORS.blue;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.nearbyCard}
      onPress={onPress}
    >

      {/* IMAGE */}

      <Image
        source={place.image}
        style={styles.nearbyImage}
      />

      {/* CONTENT */}

      <View style={styles.nearbyContent}>

        <View style={styles.nearbyTitleRow}>

          <Text
            style={styles.nearbyName}
            numberOfLines={1}
          >
            {place.name}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={15}
            color={COLORS.textLight}
          />

        </View>

        {/* CATEGORY */}

        <View style={styles.nearbyCategory}>

          <Ionicons
            name={categoryIcon}
            size={12}
            color={categoryColor}
          />

          <Text
            style={[
              styles.nearbyCategoryText,
              {
                color: categoryColor,
              },
            ]}
          >
            {place.category}
          </Text>

        </View>

        {/* DISTANCE */}

        <View style={styles.distanceRow}>

          <Ionicons
            name="location-outline"
            size={11}
            color={COLORS.textLight}
          />

          <Text style={styles.distanceText}>
            {place.distance}
          </Text>

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

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 20,
  },

  /* =======================================================
     BACK
  ======================================================= */

  topBackButton: {
    flexDirection: "row",
    alignItems: "center",

    alignSelf: "flex-start",

    paddingVertical: 7,
    paddingHorizontal: 5,

    marginBottom: 7,
  },

  backText: {
    fontSize: 9.5,
    fontWeight: "600",

    color: COLORS.text,

    marginLeft: 5,
  },

  /* =======================================================
     MAIN CARD
  ======================================================= */

  mainCard: {
    backgroundColor: COLORS.white,

    borderRadius: 25,

    overflow: "hidden",

    marginBottom: 17,

    shadowColor: "#AFA7A2",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.09,
    shadowRadius: 9,

    elevation: 3,
  },

  /* =======================================================
     MAIN IMAGE
  ======================================================= */

  imageContainer: {
    width: "100%",
    height: 185,

    position: "relative",
  },

  mainImage: {
    width: "100%",
    height: "100%",

    resizeMode: "cover",
  },

  categoryBadge: {
    position: "absolute",

    left: 11,
    bottom: 11,

    height: 27,

    paddingHorizontal: 10,

    borderRadius: 14,

    backgroundColor:
      "rgba(255,255,255,0.94)",

    flexDirection: "row",
    alignItems: "center",

    gap: 4,
  },

  categoryText: {
    fontSize: 8.5,

    fontWeight: "700",

    color: COLORS.orange,
  },

  /* =======================================================
     MAIN CONTENT
  ======================================================= */

  mainContent: {
    paddingHorizontal: 13,
    paddingVertical: 14,
  },

  placeName: {
    fontSize: 18,

    fontWeight: "800",

    color: COLORS.text,

    marginBottom: 11,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 11,
  },

  infoIcon: {
    width: 29,
    height: 29,

    borderRadius: 10,

    backgroundColor:
      COLORS.orangeLight,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 8,
  },

  infoLabel: {
    fontSize: 7.5,

    color: COLORS.textLight,

    fontWeight: "600",

    marginBottom: 2,
  },

  infoValue: {
    fontSize: 9.5,

    color: COLORS.text,

    fontWeight: "600",
  },

  description: {
    fontSize: 8.5,

    lineHeight: 13,

    color: COLORS.textSecondary,

    marginBottom: 13,
  },

  /* =======================================================
     DIRECTIONS
  ======================================================= */

  directionButton: {
    height: 42,

    borderRadius: 21,

    backgroundColor: COLORS.orange,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,
  },

  directionText: {
    fontSize: 9.5,

    color: "#FFFFFF",

    fontWeight: "800",
  },

  /* =======================================================
     SECTION HEADER
  ======================================================= */

  sectionHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: 13.5,

    fontWeight: "800",

    color: COLORS.text,
  },

  sectionSubtitle: {
    fontSize: 7.5,

    color: COLORS.textLight,

    marginTop: 2,
  },

  busIcon: {
    width: 34,
    height: 34,

    borderRadius: 12,

    backgroundColor:
      COLORS.orangeLight,

    alignItems: "center",
    justifyContent: "center",
  },

  /* =======================================================
     SHUTTLE CARD
  ======================================================= */

  shuttleCard: {
    backgroundColor: COLORS.white,

    borderRadius: 20,

    paddingHorizontal: 12,

    paddingVertical: 3,

    marginBottom: 17,

    shadowColor: "#AFA7A2",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.07,

    shadowRadius: 8,

    elevation: 2,
  },

  routeItem: {
    minHeight: 55,

    flexDirection: "row",

    alignItems: "center",
  },

  routeDivider: {
    borderBottomWidth: 1,

    borderBottomColor:
      COLORS.border,
  },

  routeDot: {
    width: 12,
    height: 12,

    borderRadius: 6,

    marginRight: 10,
  },

  routeInfo: {
    flex: 1,
  },

  routeName: {
    fontSize: 9.5,

    fontWeight: "700",

    color: COLORS.text,
  },

  routeSubtitle: {
    fontSize: 7.5,

    color: COLORS.textLight,

    marginTop: 2,
  },

  /* =======================================================
     NEARBY
  ======================================================= */

  nearbyHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 9,
  },

  mapText: {
    fontSize: 8.5,

    fontWeight: "700",

    color: COLORS.orange,
  },

  nearbyList: {
    gap: 8,
  },

  /* =======================================================
     NEARBY CARD
  ======================================================= */

  nearbyCard: {
    minHeight: 73,

    backgroundColor: COLORS.white,

    borderRadius: 18,

    padding: 8,

    flexDirection: "row",

    shadowColor: "#AFA7A2",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,

    shadowRadius: 6,

    elevation: 1,
  },

  nearbyImage: {
    width: 57,
    height: 57,

    borderRadius: 14,

    resizeMode: "cover",
  },

  nearbyContent: {
    flex: 1,

    paddingLeft: 9,

    paddingVertical: 2,
  },

  nearbyTitleRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  nearbyName: {
    flex: 1,

    fontSize: 9.5,

    fontWeight: "700",

    color: COLORS.text,

    marginRight: 5,
  },

  nearbyCategory: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 5,

    gap: 4,
  },

  nearbyCategoryText: {
    fontSize: 7.5,

    fontWeight: "600",
  },

  distanceRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 5,

    gap: 3,
  },

  distanceText: {
    fontSize: 7.5,

    color: COLORS.textLight,
  },

  /* =======================================================
     LOADING
  ======================================================= */

  loadingContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      COLORS.background,
  },

  loadingText: {
    fontSize: 9,

    color: COLORS.textLight,

    marginTop: 8,
  },

  /* =======================================================
     ERROR
  ======================================================= */

  errorContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      COLORS.background,
  },

  errorTitle: {
    fontSize: 14,

    fontWeight: "700",

    color: COLORS.text,

    marginTop: 8,
  },

  backButton: {
    marginTop: 15,

    paddingHorizontal: 18,
    paddingVertical: 9,

    borderRadius: 20,

    backgroundColor:
      COLORS.orange,
  },

  backButtonText: {
    fontSize: 9,

    color: "#FFFFFF",

    fontWeight: "700",
  },

  /* =======================================================
     BOTTOM
  ======================================================= */

  bottomSpace: {
    height: 15,
  },
});