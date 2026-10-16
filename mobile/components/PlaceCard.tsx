// @ts-nocheck
// วางที่: components/PlaceCard.tsx  (แทนไฟล์เดิม)
//
// props เดิม: place, onPress(place), onToggleFavorite(place)
// props ใหม่ (ไม่บังคับ): index (ใช้เลือกสีพื้นการ์ด), variant ("featured" | "compact"), popular

import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  COLORS,
  CARD_COLORS,
  getCategoryMeta,
} from "../constants/appTheme";

type Props = {
  place: any;
  index?: number;
  variant?: "featured" | "compact";
  popular?: boolean;
  onPress: (place: any) => void;
  onToggleFavorite: (place: any) => void;
};

export default function PlaceCard({
  place,
  index = 0,
  variant = "compact",
  popular = false,
  onPress,
  onToggleFavorite,
}: Props) {
  const meta = getCategoryMeta(place.category);
  const background = CARD_COLORS[index % CARD_COLORS.length];

  const source =
    place.image ??
    (place.imageUrl ? { uri: place.imageUrl } : null);

  const description =
    place.description?.trim() || "Tap to see details";

  const favorite = place.favorite === true;

  /* ---------- ปุ่มหัวใจ ---------- */

  const renderHeart = (small = false) => (
    <TouchableOpacity
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.heartButton, small && styles.heartButtonSmall]}
      onPress={() => onToggleFavorite(place)}
      accessibilityLabel={
        favorite ? "Remove from favorites" : "Add to favorites"
      }
    >
      <Ionicons
        name={favorite ? "heart" : "heart-outline"}
        size={small ? 16 : 19}
        color={COLORS.favorite}
      />
    </TouchableOpacity>
  );

  /* ---------- ป้ายประเภท + ระยะทาง (ถ้า backend ส่ง distance มา) ---------- */

  const renderChips = () => {
  const isBuilding = String(place.category ?? "")
    .trim()
    .toLowerCase()
    .includes("building");

  return (
    <View style={styles.chipRow}>
      <View
        style={[
          styles.chip,
          isBuilding && {
            backgroundColor: "#E3F2FD",
            borderColor: "#BBDEFB",
          },
        ]}
      >
        <Ionicons
          name={meta.icon}
          size={12}
          color={meta.color}
        />
        <Text
          style={styles.chipText}
          numberOfLines={1}
        >
          {place.category}
        </Text>
      </View>

      {!!place.distance && (
        <View style={styles.chip}>
          <Ionicons
            name="walk-outline"
            size={12}
            color={COLORS.inkSoft}
          />
          <Text
            style={[styles.chipText, { color: COLORS.white }]}
          >
            {place.distance}
          </Text>
        </View>
      )}
    </View>
  );
};

  /* ---------- รูป (ไม่มีรูป → พื้นสี + ไอคอนประเภท) ---------- */

  const renderImage = (imageStyle, iconSize) =>
    source ? (
      <Image source={source} style={imageStyle} />
    ) : (
      <View style={[imageStyle, styles.imageFallback]}>
        <Ionicons
          name={meta.icon}
          size={iconSize}
          color={meta.color}
        />
      </View>
    );

  /* =======================================================
     FEATURED — การ์ดใหญ่ (ใบแรกของลิสต์)
  ======================================================= */

  if (variant === "featured") {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.featuredCard, { backgroundColor: COLORS.white }]}
        onPress={() => onPress(place)}
      >
        <View style={styles.featuredImageWrap}>
          {renderImage(styles.featuredImage, 46)}

          <View style={styles.featuredShade} />

          {popular && (
            <View style={styles.popularBadge}>
              <Ionicons name="flame" size={12} color="#FFFFFF" />
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}

          <View style={styles.featuredHeart}>{renderHeart()}</View>
        </View>

        <View style={styles.featuredBody}>
          {renderChips()}

          <Text style={styles.featuredName} numberOfLines={2}>
            {place.name}
          </Text>

          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  /* =======================================================
     COMPACT — การ์ดแถวเดียว (รูปซ้าย ข้อมูลขวา)
  ======================================================= */

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.compactCard, { backgroundColor: COLORS.white }]}
      onPress={() => onPress(place)}
    >
      {renderImage(styles.compactImage, 30)}

      <View style={styles.compactBody}>
        <View style={styles.compactTop}>
          <View style={{ flex: 1 }}>{renderChips()}</View>
          {renderHeart(true)}
        </View>

        <Text style={styles.compactName} numberOfLines={2}>
          {place.name}
        </Text>

        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  /* ---------- shared ---------- */

heartButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: COLORS.white,
  alignItems: "center",
  justifyContent: "center",
},

heartButtonSmall: {
  width: 30,
  height: 30,
  borderRadius: 15,
},

chipRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 6,
},

chip: {
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
  backgroundColor: COLORS.cream,
  borderRadius: 11,
  paddingHorizontal: 9,
  paddingVertical: 4,
  borderWidth: 1,
  borderColor: COLORS.creamBorder,
},

chipText: {
  fontSize: 11.5,
  fontWeight: "700",
  color: COLORS.back,
},

imageFallback: {
  backgroundColor: COLORS.cream,
  alignItems: "center",
  justifyContent: "center",
},

description: {
  fontSize: 12.5,
  lineHeight: 18,
  color: COLORS.inkSoft,
},

  /* ---------- featured ---------- */

  featuredCard: {
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: COLORS.brick,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },

  featuredImageWrap: {
    width: "100%",
    height: 190,
  },

  featuredImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  featuredShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "40%",
    backgroundColor: "rgba(40,14,4,0.18)",
  },

  popularBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.brick,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  popularText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  featuredHeart: {
    position: "absolute",
    top: 10,
    right: 10,
  },

  featuredBody: {
    padding: 14,
    gap: 7,
  },

  featuredName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.ink,
  },

  viewRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 5,
    marginTop: 2,
  },

  viewText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: COLORS.brick,
  },

  /* ---------- compact ---------- */

  compactCard: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 22,
    padding: 10,
    marginBottom: 12,
    gap: 12,
    shadowColor: "#AFA7A2",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 2,
  },

  compactImage: {
    width: 96,
    height: 96,
    borderRadius: 16,
    resizeMode: "cover",
  },

  compactBody: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },

  compactTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  compactName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.ink,
  },
});
