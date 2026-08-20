// @ts-nocheck

import React, { useMemo } from "react";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

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
};

/* =========================================================
   TYPES
========================================================= */

type EventDetail = {
  eventId: string | number;

  title: string;

  category?: string;

  description?: string;

  location?: string;

  eventDate?: string;

  externalLink?: string;

  capacity?: number;

  image?: string;
};

/* =========================================================
   MOCK EVENT DATA
   ---------------------------------------------------------
   UI ONLY
========================================================= */

const EVENTS: EventDetail[] = [
  {
    eventId: 1,

    title: "KKU Freshmen Orientation",

    category: "University",

    description:
      "กิจกรรมปฐมนิเทศนักศึกษาใหม่ เพื่อแนะนำข้อมูลที่สำคัญเกี่ยวกับมหาวิทยาลัย การใช้ชีวิตในรั้วมหาวิทยาลัย รวมถึงการทำความรู้จักกับสถานที่และบริการต่าง ๆ ภายในมหาวิทยาลัยขอนแก่น",

    location:
      "ศูนย์ประชุมและแสดงสินค้านานาชาติ ขอนแก่น",

    eventDate:
      "2026-08-20T02:00:00.000Z",

    externalLink:
      "https://kku.ac.th",

    capacity: 500,
  },
];

/* =========================================================
   EVENT DETAIL SCREEN
========================================================= */

