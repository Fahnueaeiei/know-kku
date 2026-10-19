// apps/mobile/app/_layout.tsx

import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, usePathname, useRouter } from "expo-router";
import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

import HeadBar from "../components/HeadBar";
import BottomNav from "../components/BottomNav";

/* =========================================================
   CLERK KEY
   ต้องขึ้นต้นด้วย EXPO_PUBLIC_ และอยู่ใน .env ที่ Expo อ่านเจอ
========================================================= */

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to .env and restart Expo with --clear."
  );
}

const AUTH_PATHS = ["/login", "/signup"];

/* =========================================================
   APP SHELL
   (แยกออกมาเพราะ useAuth ต้องอยู่ใต้ ClerkProvider)
========================================================= */

function AppShell() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const isAuthPage = AUTH_PATHS.includes(pathname);

  /*
   * Chatbot ต้องไม่แสดง HeadBar / BottomNav
   * เพราะมันจะถูกเปิดเป็น transparent modal
   * ทับหน้าเดิม
   */
  const isChatbot = pathname === "/chatbot";

  /* ================= AUTH GATE ================= */

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn && !isAuthPage) {
      router.replace("/login");
    } else if (isSignedIn && isAuthPage) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, isAuthPage]);

  if (!isLoaded) {
    return null;
  }

  const handleAvatarPress = () => {
    router.push("/profile");
  };

  /* หน้า login/signup และตอนที่ยังไม่ล็อกอิน ไม่ต้องมี HeadBar / BottomNav */
  const hideChrome = isChatbot || isAuthPage || !isSignedIn;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* ================= HEADER ================= */}

        {!hideChrome && (
          <HeadBar
            avatar={user?.hasImage ? { uri: user.imageUrl } : undefined}
            avatarInitial={
              user?.firstName?.[0] ||
              user?.username?.[0] ||
              user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
              "U"
            }
            onAvatarPress={handleAvatarPress}
          />
        )}

        {/* ================= CONTENT ================= */}

        <View style={[styles.content, isChatbot && styles.chatbotContent]}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />

            {/* หน้าอื่น ๆ */}

            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="place" options={{ headerShown: false }} />
            <Stack.Screen name="event" options={{ headerShown: false }} />
            <Stack.Screen name="checklist" options={{ headerShown: false }} />

            {/* ================= CHATBOT ================= */}

            <Stack.Screen
              name="chatbot"
              options={{
                headerShown: false,

                presentation: "transparentModal",

                animation: "none",

                contentStyle: {
                  backgroundColor: "transparent",
                },

                gestureEnabled: false,
              }}
            />
          </Stack>
        </View>

        {!hideChrome && <BottomNav />}
      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   ROOT LAYOUT
========================================================= */

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AppShell />
    </ClerkProvider>
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
