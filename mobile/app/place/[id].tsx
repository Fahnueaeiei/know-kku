// @ts-nocheck

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getPlace, getPlaces } from "../../api/api";

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
  favorite: "#E63946",

  green: "#55A76A",
  blue: "#4BA6D8",
};

/* =========================================================
   TYPES
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

// 1 แถวต่อ 1 วัน (มาจากตาราง places_opening_hours)
type WeeklyHour = {
  dayOfWeek: number; // 1 = Mon ... 7 = Sun
  openingTime: string | null;
  closingTime: string | null;
  isClosed: boolean;
};

type PlaceDetail = {
  placeId: string;
  name: string;
  category: string;
  image: any;

  description: string;

  // เวลาเปิด-ปิดแยกตามวัน
  weeklyHours: WeeklyHour[];

  // legacy: ใช้เป็น fallback ถ้ายังไม่มีข้อมูลรายวัน
  openingHours: {
    open: string | null;
    close: string | null;
  };

  latitude: number;
  longitude: number;

  shuttleRoutes: ShuttleRoute[];

  nearbyPlaces: NearbyPlace[];
};


/* =========================================================
   NEARBY MOCK DATA
   เปลี่ยนเป็นข้อมูลจาก Backend ได้ภายหลัง
========================================================= */

const MOCK_NEARBY_PLACES: NearbyPlace[] = [
  {
    placeId: "mock-nearby-1",
    name: "University Library",
    category: "Library",
    distance: "300 m",
    image: {
      uri: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600",
    },
  },
  {
    placeId: "mock-nearby-2",
    name: "Campus Cafe",
    category: "Cafe",
    distance: "450 m",
    image: {
      uri: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600",
    },
  },
  {
    placeId: "mock-nearby-3",
    name: "Campus Restaurant",
    category: "Restaurant",
    distance: "600 m",
    image: {
      uri: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
    },
  },
  {
    placeId: "mock-nearby-4",
    name: "Study Space",
    category: "Study Space",
    distance: "800 m",
    image: {
      uri: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600",
    },
  },
];

/*
  แยกฟังก์ชันนี้ไว้สำหรับ Nearby โดยเฉพาะ
  เมื่อ Backend พร้อม ให้เปลี่ยนส่วน return เป็นการเรียก API
*/
async function getNearbyPlaces(
  currentPlaceId: string
): Promise<NearbyPlace[]> {
  return MOCK_NEARBY_PLACES.filter(
    (item) => item.placeId !== currentPlaceId
  );
}


/* =========================================================
   OPENING HOURS HELPERS
========================================================= */

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type HourGroup = {
  startDay: number;
  endDay: number;
  label: string; // "08:00 - 17:00" หรือ "Closed"
  closed: boolean;
};

const formatTime = (t: string | null) => (t ? t.slice(0, 5) : "");

// วันนี้เป็นวันที่เท่าไหร่ (1 = Mon ... 7 = Sun)
const getTodayDow = () => {
  const d = new Date().getDay(); // 0 = Sun
  return d === 0 ? 7 : d;
};

// รวมวันที่ติดกันและเวลาเหมือนกัน เช่น Mon - Fri 08:00 - 17:00
const groupWeeklyHours = (rows: WeeklyHour[]): HourGroup[] => {
  const sorted = [...rows].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const groups: HourGroup[] = [];

  for (const row of sorted) {
    const closed =
      row.isClosed || !row.openingTime || !row.closingTime;

    const label = closed
      ? "Closed"
      : `${formatTime(row.openingTime)} - ${formatTime(row.closingTime)}`;

    const last = groups[groups.length - 1];

    if (
      last &&
      last.label === label &&
      last.endDay === row.dayOfWeek - 1
    ) {
      last.endDay = row.dayOfWeek;
    } else {
      groups.push({
        startDay: row.dayOfWeek,
        endDay: row.dayOfWeek,
        label,
        closed,
      });
    }
  }

  return groups;
};