export default function EventDetailScreen() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  console.log("DETAIL ID:", id);

  /* =======================================================
     FIND EVENT
  ======================================================= */

  const event = useMemo(() => {
    return EVENTS.find(
      (item) =>
        String(item.eventId) === String(id)
    );
  }, [id]);

  /* =======================================================
     DATE
  ======================================================= */

  const formattedDate =
    useMemo(() => {
      if (!event?.eventDate) {
        return "Date not specified";
      }

      const date =
        new Date(event.eventDate);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "Date not specified";
      }

      return date.toLocaleDateString(
        "en-GB",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    }, [event]);

  /* =======================================================
     TIME
  ======================================================= */

  const formattedTime =
    useMemo(() => {
      if (!event?.eventDate) {
        return "Time not specified";
      }

      const date =
        new Date(event.eventDate);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "Time not specified";
      }

      return date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    }, [event]);

  /* =======================================================
     SHARE
  ======================================================= */

  const shareEvent = async () => {
    if (!event) return;

    try {
      await Share.share({
        title: event.title,

        message: `
${event.title}

📅 ${formattedDate}

⏰ ${formattedTime}

📍 ${event.location ?? "Location not specified"}

${event.description ?? ""}

${event.externalLink ?? ""}
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
     EVENT NOT FOUND
  ======================================================= */

  if (!event) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <View
          style={
            styles.errorIcon
          }
        >
          <Ionicons
            name="calendar-outline"
            size={30}
            color={
              COLORS.orange
            }
          />
        </View>

        <Text
          style={
            styles.errorTitle
          }
        >
          Event not found
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          We couldn't find this event.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={
            styles.errorBackButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.errorBackText
            }
          >
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
    <View
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <TouchableOpacity
          activeOpacity={0.8}
          style={
            styles.topBackButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={
              COLORS.text
            }
          />

          <Text
            style={
              styles.backText
            }
          >
            Back
          </Text>
        </TouchableOpacity>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <View
          style={styles.mainCard}
        >

          {/* =================================================
              IMAGE
          ================================================= */}

          {event.image ? (
            <Image
              source={{
                uri: event.image,
              }}
              style={
                styles.mainImage
              }
            />
          ) : (
            <View
              style={
                styles.imagePlaceholder
              }
            >
              <View
                style={
                  styles.placeholderIcon
                }
              >
                <Ionicons
                  name="calendar"
                  size={38}
                  color={
                    COLORS.orange
                  }
                />
              </View>

              <Text
                style={
                  styles.placeholderText
                }
              >
                KKU EVENT
              </Text>
            </View>
          )}

          {/* =================================================
              CONTENT
          ================================================= */}

          <View
            style={
              styles.mainContent
            }
          >

            {/* =================================================
                CATEGORY
            ================================================= */}

            {event.category && (
              <View
                style={
                  styles.categoryBadge
                }
              >
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={
                    COLORS.orange
                  }
                />

                <Text
                  style={
                    styles.categoryText
                  }
                >
                  {event.category}
                </Text>
              </View>
            )}

            {/* =================================================
                TITLE
            ================================================= */}

            <Text
              style={
                styles.eventTitle
              }
            >
              {event.title}
            </Text>

            {/* =================================================
                EVENT INFORMATION
            ================================================= */}

            <View
              style={
                styles.infoContainer
              }
            >

              {/* LOCATION */}

              <View
                style={
                  styles.infoRow
                }
              >
                <View
                  style={
                    styles.infoIcon
                  }
                >
                  <Ionicons
                    name="location-outline"
                    size={17}
                    color={
                      COLORS.orange
                    }
                  />
                </View>

                <View
                  style={
                    styles.infoContent
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Location
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {event.location ??
                      "Location not specified"}
                  </Text>
                </View>
              </View>

              {/* DATE */}

              <View
                style={
                  styles.infoRow
                }
              >
                <View
                  style={
                    styles.infoIcon
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={
                      COLORS.orange
                    }
                  />
                </View>

                <View
                  style={
                    styles.infoContent
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Date
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {formattedDate}
                  </Text>
                </View>
              </View>

              {/* TIME */}

              <View
                style={
                  styles.infoRow
                }
              >
                <View
                  style={
                    styles.infoIcon
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={
                      COLORS.orange
                    }
                  />
                </View>

                <View
                  style={
                    styles.infoContent
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Time
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {formattedTime}
                  </Text>
                </View>
              </View>

              {/* CAPACITY */}

              {event.capacity !==
                undefined && (
                <View
                  style={
                    styles.infoRow
                  }
                >
                  <View
                    style={
                      styles.infoIcon
                    }
                  >
                    <Ionicons
                      name="people-outline"
                      size={17}
                      color={
                        COLORS.orange
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.infoContent
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Capacity
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {event.capacity}{" "}
                      people
                    </Text>
                  </View>
                </View>
              )}

            </View>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <View
              style={
                styles.descriptionSection
              }
            >
              <Text
                style={
                  styles.description
                }
              >
                {event.description ??
                  "No description available."}
              </Text>
            </View>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <View
              style={
                styles.actionRow
              }
            >

              {/* ADD TO CHECKLIST */}

              <TouchableOpacity
                activeOpacity={0.85}
                style={
                  styles.checklistButton
                }
                onPress={
                  addToChecklist
                }
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.checklistButtonText
                  }
                >
                  Add to Checklist
                </Text>
              </TouchableOpacity>

              {/* SHARE ICON */}

              <TouchableOpacity
                activeOpacity={0.75}
                style={
                  styles.shareIconButton
                }
                onPress={
                  shareEvent
                }
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={
                    COLORS.orange
                  }
                />
              </TouchableOpacity>

            </View>

          </View>
        </View>

        {/* =================================================
            BOTTOM SPACE
        ================================================= */}

        <View
          style={
            styles.bottomSpace
          }
        />

      </ScrollView>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({

    /* =====================================================
       SCREEN
    ===================================================== */

    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    scrollContent: {
      paddingHorizontal: 10,

      paddingTop: 8,

      paddingBottom: 20,
    },

    /* =====================================================
       BACK
    ===================================================== */

    topBackButton: {
      flexDirection: "row",

      alignItems: "center",

      alignSelf:
        "flex-start",

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

    /* =====================================================
       MAIN CARD
    ===================================================== */

    mainCard: {
      backgroundColor:
        COLORS.white,

      borderRadius: 25,

      overflow: "hidden",

      marginBottom: 12,

      shadowColor:
        "#AFA7A2",

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.09,

      shadowRadius: 9,

      elevation: 3,
    },

    /* =====================================================
       IMAGE
    ===================================================== */

    mainImage: {
      width: "100%",

      height: 190,

      resizeMode: "cover",
    },

    imagePlaceholder: {
      width: "100%",

      height: 190,

      backgroundColor:
        COLORS.orangeLight,

      alignItems: "center",

      justifyContent: "center",
    },

    placeholderIcon: {
      width: 70,

      height: 70,

      borderRadius: 35,

      backgroundColor:
        COLORS.white,

      alignItems: "center",

      justifyContent: "center",

      marginBottom: 8,
    },

    placeholderText: {
      fontSize: 10,

      fontWeight: "800",

      letterSpacing: 1.5,

      color:
        COLORS.orange,
    },

    /* =====================================================
       CONTENT
    ===================================================== */

    mainContent: {
      paddingHorizontal: 14,

      paddingVertical: 15,
    },

    /* =====================================================
       CATEGORY
    ===================================================== */

    categoryBadge: {
      alignSelf:
        "flex-start",

      height: 27,

      paddingHorizontal: 10,

      borderRadius: 14,

      backgroundColor:
        COLORS.orangeLight,

      flexDirection: "row",

      alignItems: "center",

      gap: 4,

      marginBottom: 9,
    },

    categoryText: {
      fontSize: 8.5,

      fontWeight: "700",

      color:
        COLORS.orange,
    },

    /* =====================================================
       TITLE
    ===================================================== */

    eventTitle: {
      fontSize: 20,

      fontWeight: "800",

      color: COLORS.text,

      lineHeight: 26,

      marginBottom: 15,
    },

    /* =====================================================
       INFO
    ===================================================== */

    infoContainer: {
      marginBottom: 2,
    },

    infoRow: {
      flexDirection: "row",

      alignItems: "center",

      marginBottom: 11,
    },

    infoIcon: {
      width: 32,

      height: 32,

      borderRadius: 10,

      backgroundColor:
        COLORS.orangeLight,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 9,
    },

    infoContent: {
      flex: 1,
    },

    infoLabel: {
      fontSize: 7.5,

      color:
        COLORS.textLight,

      fontWeight: "600",

      marginBottom: 2,
    },

    infoValue: {
      fontSize: 9.5,

      color: COLORS.text,

      fontWeight: "600",

      lineHeight: 14,
    },

    /* =====================================================
       DESCRIPTION
    ===================================================== */

    descriptionSection: {
      marginTop: 5,

      paddingTop: 12,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,
    },

    description: {
      fontSize: 8.8,

      lineHeight: 15,

      color:
        COLORS.textSecondary,
    },

    /* =====================================================
       ACTIONS
    ===================================================== */

    actionRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 10,

      marginTop: 17,
    },

    /* =====================================================
       CHECKLIST
    ===================================================== */

    checklistButton: {
      height: 43,

      flex: 1,

      borderRadius: 22,

      backgroundColor:
        COLORS.orange,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      gap: 7,
    },

    checklistButtonText: {
      fontSize: 9,

      fontWeight: "800",

      color: "#FFFFFF",
    },

    /* =====================================================
       SHARE ICON
    ===================================================== */

    shareIconButton: {
      width: 43,

      height: 43,

      alignItems: "center",

      justifyContent: "center",

      backgroundColor:
        "transparent",
    },

    /* =====================================================
       ERROR
    ===================================================== */

    errorContainer: {
      flex: 1,

      alignItems: "center",

      justifyContent: "center",

      paddingHorizontal: 30,

      backgroundColor:
        COLORS.background,
    },

    errorIcon: {
      width: 64,

      height: 64,

      borderRadius: 32,

      backgroundColor:
        COLORS.orangeLight,

      alignItems: "center",

      justifyContent: "center",

      marginBottom: 12,
    },

    errorTitle: {
      fontSize: 16,

      fontWeight: "800",

      color: COLORS.text,
    },

    errorText: {
      fontSize: 9,

      color:
        COLORS.textLight,

      marginTop: 6,

      textAlign: "center",
    },

    errorBackButton: {
      marginTop: 18,

      paddingHorizontal: 20,

      paddingVertical: 10,

      borderRadius: 20,

      backgroundColor:
        COLORS.orange,
    },

    errorBackText: {
      fontSize: 9,

      fontWeight: "700",

      color: "#FFFFFF",
    },

    /* =====================================================
       BOTTOM
    ===================================================== */

    bottomSpace: {
      height: 20,
    },
  });