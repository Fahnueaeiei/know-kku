import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Slot, usePathname, useRouter  } from "expo-router";

import HeadBar from "../components/HeadBar";
import BottomNav from "../components/BottomNav";

export default function RootLayout() {
  const pathname = usePathname();

  const isProfile = pathname === "/profile";

  const router = useRouter();

  const handleAvatarPress = () => {
  router.push("/profile");
};

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>

        {/* ================= HEADER ================= */}
        <HeadBar
          avatar={require("../assets/images/jeno1.jpg")}
          onAvatarPress={handleAvatarPress}
        />

        {/* ================= CONTENT ================= */}
        <View style={styles.content}>
          <Slot />
        </View>

        {/* ================= BOTTOM NAV ================= */}
        <BottomNav />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF7F5",
  },

  container: {
    flex: 1,
    backgroundColor: "#FAF7F5",
  },

  content: {
    flex: 1,
  },
});