import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet } from "react-native";

/* =========================================================
   Confetti burst: ยิงจาก 2 มุมล่างซ้าย/ขวา แล้วร่วงลงตามแรงโน้มถ่วง
   ไม่ต้องติดตั้งแพ็กเกจเพิ่ม (ใช้ Animated ของ React Native)
========================================================= */

const { width: W, height: H } = Dimensions.get("window");

const COLORS = ["#FA7C35", "#F7A8C6", "#5FD3BC", "#B9A7F0", "#FFC27A", "#1A1A1A"];
const COUNT = 48;
const DURATION = 2200; // ms
const GRAVITY = 1100; // px/s²
const STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];

type Piece = {
  color: string;
  width: number;
  height: number;
  round: boolean;
  translateX: Animated.AnimatedInterpolation<number>;
  translateY: Animated.AnimatedInterpolation<number>;
  rotate: Animated.AnimatedInterpolation<string>;
  opacity: Animated.AnimatedInterpolation<number>;
};

export default function Confetti({ onDone }: { onDone?: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;

  const pieces = useMemo<Piece[]>(() => {
    const seconds = DURATION / 1000;

    return Array.from({ length: COUNT }, (_, index) => {
      const fromLeft = index % 2 === 0;
      const originX = fromLeft ? W * 0.08 : W * 0.92;
      const originY = H * 0.55;

      // มุมยิง: ซ้ายยิงขึ้นขวา, ขวายิงขึ้นซ้าย
      const base = fromLeft ? -Math.PI / 3 : (-2 * Math.PI) / 3;
      const angle = base + (Math.random() - 0.5) * 0.8;
      const speed = 420 + Math.random() * 420;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const xs = STEPS.map((s) => originX + vx * (s * seconds) * (1 - 0.3 * s));
      const ys = STEPS.map(
        (s) => originY + vy * (s * seconds) + 0.5 * GRAVITY * (s * seconds) ** 2
      );

      const spin = (Math.random() - 0.5) * 1440;

      return {
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        width: 6 + Math.random() * 5,
        height: 9 + Math.random() * 6,
        round: Math.random() < 0.3,
        translateX: progress.interpolate({ inputRange: STEPS, outputRange: xs }),
        translateY: progress.interpolate({ inputRange: STEPS, outputRange: ys }),
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${spin}deg`],
        }),
        opacity: progress.interpolate({
          inputRange: [0, 0.05, 0.75, 1],
          outputRange: [0, 1, 1, 0],
        }),
      };
    });
  }, [progress]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDone?.();
    });
  }, [progress, onDone]);

  return (
    <>
      {pieces.map((piece, index) => (
        <Animated.View
          key={index}
          pointerEvents="none"
          style={[
            styles.piece,
            {
              width: piece.width,
              height: piece.round ? piece.width : piece.height,
              borderRadius: piece.round ? piece.width / 2 : 2,
              backgroundColor: piece.color,
              opacity: piece.opacity,
              transform: [
                { translateX: piece.translateX },
                { translateY: piece.translateY },
                { rotate: piece.rotate },
              ],
            },
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 40,
    elevation: 40,
  },
});