import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Linking,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { sendChatMessage } from '../api/chatApi';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type Message = {
  id: string;
  text: string;
  sender: 'bot' | 'user';
};

type ChatbotSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ChatbotSheet({
  visible,
  onClose,
}: ChatbotSheetProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text:
        'สวัสดี! 👋\nพี่ดินแดงเองครับ มีอะไรให้พี่ช่วยไหม?',
    },
  ]);

  /* =====================================================
     ANIMATION
  ===================================================== */

  const translateY = useRef(
    new Animated.Value(SCREEN_HEIGHT)
  ).current;

  const overlayOpacity = useRef(
    new Animated.Value(0)
  ).current;

  /* =====================================================
     OPEN / CLOSE
  ===================================================== */

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 25,
          stiffness: 180,
          mass: 0.8,
          useNativeDriver: true,
        }),

        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),

        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    visible,
    translateY,
    overlayOpacity,
  ]);

  /* =====================================================
     CLOSE
  ===================================================== */

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),

      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  /* =====================================================
     PAN DOWN
  ===================================================== */

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return (
          gesture.dy > 5 &&
          Math.abs(gesture.dy) >
          Math.abs(gesture.dx)
        );
      },

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 25,
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
  const renderMessageText = (
    text: string,
    isUser: boolean
  ) => {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    const parts = text.split(urlRegex);

    return (
      <Text
        style={[
          styles.messageText,
          isUser && styles.userMessageText,
        ]}
      >
        {parts.map((part, index) => {
          const isUrl = /^https?:\/\/[^\s<]+$/.test(part);

          if (isUrl) {
            // ตัดเครื่องหมาย punctuation ที่อาจติดท้าย URL
            const match = part.match(/^(.*?)([.,!?;:)\]}]*)$/);

            const url = match?.[1] ?? part;
            const trailing = match?.[2] ?? '';

            return (
              <React.Fragment key={index}>
                <Text
                  style={styles.linkText}
                  onPress={async () => {
                    try {
                      const supported = await Linking.canOpenURL(url);

                      if (supported) {
                        await Linking.openURL(url);
                      } else {
                        console.log(
                          'Cannot open URL:',
                          url
                        );
                      }
                    } catch (error) {
                      console.error(
                        'Open URL error:',
                        error
                      );
                    }
                  }}
                >
                  {url}
                </Text>

                {trailing}
              </React.Fragment>
            );
          }

          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </Text>
    );
  };

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || isLoading) {
      return;
    }

    // แสดงข้อความของผู้ใช้ก่อน
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setMessage('');
    setIsLoading(true);

    try {
      // เรียก Node.js Server
      const result = await sendChatMessage(text);

      // แสดงคำตอบจาก พี่ดินแดง
      const botMessage: Message = {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: result.answer,
      };

      setMessages((prev) => [
        ...prev,
        botMessage,
      ]);

    } catch (error) {
      console.error('Chatbot error:', error);

      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        sender: 'bot',
        text:
          'ขออภัยครับ พี่ดินแดงไม่สามารถเชื่อมต่อระบบได้ในขณะนี้ 😥\nลองใหม่อีกครั้งนะครับ',
      };

      setMessages((prev) => [
        ...prev,
        errorMessage,
      ]);

    } finally {
      setIsLoading(false);
    }
  };

  /* =====================================================
     SUGGESTION
  ===================================================== */

  const selectSuggestion = async (text: string) => {
  if (isLoading) return;

  setMessage('');

  const userMessage: Message = {
    id: Date.now().toString(),
    sender: 'user',
    text,
  };

  setMessages((prev) => [
    ...prev,
    userMessage,
  ]);

  setIsLoading(true);

  try {
    const result = await sendChatMessage(text);

    const botMessage: Message = {
      id: `${Date.now()}-bot`,
      sender: 'bot',
      text: result.answer,
    };

    setMessages((prev) => [
      ...prev,
      botMessage,
    ]);
  } catch (error) {
    console.error('Chatbot error:', error);

    const errorMessage: Message = {
      id: `${Date.now()}-error`,
      sender: 'bot',
      text:
        'ขออภัยครับ พี่ดินแดงไม่สามารถเชื่อมต่อระบบได้ในขณะนี้ 😥\nลองใหม่อีกครั้งนะครับ',
    };

    setMessages((prev) => [
      ...prev,
      errorMessage,
    ]);
  } finally {
    setIsLoading(false);
  }
};

  /* =====================================================
     RENDER
  ===================================================== */

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlayContainer}>

      {/* =================================================
          OVERLAY
      ================================================= */}

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.overlay,
          {
            opacity:
              overlayOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.42],
              }),
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
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
            transform: [
              {
                translateY,
              },
            ],
          },
        ]}
      >

        {/* =================================================
            DRAG AREA
        ================================================= */}

        <View
          {...panResponder.panHandlers}
          style={styles.dragArea}
        >
          <View style={styles.grabber} />
        </View>

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <View style={styles.headerProfile}>

            <View style={styles.avatarOuter}>
              <View style={styles.avatar}>
                <Image
                  source={require('../assets/images/dindangg.png')}
                  style={styles.avatarImage}
                />
              </View>
            </View>

            <View style={styles.headerInfo}>

              <Text style={styles.botName}>
                พี่ดินแดง
              </Text>

              <View style={styles.statusRow}>

                <View style={styles.onlineDot} />

                <Text style={styles.statusText}>
                  AI Assistant
                </Text>

              </View>

            </View>

          </View>

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

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior="padding"
          keyboardVerticalOffset={0}
        >

          <ScrollView
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >

            {/* =================================================
                WELCOME
            ================================================= */}

            <View style={styles.welcomeContainer}>

              <Text style={styles.welcomeTitle}>
                สวัสดีครับ 👋
              </Text>

              <Text style={styles.welcomeSubtitle}>
                พี่ดินแดงพร้อมช่วยเหลือคุณ
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
                  item.sender === 'user'
                    ? styles.userRow
                    : styles.botRow,
                ]}
              >

                {item.sender === 'bot' && (

                  <View style={styles.smallAvatar}>

                    <Image
                      source={require('../assets/images/dindangg.png')}
                      style={styles.smallAvatarImage}
                    />

                  </View>

                )}

                <View
                  style={[
                    styles.messageBubble,
                    item.sender === 'user'
                      ? styles.userBubble
                      : styles.botBubble,
                  ]}
                >


                  {renderMessageText(item.text, item.sender === 'user')}


                </View>

              </View>

            ))}
            {isLoading && (
              <View style={[styles.messageRow, styles.botRow]}>
                <View style={styles.smallAvatar}>
                  <Image
                    source={require('../assets/images/dindangg.png')}
                    style={styles.smallAvatarImage}
                  />
                </View>

                <View style={[styles.messageBubble, styles.botBubble]}>
                  <Text style={styles.messageText}>
                    พี่ดินแดงกำลังค้นข้อมูลให้ครับ... 🤔
                  </Text>
                </View>
              </View>
            )}

            {/* =================================================
                SUGGESTIONS
            ================================================= */}

            {!isLoading  && (

              <View style={styles.suggestions}>

                <View style={styles.suggestionHeader}>

                  <Text style={styles.suggestionTitle}>
                    ลองถามพี่ดินแดงดูสิ
                  </Text>

                  <Text style={styles.suggestionHint}>
                    เลือกคำถามที่สนใจ
                  </Text>

                </View>

                <TouchableOpacity
                  style={styles.suggestionButton}
                  onPress={() =>
                    selectSuggestion(
                      'กยศ. ส่งที่ไหน?'
                    )
                  }
                  activeOpacity={0.75}
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
                    กยศ. ส่งที่ไหน?
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color="#BBBBBB"
                  />

                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.suggestionButton}
                  onPress={() =>
                    selectSuggestion(
                      'กยศ. ต้องใช้เอกสารอะไรบ้าง?'
                    )
                  }
                  activeOpacity={0.75}
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
                    กยศ. ต้องใช้เอกสารอะไรบ้าง?
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color="#BBBBBB"
                  />

                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.suggestionButton}
                  onPress={() =>
                    selectSuggestion(
                      'กยศ. ต้องใช้จิตอาสากี่ชั่วโมง?'
                    )
                  }
                  activeOpacity={0.75}
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
                    กยศ. ต้องใช้จิตอาสากี่ชั่วโมง?
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
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

            <View style={styles.inputContainer}>

              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="ถามพี่ดินแดง..."
                placeholderTextColor="#A5A5A5"
                multiline
                scrollEnabled
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!message.trim() || isLoading) &&
                  styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!message.trim() || isLoading}
                activeOpacity={0.8}
              >

                <Ionicons
                  name="arrow-up"
                  size={20}
                  color="#FFFFFF"
                />

              </TouchableOpacity>

            </View>

            <Text style={styles.inputHint}>
              พี่ดินแดงอาจตอบคำถามผิดพลาดได้
            </Text>

          </View>

        </KeyboardAvoidingView>

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
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },

  /* =======================================================
     SHEET
  ======================================================= */

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '86%',
    backgroundColor: '#FFF9F4',

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 15,

    elevation: 25,
  },

  /* =======================================================
     GRABBER
  ======================================================= */

  dragArea: {
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  grabber: {
    width: 43,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#D8D3CE',
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    height: 67,
    paddingHorizontal: 17,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },

  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,

    backgroundColor: '#FFF0E6',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,

    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImage: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },

  headerInfo: {
    justifyContent: 'center',
  },

  botName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222222',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,

    backgroundColor: '#4CAF50',

    marginRight: 5,
  },

  statusText: {
    fontSize: 11,
    color: '#8A8A8A',
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F7F7F7',
  },

  /* =======================================================
     CHAT
  ======================================================= */

  keyboardView: {
    flex: 1,
  },

  chatContainer: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 17,
    paddingTop: 22,
    paddingBottom: 22,
  },

  /* =======================================================
     WELCOME
  ======================================================= */

  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 22,
  },

  largeAvatarShadow: {
    width: 84,
    height: 84,
    borderRadius: 42,

    backgroundColor: '#FFE4D2',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 10,
  },

  largeAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,

    backgroundColor: '#FFF0E6',

    alignItems: 'center',
    justifyContent: 'center',
  },

  largeAvatarImage: {
    width: 73,
    height: 73,
    resizeMode: 'contain',
  },

  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222222',
  },

  welcomeSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 3,
  },

  kkuBadge: {
    marginTop: 9,

    paddingHorizontal: 11,
    paddingVertical: 5,

    borderRadius: 20,

    backgroundColor: '#FFF0E6',

    flexDirection: 'row',
    alignItems: 'center',
  },

  kkuBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,

    backgroundColor: '#F26522',

    marginRight: 5,
  },

  kkuBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D95B1D',
  },

  /* =======================================================
     MESSAGE
  ======================================================= */

  messageRow: {
    flexDirection: 'row',
    marginBottom: 13,
    alignItems: 'flex-end',
  },

  botRow: {
    justifyContent: 'flex-start',
  },

  userRow: {
    justifyContent: 'flex-end',
  },

  smallAvatar: {
    width: 31,
    height: 31,
    borderRadius: 16,

    backgroundColor: '#FFF0E6',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 7,
  },

  smallAvatarImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },

  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
  },

  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,

    elevation: 1,
  },

  userBubble: {
    backgroundColor: '#F26522',
    borderBottomRightRadius: 5,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },

  userMessageText: {
    color: '#FFFFFF',
  },

  /* =======================================================
     SUGGESTIONS
  ======================================================= */

  suggestions: {
    marginTop: 5,
  },

  suggestionHeader: {
    marginBottom: 10,
  },

  suggestionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3A3938',
  },

  suggestionHint: {
    fontSize: 11,
    color: '#999999',
    marginTop: 2,
  },

  suggestionButton: {
    minHeight: 52,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#F2DED1',

    borderRadius: 15,

    paddingHorizontal: 11,

    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 9,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,

    elevation: 1,
  },

  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,

    backgroundColor: '#FFF0E6',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  suggestionText: {
    flex: 1,

    fontSize: 13,
    fontWeight: '500',

    color: '#444444',
  },

  /* =======================================================
     INPUT
  ======================================================= */

  inputArea: {
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },

  inputContainer: {
    minHeight: 49,
    maxHeight: 100,

    borderRadius: 25,

    backgroundColor: '#F5F5F5',

    flexDirection: 'row',
    alignItems: 'flex-end',

    paddingLeft: 16,
    paddingRight: 5,
    paddingVertical: 5,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#222222',
    maxHeight: 80,
    minHeight: 39,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'top',
  },

  sendButton: {
    width: 39,
    height: 39,
    borderRadius: 20,

    backgroundColor: '#F26522',

    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    backgroundColor: '#D5D5D5',
  },

  inputHint: {
    textAlign: 'center',

    fontSize: 9,
    color: '#AAAAAA',

    marginTop: 5,
  },
  linkText: {
    color: '#1976D2',
    textDecorationLine: 'underline',
  },
});