const formatDayRange = (g: HourGroup) => {
  if (g.startDay === 1 && g.endDay === 7) return "Every day";
  if (g.startDay === g.endDay) return DAY_NAMES[g.startDay - 1];
  return `${DAY_NAMES[g.startDay - 1]} - ${DAY_NAMES[g.endDay - 1]}`;
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
        const data = await getPlace(id);

        const nearbyPlaces = await getNearbyPlaces(
          String(data.placeId)
        );

        setPlace({
          placeId: String(data.placeId),
          name: data.name,
          category: data.category,
          description: data.description ?? "No description available.",
          image: data.imageUrl
            ? { uri: data.imageUrl }
            : { uri: "https://placehold.co/1200x800/EFF3F6/344054?text=KKU+Place" },

          // เวลาเปิด-ปิดรายวัน (backend ส่งมาใน weeklyHours)
          weeklyHours: (data.weeklyHours ?? []).map((h) => ({
            dayOfWeek: h.dayOfWeek,
            openingTime: h.openingTime ?? null,
            closingTime: h.closingTime ?? null,
            isClosed: !!h.isClosed,
          })),

          // legacy fallback
          openingHours: {
            open: data.openingHours ?? null,
            close: data.closingHours ?? null,
          },
          latitude: data.latitude === null ? Number.NaN : Number(data.latitude),
          longitude: data.longitude === null ? Number.NaN : Number(data.longitude),
          shuttleRoutes: (data.busLines ?? []).map((item) => ({
            id: String(item.busLine.busLineId),
            name: `${item.busLine.name} Line`,
            color:
              item.busLine.name === "green"
                ? "#55A76A"
                : item.busLine.name === "red"
                  ? "#E63946"
                  : item.busLine.name === "blue"
                    ? "#4BA6D8"
                    : "#F2C94C",
          })),
          nearbyPlaces: nearbyPlaces,
        });
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

    if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
      Alert.alert("Location unavailable", "This place does not have coordinates yet.");
      return;
    }

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
     OPENING HOURS (คำนวณก่อน render)
  ======================================================= */

  const hourGroups = groupWeeklyHours(place.weeklyHours);
  const todayDow = getTodayDow();

  const hasLegacyHours =
    !!place.openingHours.open && !!place.openingHours.close;

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

            {/* OPENING HOURS (รายวัน) */}

            {hourGroups.length > 0 ? (
              <View style={styles.hoursRowWrap}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={COLORS.orange}
                  />
                </View>

                <View style={styles.hoursContent}>
                  <Text style={styles.infoLabel}>
                    Opening Hours
                  </Text>

                  {hourGroups.map((g) => {
                    const isToday =
                      todayDow >= g.startDay &&
                      todayDow <= g.endDay;

                    return (
                      <View
                        key={`${g.startDay}-${g.endDay}`}
                        style={styles.hoursRow}
                      >
                        <Text
                          style={[
                            styles.hoursDay,
                            isToday && styles.hoursToday,
                          ]}
                        >
                          {formatDayRange(g)}
                        </Text>

                        <Text
                          style={[
                            styles.hoursTime,
                            g.closed && styles.hoursClosed,
                            isToday && styles.hoursToday,
                          ]}
                        >
                          {g.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : hasLegacyHours ? (
              // fallback: ยังไม่มีข้อมูลรายวัน ใช้ค่าเดิม
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
                    {place.openingHours.open.slice(0, 5)}
                    {" - "}
                    {place.openingHours.close.slice(0, 5)}
                  </Text>
                </View>
              </View>
            ) : null}

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

        <View style={styles.shuttleCard}>
          {place.shuttleRoutes.length > 0 ? (
            place.shuttleRoutes.map((route, index) => (
              <View
                key={route.id}
                style={[
                  styles.routeItem,
                  index !== place.shuttleRoutes.length - 1 &&
                  styles.routeDivider,
                ]}
              >
                <View
                  style={[
                    styles.routeDot,
                    { backgroundColor: route.color },
                  ]}
                />

                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>
                    {route.name}
                  </Text>

                  <Text style={styles.routeSubtitle}>
                    Stops near {place.name}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.textLight}
                />
              </View>
            ))
          ) : (
            <View style={styles.noBusContainer}>
              <Ionicons
                name="bus-outline"
                size={22}
                color={COLORS.textLight}
              />

              <Text style={styles.noBusText}>
                No shuttle bus passes this place
              </Text>
            </View>
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
            {place.nearbyPlaces.map((nearby) => (
              <NearbyPlaceCard
                key={nearby.placeId}
                place={nearby}
                onPress={() => openNearbyPlace(nearby)}
              />
            ))}
          </View>

        <View style={styles.bottomSpace} />

      </ScrollView>

    </View>
  );
}

/* =======================================================
   NEARBY PLACE CARD
======================================================= */

function NearbyPlaceCard({
  place,
  onPress,
}: {
  place: NearbyPlace;
  onPress: () => void;
}) {
  /* CATEGORY ICON */
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
            numberOfLines={2}
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
              { color: categoryColor },
            ]}
            numberOfLines={1}
          >
            {place.category}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  /* =======================================================
     BACK
  ======================================================= */

  topBackButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 8,
  },

  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 7,
  },

  /* =======================================================
     MAIN CARD
  ======================================================= */

  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 20,
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
    height: 210,
    position: "relative",
  },

  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  categoryBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.96)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.orange,
  },

  /* =======================================================
     MAIN CONTENT
  ======================================================= */

  mainContent: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },

  placeName: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.orangeLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "600",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    fontWeight: "600",
  },

  /* =======================================================
     OPENING HOURS (รายวัน)
  ======================================================= */

  hoursRowWrap: {
    flexDirection: "row",
    alignItems: "flex-start",

    marginBottom: 11,
  },

  hoursContent: {
    flex: 1,
  },

  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingVertical: 2,
  },

  hoursDay: {
    fontSize: 9.5,

    color: COLORS.textSecondary,

    fontWeight: "500",
  },

  hoursTime: {
    fontSize: 9.5,

    color: COLORS.text,

    fontWeight: "600",
  },

  hoursClosed: {
    color: COLORS.red,
  },

  // ไฮไลต์แถวของวันนี้
  hoursToday: {
    fontWeight: "800",
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: 18,
  },

  /* =======================================================
     DIRECTIONS
  ======================================================= */

  directionButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: COLORS.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  directionText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* =======================================================
     SECTION HEADER
  ======================================================= */

  favoriteIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1F2",
  },

  favoriteIconButtonActive: {
    backgroundColor: "#FFE3E5",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  favoriteChip: {
    borderWidth: 1,
    borderColor: "#F2C7C9",
    backgroundColor: "#FFF5F5",
  },

  favoriteChipActive: {
    backgroundColor: COLORS.favorite,
    borderColor: COLORS.favorite,
  },

  favoriteText: {
    color: COLORS.favorite,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "800",
    color: COLORS.text,
  },

  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textLight,
    marginTop: 3,
  },

  busIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },

  /* =======================================================
     SHUTTLE CARD
  ======================================================= */

  shuttleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#AFA7A2",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },

  routeItem: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
  },

  routeDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },

  routeInfo: {
    flex: 1,
  },

  routeName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  routeSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textLight,
    marginTop: 3,
  },

  noBusContainer: {
    minHeight: 90,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  noBusText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 8,
  },

  /* =======================================================
     NEARBY
  ======================================================= */

  nearbyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  mapText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.orange,
    paddingVertical: 8,
    paddingLeft: 12,
  },

  nearbyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    paddingBottom: 12,
  },

  /* =======================================================
     NEARBY CARD
  ======================================================= */

  nearbyCard: {
    width: "48.5%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  nearbyImage: {
    width: "100%",
    height: 115,
    resizeMode: "cover",
    backgroundColor: "#F3E9E1",
  },

  nearbyContent: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  nearbyTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  nearbyName: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: COLORS.text,
    marginRight: 4,
  },

  nearbyCategory: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.orangeLight,
    gap: 5,
  },

  nearbyCategoryText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },

  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 4,
  },

  distanceText: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textLight,
  },

  /* =======================================================
     LOADING
  ======================================================= */

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  loadingText: {
    fontSize: 13,
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
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },

  errorTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 8,
    textAlign: "center",
  },

  backButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: COLORS.orange,
  },

  backButtonText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* =======================================================
     BOTTOM
  ======================================================= */

  bottomSpace: {
    height: 20,
  },
});
