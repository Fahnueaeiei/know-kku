import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Slot, usePathname } from "expo-router";

import HeadBar from "../components/HeadBar";
import SearchBar from "../components/SearchBar";
import BottomNav from "../components/BottomNav";

export default function RootLayout() {
  const pathname = usePathname();

  const isProfile = pathname === "/profile";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <HeadBar avatar={require("../assets/images/jeno1.jpg")} onAvatarPress={() => {}} />

        {!isProfile && <SearchBar value="" onChangeText={() => {}} placeholder="Search..." />}

        <View style={styles.content}>
          <Slot />
        </View>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7E289",
  },

  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },
});