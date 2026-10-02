// apps/mobile/app/_layout.tsx

import React from "react";
import {
  View,
  StyleSheet,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Stack,
  usePathname,
  useRouter,
} from "expo-router";

import HeadBar from "../components/HeadBar";
import BottomNav from "../components/BottomNav";

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();

  const handleAvatarPress = () => {
    router.push("/profile");
  };

  /*
   * Chatbot ต้องไม่แสดง HeadBar / BottomNav
   * เพราะมันจะถูกเปิดเป็น transparent modal
   * ทับหน้าเดิม
   */

  const isChatbot =
    pathname === "/chatbot";

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <View style={styles.container}>

        {!isChatbot && (
          <>
            {/* ================= HEADER ================= */}

            <HeadBar
              avatar={require("../assets/images/jeno1.jpg")}
              onAvatarPress={handleAvatarPress}
            />
          </>
        )}

        {/* ================= CONTENT ================= */}

        <View
          style={[
            styles.content,
            isChatbot && styles.chatbotContent,
          ]}
        >
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >

            {/* หน้าอื่น ๆ */}

            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="profile"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="place"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="event"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="checklist"
              options={{
                headerShown: false,
              }}
            />

            {/* ================= CHATBOT ================= */}

            <Stack.Screen
              name="chatbot"
              options={{
                headerShown: false,

                presentation:
                  "transparentModal",

                animation:
                  "none",

                contentStyle: {
                  backgroundColor:
                    "transparent",
                },

                gestureEnabled: false,
              }}
            />

          </Stack>
        </View>

        {!isChatbot && (
          <BottomNav />
        )}

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

  chatbotContent: {
    backgroundColor: "transparent",
  },
});