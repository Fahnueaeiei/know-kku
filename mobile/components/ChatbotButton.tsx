import React, {
  useEffect,
  useRef,
} from 'react';

import {
  Image,
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Animated,
} from 'react-native';

type ChatbotButtonProps = {
  onPress: () => void;
};

export default function ChatbotButton({
  onPress,
}: ChatbotButtonProps) {
  /* =====================================================
     ANIMATION
  ===================================================== */

  const floatAnimation = useRef(
    new Animated.Value(0)
  ).current;

  /* =====================================================
     FLOATING ANIMATION
  ===================================================== */

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: -5,
          duration: 1800,
          useNativeDriver: true,
        }),

        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [floatAnimation]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <View style={styles.wrapper}>

      {/* =================================================
          MESSAGE
      ================================================= */}

      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
          มีอะไรให้พี่ช่วยไหม?
        </Text>

        <View style={styles.messageArrow} />
      </View>

      {/* =================================================
          P'DIN-DANG
      ================================================= */}

      <Animated.View
        style={{
          transform: [
            {
              translateY: floatAnimation,
            },
          ],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={styles.button}
        >
          <Image
            source={require('../assets/images/dindangg.png')}
            style={styles.image}
          />
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* =======================================================
     WRAPPER
  ======================================================= */

  wrapper: {
    position: 'absolute',

    right: 4,
    bottom: 8,

    width: 135,
    height: 155,

    alignItems: 'center',
    justifyContent: 'flex-end',

    zIndex: 1000,
    elevation: 1000,
  },

  /* =======================================================
     BUTTON
  ======================================================= */

  button: {
    width: 120,
    height: 120,

    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    width: 120,
    height: 120,

    resizeMode: 'contain',
  },

  /* =======================================================
     MESSAGE
  ======================================================= */

  messageContainer: {
    position: 'absolute',

    right: 0,
    bottom: 128,

    minWidth: 155,

    paddingHorizontal: 12,
    paddingVertical: 9,

    borderRadius: 18,

    backgroundColor: '#FFFFFF',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.12,
    shadowRadius: 8,

    elevation: 6,

    alignItems: 'center',
    justifyContent: 'center',
  },

  messageText: {
    fontSize: 11,

    fontWeight: '700',

    color: '#2A2928',

    includeFontPadding: false,
  },

  /* =======================================================
     MESSAGE ARROW
  ======================================================= */

  messageArrow: {
    position: 'absolute',

    bottom: -6,
    right: 22,

    width: 12,
    height: 12,

    backgroundColor: '#FFFFFF',

    transform: [
      {
        rotate: '45deg',
      },
    ],
  },
});