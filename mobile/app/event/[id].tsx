// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useLocalSearchParams, useRouter } from "expo-router";

import { getEventById } from "../../api/api";
import { fetchKkuEventById } from "../../api/events";
import { COLORS } from "../../constants/appTheme";

/* =========================================================
   TYPES
========================================================= */

type EventDetail = {
  eventId: string | number;
  title: string;
  category?: string | null;
  categories?: string[];
  description?: string | null;
  location?: string | null;
  eventDate?: string | null;
  dateLabel?: string | null; // กิจกรรมของ มข. ที่มาเป็นข้อความช่วงวันที่สำเร็จรูป
  timeLabel?: string | null;
  venueAddress?: string | null;
  phone?: string | null;
  mapUrl?: string | null;
  organizer?: string | null;
  cost?: string | null;
  registerUrl?: string | null;
  externalLink?: string | null;
  capacity?: number | null;
  image?: string | null;
};

/* =========================================================
   EVENT DETAIL SCREEN
   - กิจกรรมของแอป: ดึงจาก API / DB ด้วย id
   - กิจกรรมของ มข. (source=kku): แสดงข้อมูลจาก params ก่อน
     แล้วดึงข้อมูลเต็มจาก kku.ac.th มาเติม
========================================================= */

export default function EventDetailScreen() {
  const router = useRouter();

  const { id, source, title, dateLabel, venue, imageUrl, url } =
    useLocalSearchParams<Record<string, string>>();

  const isKku = source === "kku";

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD EVENT
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadEvent = async () => {
      if (!id) {
        setEvent(null);
        setError("Event ID is missing.");
        setLoading(false);
        return;
      }

      // กิจกรรมจาก kku.ac.th
      if (isKku) {
        // ข้อมูลพื้นฐานจาก params ใช้เฉพาะตอนดึงข้อมูลเต็มไม่สำเร็จ
        const basic: EventDetail = {
          eventId: String(id),
          title: title ?? "",
          category: null,
          categories: [],
          location: venue || null,
          dateLabel: dateLabel || null,
          externalLink: url || null,
          image: imageUrl || null,
          description: null,
          capacity: null,
        };

        // รอข้อมูลเต็มก่อนค่อยแสดง (id ในลิสต์มีคำนำหน้า "kku-")
        try {
          setLoading(true);
          setError("");
          setEvent(null);

          const full = await fetchKkuEventById(
            String(id).replace(/^kku-/, "")
          );

          if (!mounted) return;

          setEvent({
            eventId: String(id),
            title: full.title || title || "",
            category: null,
            categories: full.categories ?? [],
            description: full.description ?? null,
            location: full.venue ?? (venue || null),
            dateLabel: full.dateLabel || dateLabel || null,
            timeLabel: full.timeLabel ?? null,
            venueAddress: full.venueAddress ?? null,
            phone: full.phone ?? null,
            mapUrl: full.mapUrl ?? null,
            organizer: full.organizer ?? null,
            cost: full.cost ?? null,
            registerUrl: full.registerUrl ?? null,
            externalLink: full.url || url || null,
            image: imageUrl || full.imageUrl || null,
            capacity: null,
          });
        } catch (err) {
          // ถ้าดึงข้อมูลเต็มไม่ได้ ใช้ข้อมูลพื้นฐานจาก params แทน
          console.error("Failed to load full KKU event:", err);

          if (!mounted) return;

          setEvent(basic);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }

        return;
      }

      try {
        setLoading(true);
        setError("");
        setEvent(null);

        const data = await getEventById(String(id));

        if (!mounted) return;

        if (!data) {
          setEvent(null);
          setError("Event not found.");
          return;
        }

        setEvent({
          eventId: data.eventId,
          title: data.title,
          category: data.category,
          description: data.description,
          location: data.location,
          eventDate: data.eventDate,
          externalLink: data.externalLink,
          capacity: data.capacity,
          image: data.imageUrl,
        });
      } catch (err) {
        console.error("Failed to load event detail:", err);

        if (!mounted) return;

        setEvent(null);
        setError("Unable to load event.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEvent();

    return () => {
      mounted = false;
    };
  }, [id, isKku, title, dateLabel, venue, imageUrl, url]);

  /* =======================================================
     DATE / TIME
  ======================================================= */

  const formattedDate = useMemo(() => {
    if (event?.dateLabel) return event.dateLabel;

    if (!event?.eventDate) return "Date not specified";

    const date = new Date(event.eventDate);

    if (Number.isNaN(date.getTime())) return "Date not specified";

    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [event?.eventDate, event?.dateLabel]);

  const formattedTime = useMemo(() => {
    if (!event?.eventDate) return "Time not specified";

    const date = new Date(event.eventDate);

    if (Number.isNaN(date.getTime())) return "Time not specified";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [event?.eventDate]);

  /* =======================================================
     ADD TO CHECKLIST
  ======================================================= */

  const addToChecklist = () => {
    if (!event) return;

    Alert.alert(
      "Added to Checklist",
      `"${event.title}" has been added to your checklist.`
    );
  };

  /* =======================================================
     OPEN LINKS
  ======================================================= */

  const openLink = (link?: string | null) => {
    if (!link) return;

    Linking.openURL(link).catch((err) =>
      console.error("Unable to open URL:", err)
    );
  };

  const openSource = () => openLink(event?.externalLink);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.orange} />

        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  /* =======================================================
     EVENT NOT FOUND / ERROR
  ======================================================= */

  if (!event) {
    const notFound = error === "Event not found.";

    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIcon}>
          <Ionicons
            name={notFound ? "calendar-outline" : "cloud-offline-outline"}
            size={30}
            color={COLORS.brick}
          />
        </View>

        <Text style={styles.errorTitle}>
          {notFound ? "Event not found" : "Unable to load event"}
        </Text>

        <Text style={styles.errorText}>
          {error || "We couldn't find this event."}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* =======================================================
     INFO ROWS
     - แถว Time: กิจกรรมของแอปแสดงเสมอ / กิจกรรม มข. แสดงเมื่อมีเวลา
     - แถวอื่น ๆ ซ่อนเมื่อไม่มีค่า
  ======================================================= */

  const infoRows = [
    {
      key: "location",
      icon: "location-outline",
      label: "Location",
      value: event.location ?? "Location not specified",
    },
    {
      key: "date",
      icon: "calendar-outline",
      label: "Date",
      value: formattedDate,
    },
  ];

  if (!event.dateLabel) {
    infoRows.push({
      key: "time",
      icon: "time-outline",
      label: "Time",
      value: formattedTime,
    });
  } else if (event.timeLabel) {
    infoRows.push({
      key: "time",
      icon: "time-outline",
      label: "Time",
      value: event.timeLabel,
    });
  }

  if (event.venueAddress) {
    infoRows.push({
      key: "address",
      icon: "map-outline",
      label: "Address",
      value: event.venueAddress,
    });
  }

  if (event.phone) {
    infoRows.push({
      key: "phone",
      icon: "call-outline",
      label: "Phone",
      value: event.phone,
    });
  }

  if (event.organizer) {
    infoRows.push({
      key: "organizer",
      icon: "business-outline",
      label: "Organizer",
      value: event.organizer,
    });
  }

  if (event.cost) {
    infoRows.push({
      key: "cost",
      icon: "pricetag-outline",
      label: "Cost",
      value: event.cost,
    });
  }

  if (event.capacity !== null && event.capacity !== undefined) {
    infoRows.push({
      key: "capacity",
      icon: "people-outline",
      label: "Capacity",
      value: `${event.capacity} people`,
    });
  }

  // ชิปหมวดหมู่: หมวดหลัก + หมวดจาก มข.
  const chips = [event.category, ...(event.categories ?? [])].filter(Boolean);

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* =================================================
            HERO IMAGE + BACK BUTTON
        ================================================= */}

        <View style={styles.hero}>
          {event.image ? (
            <>
              <Image source={{ uri: event.image }} style={styles.heroImage} />

              <View style={styles.heroShade} />
              <View style={styles.heroShadeBottom} />
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.placeholderIcon}>
                <Ionicons name="calendar" size={38} color={COLORS.orange} />
              </View>

              <Text style={styles.placeholderText}>KKU EVENT</Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.heroBack}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* ===============================================
              MAIN EVENT CARD (ซ้อนทับขอบล่างของรูป)
          =============================================== */}

          <View style={styles.mainCard}>
            {/* CATEGORY */}

            {chips.length > 0 && (
              <View style={styles.chipRow}>
                {chips.map((chip, index) => (
                  <View key={`${chip}-${index}`} style={styles.categoryChip}>
                    <Ionicons
                      name="calendar-outline"
                      size={13}
                      color={COLORS.brick}
                    />

                    <Text style={styles.categoryChipText}>{chip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* TITLE */}

            <Text style={styles.eventTitle}>{event.title}</Text>

            {/* EVENT INFORMATION */}

            <View style={styles.infoPanel}>
              <View style={styles.panelHead}>
                <View style={styles.panelIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={COLORS.brick}
                  />
                </View>

                <Text style={styles.panelTitle}>Event Information</Text>
              </View>

              {infoRows.map((row) => (
                <View key={row.key} style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name={row.icon}
                      size={17}
                      color={COLORS.brick}
                    />
                  </View>

                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{row.label}</Text>

                    <Text style={styles.infoValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* DESCRIPTION (ซ่อนเมื่อไม่มีคำอธิบาย) */}

            {event.description?.trim() ? (
              <Text style={styles.description}>{event.description}</Text>
            ) : null}

            {/* LINKS: MAP / REGISTER */}

            {(event.mapUrl || event.registerUrl) && (
              <View style={styles.linkRow}>
                {!!event.mapUrl && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.linkButton}
                    onPress={() => openLink(event.mapUrl)}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={17}
                      color={COLORS.brick}
                    />

                    <Text style={styles.linkButtonText}>Open in Maps</Text>
                  </TouchableOpacity>
                )}

                {!!event.registerUrl && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.linkButton}
                    onPress={() => openLink(event.registerUrl)}
                  >
                    <Ionicons
                      name="create-outline"
                      size={17}
                      color={COLORS.brick}
                    />

                    <Text style={styles.linkButtonText}>Register</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ACTIONS */}

            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.checklistButton}
                onPress={addToChecklist}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.checklistButtonText}>Add to Checklist</Text>
              </TouchableOpacity>

              {!!event.externalLink && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.sourceButton}
                  onPress={openSource}
                  accessibilityLabel="Open source website"
                >
                  <Ionicons
                    name="open-outline"
                    size={20}
                    color={COLORS.brick}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  /* ---------- screen ---------- */

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

  /* ---------- hero ---------- */

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

  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  placeholderText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: COLORS.brick,
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

  /* ---------- main card ---------- */

  mainCard: {
    marginTop: -38,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.brick,
    shadowOffset: { width: 0, height: 6 },
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
    color: COLORS.brick,
  },

  eventTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "800",
    color: COLORS.ink,
    marginBottom: 14,
  },

  /* ---------- info panel ---------- */

  infoPanel: {
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
    marginBottom: 10,
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

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 4,
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11.5,
    color: COLORS.textLight,
    fontWeight: "600",
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink,
    fontWeight: "700",
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.inkSoft,
    marginBottom: 18,
  },

  /* ---------- links (map / register) ---------- */

  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    backgroundColor: COLORS.cream,
  },

  linkButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.brick,
  },

  /* ---------- actions ---------- */

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  checklistButton: {
    minHeight: 50,
    flex: 1,
    borderRadius: 25,
    backgroundColor: COLORS.brick,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  checklistButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  sourceButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ---------- loading ---------- */

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

  /* ---------- error ---------- */

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

  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textLight,
    marginTop: 6,
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

  /* ---------- bottom ---------- */

  bottomSpace: {
    height: 20,
  },
});