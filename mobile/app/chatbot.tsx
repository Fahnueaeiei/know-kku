import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SHEET_HEIGHT = SCREEN_HEIGHT * 0.84;

type Message = {
  id: string;
  text: string;
  sender: "bot" | "user";
};

export default function ChatbotScreen() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "สวัสดีครับ 👋\nมีอะไรให้พี่ช่วยไหมครับ?",
    },
  ]);

  /* =====================================================
     ANIMATION
  ===================================================== */

  const translateY = useRef(
    new Animated.Value(SHEET_HEIGHT)
  ).current;

  const backdropOpacity = useRef(
    new Animated.Value(0)
  ).current;

  /* =====================================================
     OPEN
  ===================================================== */

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 22,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }),

      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* =====================================================
     CLOSE
  ===================================================== */

  const closeSheet = () => {
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),

      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  /* =====================================================
     DRAG GESTURE
  ===================================================== */

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (
        _,
        gestureState
      ) => {
        return (
          gestureState.dy > 5 &&
          Math.abs(gestureState.dy) >
            Math.abs(gestureState.dx)
        );
      },

      onPanResponderMove: (
        _,
        gestureState
      ) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },

      onPanResponderRelease: (
        _,
        gestureState
      ) => {
        if (gestureState.dy > 120) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 22,
            stiffness: 180,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  const sendMessage = () => {
    const text = message.trim();

    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setMessage("");

    // TODO:
    // เชื่อม API AI Chatbot ตรงนี้
  };

  /* =====================================================
     SUGGESTION
  ===================================================== */

  const selectSuggestion = (text: string) => {
    setMessage(text);
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <View style={styles.overlayContainer}>

      {/* =================================================
          BACKDROP
      ================================================= */}

      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={closeSheet}
        />
      </Animated.View>

      {/* =================================================
          BOTTOM SHEET
      ================================================= */}

      <Animated.View
        style={[
          styles.sheet,
          {
            height: SHEET_HEIGHT,
            transform: [
              {
                translateY,
              },
            ],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>

          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
          >

            {/* =================================================
                DRAG HANDLE
            ================================================= */}

            <View
              {...panResponder.panHandlers}
              style={styles.dragArea}
            >
              <View style={styles.dragHandle} />
            </View>

            {/* =================================================
                HEADER
            ================================================= */}

            <View style={styles.header}>

              <View style={styles.headerLeft}>

                {/* AI ICON */}

                <View style={styles.aiAvatar}>
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color="#F26522"
                  />
                </View>

                {/* NAME */}

                <View>
                  <Text style={styles.botName}>
                    พี่ดินแดง
                  </Text>

                  <View style={styles.statusRow}>

                    <View
                      style={styles.onlineDot}
                    />

                    <Text
                      style={styles.statusText}
                    >
                      AI Assistant
                    </Text>

                  </View>
                </View>

              </View>

              {/* CLOSE */}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeSheet}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#555555"
                />
              </TouchableOpacity>

            </View>

            {/* =================================================
                CHAT
            ================================================= */}

            <ScrollView
              style={styles.chatContainer}
              contentContainerStyle={
                styles.chatContent
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              {/* =================================================
                  WELCOME
              ================================================= */}

              <View
                style={styles.welcomeContainer}
              >

                <View
                  style={styles.welcomeIcon}
                >
                  <Ionicons
                    name="sparkles"
                    size={22}
                    color="#F26522"
                  />
                </View>

                <Text
                  style={styles.welcomeTitle}
                >
                  สวัสดีครับ 👋
                </Text>

                <Text
                  style={styles.welcomeSubtitle}
                >
                  พี่ดินแดงพร้อมช่วยคุณค้นหา
                  {"\n"}
                  ข้อมูลภายในมหาวิทยาลัยขอนแก่น
                </Text>

              </View>

              {/* =================================================
                  MESSAGES
              ================================================= */}

              {messages.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.messageRow,
                    item.sender === "user"
                      ? styles.userRow
                      : styles.botRow,
                  ]}
                >

                  {/* BOT ICON */}

                  {item.sender === "bot" && (
                    <View
                      style={styles.botIndicator}
                    >
                      <Ionicons
                        name="sparkles"
                        size={12}
                        color="#F26522"
                      />
                    </View>
                  )}

                  {/* MESSAGE */}

                  <View
                    style={[
                      styles.messageBubble,
                      item.sender === "user"
                        ? styles.userBubble
                        : styles.botBubble,
                    ]}
                  >

                    <Text
                      style={[
                        styles.messageText,
                        item.sender === "user" &&
                          styles.userMessageText,
                      ]}
                    >
                      {item.text}
                    </Text>

                  </View>

                </View>
              ))}

              {/* =================================================
                  SUGGESTIONS
              ================================================= */}

              {messages.length === 1 && (
                <View
                  style={styles.suggestions}
                >

                  <Text
                    style={styles.suggestionTitle}
                  >
                    ลองถามพี่ดินแดง
                  </Text>

                  {/* LOCATION */}

                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() =>
                      selectSuggestion(
                        "ห้อง SC6601A อยู่ที่ไหน?"
                      )
                    }
                    activeOpacity={0.7}
                  >

                    <View
                      style={styles.suggestionIcon}
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#F26522"
                      />
                    </View>

                    <Text
                      style={styles.suggestionText}
                    >
                      ห้อง SC6601A อยู่ที่ไหน?
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#BBBBBB"
                    />

                  </TouchableOpacity>

                  {/* EVENT */}

                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() =>
                      selectSuggestion(
                        "วันนี้มีงานอะไรบ้าง?"
                      )
                    }
                    activeOpacity={0.7}
                  >

                    <View
                      style={styles.suggestionIcon}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="#F26522"
                      />
                    </View>

                    <Text
                      style={styles.suggestionText}
                    >
                      วันนี้มีงานอะไรบ้าง?
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#BBBBBB"
                    />

                  </TouchableOpacity>

                  {/* SCHOLARSHIP */}

                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() =>
                      selectSuggestion(
                        "มีทุนการศึกษาอะไรบ้าง?"
                      )
                    }
                    activeOpacity={0.7}
                  >

                    <View
                      style={styles.suggestionIcon}
                    >
                      <Ionicons
                        name="school-outline"
                        size={18}
                        color="#F26522"
                      />
                    </View>

                    <Text
                      style={styles.suggestionText}
                    >
                      มีทุนการศึกษาอะไรบ้าง?
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#BBBBBB"
                    />

                  </TouchableOpacity>

                </View>
              )}

            </ScrollView>

            {/* =================================================
                INPUT
            ================================================= */}

            <View style={styles.inputArea}>

              <View
                style={styles.inputContainer}
              >

                <TextInput
                  style={styles.input}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="ถามพี่ดินแดง..."
                  placeholderTextColor="#999999"
                  multiline
                />

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !message.trim() &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={sendMessage}
                  disabled={!message.trim()}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-up"
                    size={21}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

              </View>

            </View>

          </KeyboardAvoidingView>

        </SafeAreaView>
      </Animated.View>

    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* =======================================================
     OVERLAY
  ======================================================= */

  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  /* =======================================================
     SHEET
  ======================================================= */

  sheet: {
    width: "100%",
    backgroundColor: "#FFF9F4",

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,

    elevation: 20,
  },

  safeArea: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  /* =======================================================
     DRAG
  ======================================================= */

  dragArea: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D5D0CC",
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    height: 64,

    paddingHorizontal: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#FFFFFF",

    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  aiAvatar: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: "#FFF0E6",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 10,
  },

  botName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  onlineDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: "#4CAF50",

    marginRight: 5,
  },

  statusText: {
    fontSize: 11,
    color: "#888888",
  },

  closeButton: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: "#F5F5F5",

    justifyContent: "center",
    alignItems: "center",
  },

  /* =======================================================
     CHAT
  ======================================================= */

  chatContainer: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 18,
  },

  /* =======================================================
     WELCOME
  ======================================================= */

  welcomeContainer: {
    alignItems: "center",

    marginBottom: 24,

    paddingTop: 8,
  },

  welcomeIcon: {
    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor: "#FFF0E6",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 10,
  },

  welcomeTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222222",
  },

  welcomeSubtitle: {
    fontSize: 12,
    lineHeight: 18,

    color: "#888888",

    marginTop: 5,

    textAlign: "center",
  },

  /* =======================================================
     MESSAGE
  ======================================================= */

  messageRow: {
    flexDirection: "row",

    marginBottom: 12,

    alignItems: "flex-end",
  },

  botRow: {
    justifyContent: "flex-start",
  },

  userRow: {
    justifyContent: "flex-end",
  },

  botIndicator: {
    width: 26,
    height: 26,

    borderRadius: 13,

    backgroundColor: "#FFF0E6",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 7,

    marginBottom: 2,
  },

  messageBubble: {
    maxWidth: "82%",

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 17,
  },

  botBubble: {
    backgroundColor: "#FFFFFF",

    borderBottomLeftRadius: 5,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,

    elevation: 1,
  },

  userBubble: {
    backgroundColor: "#F26522",

    borderBottomRightRadius: 5,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 20,

    color: "#333333",
  },

  userMessageText: {
    color: "#FFFFFF",
  },

  /* =======================================================
     SUGGESTIONS
  ======================================================= */

  suggestions: {
    marginTop: 5,
  },

  suggestionTitle: {
    fontSize: 13,

    fontWeight: "700",

    color: "#555555",

    marginBottom: 9,
  },

  suggestionButton: {
    minHeight: 48,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#F1DDD0",

    borderRadius: 14,

    paddingHorizontal: 12,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 8,
  },

  suggestionIcon: {
    width: 32,
    height: 32,

    borderRadius: 16,

    backgroundColor: "#FFF4ED",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 9,
  },

  suggestionText: {
    flex: 1,

    fontSize: 13,

    color: "#444444",
  },

  /* =======================================================
     INPUT
  ======================================================= */

  inputArea: {
    paddingHorizontal: 12,

    paddingTop: 8,

    paddingBottom:
      Platform.OS === "ios"
        ? 8
        : 10,

    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  inputContainer: {
    minHeight: 48,
    maxHeight: 105,

    borderRadius: 24,

    backgroundColor: "#F5F5F5",

    flexDirection: "row",

    alignItems: "flex-end",

    paddingLeft: 16,
    paddingRight: 5,
    paddingVertical: 4,
  },

  input: {
    flex: 1,

    fontSize: 14,

    color: "#222222",

    maxHeight: 85,

    paddingTop: 8,
    paddingBottom: 8,
  },

  sendButton: {
    width: 39,
    height: 39,

    borderRadius: 20,

    backgroundColor: "#F26522",

    justifyContent: "center",
    alignItems: "center",
  },

  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
});