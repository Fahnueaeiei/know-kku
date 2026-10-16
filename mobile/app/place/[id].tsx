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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getPlace } from "../../api/api";
import {
  COLORS,
  CARD_COLORS,
  getCategoryMeta,
} from "../../constants/appTheme";

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

// รีวิวจากนักศึกษา (แสดงเป็นกระดาษโน้ต เฉพาะสถานที่ประเภท Restaurant)
type PlaceReview = {
  reviewId: string;
  author: string;
  rating: number; // 1 - 5
  text: string;
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
   COMMUNITY FEEDBACK — SETTINGS / MOCK DATA
   แสดงเฉพาะสถานที่ที่ category เป็น Restaurant
   สถานที่ประเภทอื่น (เช่น Building) ยังแสดง Places Nearby ตามเดิม
========================================================= */

// true = ร้านอาหารแสดงทั้ง Community Feedback และ Places Nearby
// false = ร้านอาหารแสดงเฉพาะ Community Feedback (แทนที่ Nearby)
const SHOW_NEARBY_FOR_RESTAURANT = false;

// จำนวนโน้ตที่แสดงก่อนกด See All
const VISIBLE_REVIEWS = 3;

const MAX_REVIEW_LENGTH = 200;

const STAR_COLOR = "#A8402F";

// สีกระดาษโน้ต + สีหมุดปัก วนตามลำดับ
const NOTE_STYLES = [
  { bg: "#FBD5E3", pin: "#B3473B" }, // ชมพู
  { bg: "#FCD9C7", pin: "#0F5C55" }, // พีช
  { bg: "#B9F0E4", pin: "#1A1A1A" }, // มิ้นต์
  { bg: "#E6DEFA", pin: "#6B4FBF" }, // ม่วง
  { bg: "#D3E8FB", pin: "#1E5C8C" }, // ฟ้า
];

const isRestaurantCategory = (category?: string | null) =>
  String(category ?? "").trim().toLowerCase() === "restaurant";

const MOCK_REVIEWS: PlaceReview[] = [
  {
    reviewId: "mock-review-1",
    author: "@NongKKU",
    rating: 5,
    text: "Pad Thai at the corner shop is 10/10! Only a long queue though.",
  },
  {
    reviewId: "mock-review-2",
    author: "Freshy Boy",
    rating: 5,
    text: "Very cheap! Good variety for lunch. Can get crowded around 12PM.",
  },
  {
    reviewId: "mock-review-3",
    author: "Jane Doe",
    rating: 5,
    text: "Love the fresh fruit smoothie stall here. Lifesaver in summer.",
  },
  {
    reviewId: "mock-review-4",
    author: "Somchai R.",
    rating: 4,
    text: "Big portions for the price. Seating fills up fast in the evening.",
  },
];

/*
  แยกฟังก์ชันรีวิวไว้ 2 ตัวนี้โดยเฉพาะ (เหมือนแนวทางของ Nearby)
  เมื่อ Backend พร้อม ให้เปลี่ยนเป็นการเรียก API
    - getPlaceReviews    → GET  /places/:id/reviews
    - submitPlaceReview  → POST /places/:id/reviews
*/
async function getPlaceReviews(
  placeId: string
): Promise<PlaceReview[]> {
  return MOCK_REVIEWS;
}

async function submitPlaceReview(
  placeId: string,
  input: { rating: number; text: string }
): Promise<PlaceReview> {
  return {
    reviewId: `local-${Date.now()}`,
    author: "You", // TODO: ใช้ username ของผู้ใช้ที่ล็อกอิน
    rating: input.rating,
    text: input.text.trim(),
  };
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

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

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

type OpenStatus = { isOpen: boolean; label: string };

// สถานะ "เปิดอยู่ตอนนี้ไหม" คำนวณจากเวลาเปิด-ปิดของวันนี้
// ไม่มีข้อมูลพอ → คืน null (ไม่แสดงป้าย)
const getOpenStatus = (
  rows: WeeklyHour[],
  legacy: { open: string | null; close: string | null }
): OpenStatus | null => {
  let openTime: string | null = null;
  let closeTime: string | null = null;

  if (rows.length > 0) {
    const today = rows.find((r) => r.dayOfWeek === getTodayDow());

    if (!today) return null;

    if (today.isClosed || !today.openingTime || !today.closingTime) {
      return { isOpen: false, label: "Closed today" };
    }

    openTime = today.openingTime;
    closeTime = today.closingTime;
  } else if (legacy.open && legacy.close) {
    openTime = legacy.open;
    closeTime = legacy.close;
  } else {
    return null;
  }

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const o = toMinutes(openTime);
  const c = toMinutes(closeTime);

  // ร้านที่ปิดหลังเที่ยงคืน (ปิด <= เปิด) ก็คำนวณได้
  const isOpen =
    c > o ? nowMin >= o && nowMin < c : nowMin >= o || nowMin < c;

  if (isOpen) {
    return {
      isOpen: true,
      label: `Open now · until ${formatTime(closeTime)}`,
    };
  }

  if (c > o && nowMin < o) {
    return {
      isOpen: false,
      label: `Closed · opens ${formatTime(openTime)}`,
    };
  }

  return { isOpen: false, label: "Closed now" };
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

  // Community Feedback (เฉพาะ Restaurant)
  const [reviews, setReviews] =
    useState<PlaceReview[]>([]);

  const [showAllReviews, setShowAllReviews] =
    useState(false);

  const [reviewModalVisible, setReviewModalVisible] =
    useState(false);

  /* =======================================================
     LOAD PLACE DETAIL
  ======================================================= */

  useEffect(() => {
    const loadPlaceDetail = async () => {
      try {
        setLoading(true);
        const data = await getPlace(id);

        const restaurant = isRestaurantCategory(data.category);

        // Building ฯลฯ → Nearby ตามเดิม / Restaurant → ข้ามถ้าไม่ได้เปิดใช้
        const nearbyPlaces =
          !restaurant || SHOW_NEARBY_FOR_RESTAURANT
            ? await getNearbyPlaces(String(data.placeId))
            : [];

        // รีวิวโหลดไม่สำเร็จ ไม่ควรทำให้ทั้งหน้าพัง
        const placeReviews = restaurant
          ? await getPlaceReviews(String(data.placeId)).catch(() => [])
          : [];

        setReviews(placeReviews);
        setShowAllReviews(false);

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
     SUBMIT REVIEW
     สำเร็จ → เพิ่มโน้ตใหม่ไว้ใบแรก แล้วปิด modal
     ล้มเหลว → throw ต่อให้ modal แจ้งผู้ใช้
  ======================================================= */

  const handleSubmitReview = async (input: {
    rating: number;
    text: string;
  }) => {
    if (!place) return;

    const created = await submitPlaceReview(place.placeId, input);

    setReviews((prev) => [created, ...prev]);
    setReviewModalVisible(false);
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
        <View style={styles.errorIcon}>
          <Ionicons
            name="location-outline"
            size={30}
            color={COLORS.brick}
          />
        </View>

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
     คำนวณก่อน render
  ======================================================= */

  const hourGroups = groupWeeklyHours(place.weeklyHours);
  const todayDow = getTodayDow();

  const hasLegacyHours =
    !!place.openingHours.open && !!place.openingHours.close;

  const openStatus = getOpenStatus(
    place.weeklyHours,
    place.openingHours
  );

  const categoryMeta = getCategoryMeta(place.category);

  const isRestaurant = isRestaurantCategory(place.category);

  const showNearby = !isRestaurant || SHOW_NEARBY_FOR_RESTAURANT;

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
            HERO IMAGE + BACK BUTTON
        ================================================= */}

        <View style={styles.hero}>
          <Image
            source={place.image}
            style={styles.heroImage}
          />

          <View style={styles.heroShade} />
          <View style={styles.heroShadeBottom} />

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.heroBack}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={COLORS.ink}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>

          {/* ===============================================
              MAIN PLACE CARD (ซ้อนทับขอบล่างของรูป)
          =============================================== */}

          <View style={styles.mainCard}>

            {/* CATEGORY + OPEN STATUS */}

            <View style={styles.chipRow}>
              <View style={styles.categoryChip}>
                <Ionicons
                  name={categoryMeta.icon}
                  size={13}
                  color={categoryMeta.color}
                />

                <Text
                  style={[
                    styles.categoryChipText,
                    { color: categoryMeta.color },
                  ]}
                >
                  {place.category}
                </Text>
              </View>

              {!!openStatus && (
                <View
                  style={[
                    styles.statusChip,
                    openStatus.isOpen
                      ? styles.statusOpen
                      : styles.statusClosed,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: openStatus.isOpen
                          ? COLORS.green
                          : COLORS.overdue,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: openStatus.isOpen
                          ? "#2E7D4A"
                          : COLORS.overdue,
                      },
                    ]}
                  >
                    {openStatus.label}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.placeName}>
              {place.name}
            </Text>

            {/* OPENING HOURS (รายวัน) */}

            {hourGroups.length > 0 ? (
              <View style={styles.hoursPanel}>
                <View style={styles.panelHead}>
                  <View style={styles.panelIcon}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={COLORS.brick}
                    />
                  </View>

                  <Text style={styles.panelTitle}>
                    Opening Hours
                  </Text>
                </View>

                {hourGroups.map((g) => {
                  const isToday =
                    todayDow >= g.startDay &&
                    todayDow <= g.endDay;

                  return (
                    <View
                      key={`${g.startDay}-${g.endDay}`}
                      style={[
                        styles.hoursRow,
                        isToday && styles.hoursRowToday,
                      ]}
                    >
                      <View style={styles.hoursDayWrap}>
                        <Text
                          style={[
                            styles.hoursDay,
                            isToday && styles.hoursToday,
                          ]}
                        >
                          {formatDayRange(g)}
                        </Text>

                        {isToday && (
                          <View style={styles.todayTag}>
                            <Text style={styles.todayTagText}>
                              TODAY
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.hoursTime,
                          isToday && styles.hoursToday,
                          g.closed && styles.hoursClosed,
                        ]}
                      >
                        {g.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : hasLegacyHours ? (
              // fallback: ยังไม่มีข้อมูลรายวัน ใช้ค่าเดิม
              <View style={styles.hoursPanel}>
                <View style={styles.panelHead}>
                  <View style={styles.panelIcon}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={COLORS.brick}
                    />
                  </View>

                  <Text style={styles.panelTitle}>
                    Opening Hours
                  </Text>
                </View>

                <View style={styles.hoursRow}>
                  <Text style={styles.hoursDay}>
                    Every day
                  </Text>

                  <Text style={styles.hoursTime}>
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
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={styles.directionText}
              >
                Get Directions
              </Text>

              <Ionicons
                name="arrow-forward"
                size={15}
                color="#FFFFFF"
              />

            </TouchableOpacity>

          </View>

          {/* ===============================================
              SHUTTLE BUS
          =============================================== */}

          <SectionHeader
            icon="bus-outline"
            title="Shuttle Bus"
            subtitle="Lines that stop near here"
          />

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
                      styles.routeBadge,
                      { backgroundColor: route.color + "22" },
                    ]}
                  >
                    <Ionicons
                      name="bus"
                      size={17}
                      color={route.color}
                    />
                  </View>

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

          {/* ===============================================
              COMMUNITY FEEDBACK
              แสดงเฉพาะสถานที่ประเภท Restaurant
          =============================================== */}

          {isRestaurant && (
            <CommunityFeedback
              reviews={reviews}
              expanded={showAllReviews}
              onToggleExpanded={() =>
                setShowAllReviews((v) => !v)
              }
              onAddReview={() =>
                setReviewModalVisible(true)
              }
            />
          )}

          {/* ===============================================
              PLACES NEARBY
              สถานที่ประเภทอื่น (เช่น Building) แสดงตามเดิม
          =============================================== */}

          {showNearby && (
            <>
              <SectionHeader
                icon="map-outline"
                title="Places Nearby"
                subtitle="Explore places around here"
                actionLabel="Map"
                onAction={openGoogleMaps}
              />

              {/* NEARBY LIST */}

              <View style={styles.nearbyList}>
                {place.nearbyPlaces.map((nearby, index) => (
                  <NearbyPlaceCard
                    key={nearby.placeId}
                    place={nearby}
                    index={index}
                    onPress={() => openNearbyPlace(nearby)}
                  />
                ))}
              </View>
            </>
          )}

        </View>

        <View style={styles.bottomSpace} />

      </ScrollView>

      {/* =================================================
          ADD REVIEW MODAL
      ================================================= */}

      {isRestaurant && (
        <ReviewModal
          visible={reviewModalVisible}
          placeName={place.name}
          onClose={() => setReviewModalVisible(false)}
          onSubmit={handleSubmitReview}
        />
      )}

    </View>
  );
}

/* =======================================================
   SECTION HEADER — หัวข้อหน้าตาเดียวกันทุกส่วน
======================================================= */

function SectionHeader({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons
          name={icon}
          size={19}
          color={COLORS.brick}
        />
      </View>

      <View style={styles.sectionTextWrap}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        {!!subtitle && (
          <Text style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>

      {!!actionLabel && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAction}
        >
          <Text style={styles.sectionAction}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* =======================================================
   NEARBY PLACE CARD
======================================================= */

function NearbyPlaceCard({
  place,
  index,
  onPress,
}: {
  place: NearbyPlace;
  index: number;
  onPress: () => void;
}) {
  const meta = getCategoryMeta(place.category);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.nearbyCard,
        {
          backgroundColor:
            CARD_COLORS[index % CARD_COLORS.length],
        },
      ]}
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
            color={COLORS.inkSoft}
          />
        </View>

        {/* CATEGORY */}
        <View style={styles.nearbyCategory}>
          <Ionicons
            name={meta.icon}
            size={12}
            color={meta.color}
          />

          <Text
            style={[
              styles.nearbyCategoryText,
              { color: meta.color },
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

/* =======================================================
   COMMUNITY FEEDBACK
   สรุปคะแนนเฉลี่ย + กระดาษโน้ตปักบอร์ด 2 คอลัมน์ + การ์ด "Add your review"
   (แบ่งคอลัมน์แบบสลับซ้าย-ขวา ความสูงโน้ตแต่ละใบจึงไม่ต้องเท่ากัน)
======================================================= */

function CommunityFeedback({
  reviews,
  expanded,
  onToggleExpanded,
  onAddReview,
}: {
  reviews: PlaceReview[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onAddReview: () => void;
}) {
  const visible = expanded
    ? reviews
    : reviews.slice(0, VISIBLE_REVIEWS);

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) /
        reviews.length
      : 0;

  // โน้ตทั้งหมด + การ์ดเพิ่มรีวิวเป็นใบสุดท้ายเสมอ
  const tiles = [
    ...visible.map((review, index) => ({
      kind: "review",
      review,
      index,
    })),
    { kind: "add" },
  ];

  const leftColumn = tiles.filter((_, i) => i % 2 === 0);
  const rightColumn = tiles.filter((_, i) => i % 2 === 1);

  const renderTile = (tile) =>
    tile.kind === "add" ? (
      <AddReviewCard key="add-review" onPress={onAddReview} />
    ) : (
      <ReviewNote
        key={tile.review.reviewId}
        review={tile.review}
        index={tile.index}
      />
    );

  return (
    <View style={styles.feedbackSection}>
      <SectionHeader
        icon="chatbubbles-outline"
        title="Community Feedback"
        subtitle="Notes from KKU students"
        actionLabel={
          reviews.length > VISIBLE_REVIEWS
            ? expanded
              ? "Show less"
              : "See All"
            : undefined
        }
        onAction={onToggleExpanded}
      />

      {reviews.length > 0 ? (
        <View style={styles.ratingPanel}>
          <View style={styles.ratingLeft}>
            <Text style={styles.ratingBig}>
              {average.toFixed(1)}
            </Text>

            <StarRow rating={Math.round(average)} size={16} />
          </View>

          <Text style={styles.ratingMeta}>
            {`Based on ${reviews.length} ${
              reviews.length === 1 ? "review" : "reviews"
            }`}
          </Text>
        </View>
      ) : (
        <Text style={styles.feedbackEmpty}>
          No reviews yet. Be the first to leave a note!
        </Text>
      )}

      <View style={styles.feedbackColumns}>
        <View style={styles.feedbackColumn}>
          {leftColumn.map(renderTile)}
        </View>

        <View style={styles.feedbackColumn}>
          {rightColumn.map(renderTile)}
        </View>
      </View>
    </View>
  );
}

function StarRow({
  rating,
  size = 15,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rating ? "star" : "star-outline"}
          size={size}
          color={STAR_COLOR}
        />
      ))}
    </View>
  );
}

function ReviewNote({
  review,
  index,
}: {
  review: PlaceReview;
  index: number;
}) {
  const note = NOTE_STYLES[index % NOTE_STYLES.length];

  return (
    <View style={[styles.noteCard, { backgroundColor: note.bg }]}>
      {/* หมุดปักกระดาษ */}
      <View style={[styles.notePin, { backgroundColor: note.pin }]} />

      <StarRow rating={review.rating} />

      <Text style={styles.noteText}>
        {`"${review.text}"`}
      </Text>

      <Text style={styles.noteAuthor} numberOfLines={1}>
        {`- ${review.author}`}
      </Text>
    </View>
  );
}

function AddReviewCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.addReviewCard}
      onPress={onPress}
    >
      <Ionicons
        name="paper-plane-outline"
        size={15}
        color={COLORS.inkSoft}
        style={styles.addReviewSend}
      />

      <View style={styles.addReviewCircle}>
        <Ionicons
          name="add"
          size={22}
          color={COLORS.brick}
        />
      </View>

      <Text style={styles.addReviewText}>
        Add your review
      </Text>
    </TouchableOpacity>
  );
}

/* =======================================================
   REVIEW MODAL — เลือกดาว + เขียนโน้ตสั้น ๆ
======================================================= */

function ReviewModal({
  visible,
  placeName,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  placeName: string;
  onClose: () => void;
  onSubmit: (input: { rating: number; text: string }) => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ปิดแล้วเคลียร์ฟอร์ม กันข้อมูลค้างไปตอนเปิดครั้งถัดไป
  useEffect(() => {
    if (!visible) {
      setRating(0);
      setText("");
    }
  }, [visible]);

  const submit = async () => {
    if (rating < 1 || !text.trim()) {
      Alert.alert(
        "Missing info",
        "Please choose a star rating and write a short note."
      );
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({ rating, text });
    } catch {
      Alert.alert("Couldn't post", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.reviewOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* แตะพื้นหลังเพื่อปิด */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <View style={styles.reviewModalCard}>
          <TouchableOpacity
            style={styles.reviewClose}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={COLORS.inkSoft} />
          </TouchableOpacity>

          <Text style={styles.reviewModalTitle}>
            Add your review
          </Text>

          <Text style={styles.reviewModalSubtitle} numberOfLines={1}>
            {placeName}
          </Text>

          {/* STAR PICKER */}
          <View style={styles.starPicker}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                onPress={() => setRating(n)}
              >
                <Ionicons
                  name={n <= rating ? "star" : "star-outline"}
                  size={34}
                  color={STAR_COLOR}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a short note about this place..."
            placeholderTextColor="#A9A29E"
            style={styles.reviewInput}
            multiline
            maxLength={MAX_REVIEW_LENGTH}
          />

          <Text style={styles.reviewCounter}>
            {text.length}/{MAX_REVIEW_LENGTH}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.reviewSubmit, submitting && { opacity: 0.6 }]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.reviewSubmitText}>
                Post note
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingBottom: 24,
  },

  body: {
    paddingHorizontal: 16,
  },

  /* =======================================================
     HERO
  ======================================================= */

  hero: {
    width: "100%",
    height: 250,
    backgroundColor: COLORS.skeleton,
  },

  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,26,26,0.14)",
  },

  heroShadeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "45%",
    backgroundColor: "rgba(40,14,4,0.22)",
  },

  heroBack: {
    position: "absolute",
    top: 12,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  /* =======================================================
     MAIN CARD
  ======================================================= */

  mainCard: {
    marginTop: -38,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.brick,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },

  categoryChipText: {
    fontSize: 12,
    fontWeight: "800",
  },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },

  statusOpen: {
    backgroundColor: "#E4F4EA",
  },

  statusClosed: {
    backgroundColor: "#FDECEC",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  placeName: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "800",
    color: COLORS.ink,
    marginBottom: 14,
  },

  /* =======================================================
     OPENING HOURS (รายวัน)
  ======================================================= */

  hoursPanel: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
  },

  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  panelIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  panelTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.ink,
  },

  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  // ไฮไลต์แถวของวันนี้
  hoursRowToday: {
    backgroundColor: COLORS.white,
  },

  hoursDayWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  hoursDay: {
    fontSize: 13,
    color: COLORS.inkSoft,
    fontWeight: "600",
  },

  hoursTime: {
    fontSize: 13,
    color: COLORS.ink,
    fontWeight: "700",
  },

  hoursClosed: {
    color: COLORS.overdue,
  },

  hoursToday: {
    color: COLORS.brick,
    fontWeight: "800",
  },

  todayTag: {
    backgroundColor: COLORS.brick,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },

  todayTagText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.inkSoft,
    marginBottom: 18,
  },

  /* =======================================================
     DIRECTIONS
  ======================================================= */

  directionButton: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: COLORS.brick,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  directionText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "800",
  },

  /* =======================================================
     SECTION HEADER
  ======================================================= */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  sectionTextWrap: {
    flex: 1,
    paddingRight: 8,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.ink,
  },

  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.inkSoft,
    marginTop: 1,
  },

  sectionAction: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.orange,
    paddingVertical: 8,
    paddingLeft: 12,
  },

  /* =======================================================
     SHUTTLE CARD
  ======================================================= */

  shuttleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 28,
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
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
  },

  routeDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  routeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  routeInfo: {
    flex: 1,
  },

  routeName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.ink,
  },

  routeSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textLight,
    marginTop: 2,
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

  nearbyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    paddingBottom: 12,
  },

  nearbyCard: {
    width: "48.5%",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#AFA7A2",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 2,
  },

  nearbyImage: {
    width: "100%",
    height: 115,
    resizeMode: "cover",
    backgroundColor: COLORS.skeleton,
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
    fontWeight: "800",
    color: COLORS.ink,
    marginRight: 4,
  },

  nearbyCategory: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.78)",
    gap: 5,
  },

  nearbyCategoryText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },

  /* =======================================================
     COMMUNITY FEEDBACK
  ======================================================= */

  feedbackSection: {
    marginBottom: 8,
  },

  ratingPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },

  ratingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  ratingBig: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.ink,
  },

  ratingMeta: {
    fontSize: 12,
    color: COLORS.inkSoft,
  },

  feedbackEmpty: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSoft,
    marginBottom: 12,
  },

  feedbackColumns: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  feedbackColumn: {
    flex: 1,
    gap: 12,
  },

  /* กระดาษโน้ต */

  noteCard: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 12,
    shadowColor: "#AFA7A2",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 2,
  },

  notePin: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  starRow: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 8,
  },

  noteText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: COLORS.ink,
  },

  noteAuthor: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "500",
    color: COLORS.inkSoft,
    marginTop: 10,
  },

  /* การ์ดเพิ่มรีวิว */

  addReviewCard: {
    minHeight: 150,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#F2B8A6",
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  addReviewSend: {
    position: "absolute",
    top: 10,
    right: 10,
  },

  addReviewCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  addReviewText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.ink,
  },

  /* modal เพิ่มรีวิว */

  reviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(26,26,26,0.4)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  reviewModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
  },

  reviewClose: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3EFEC",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  reviewModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.ink,
  },

  reviewModalSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 3,
    marginBottom: 16,
    paddingRight: 40,
  },

  starPicker: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },

  reviewInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: "#EAE3DF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink,
    textAlignVertical: "top",
  },

  reviewCounter: {
    alignSelf: "flex-end",
    fontSize: 11.5,
    color: COLORS.textLight,
    marginTop: 6,
    marginBottom: 14,
  },

  reviewSubmit: {
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brick,
    alignItems: "center",
    justifyContent: "center",
  },

  reviewSubmitText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
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

  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  errorTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: COLORS.ink,
    marginTop: 12,
    textAlign: "center",
  },

  backButton: {
    marginTop: 15,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: COLORS.brick,
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
