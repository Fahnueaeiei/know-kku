// @ts-nocheck

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  orange: '#FA7C35',
  inactive: '#77716D',
  white: '#FFFFFF',
};

/* =========================================================
   TABS
========================================================= */

const TABS = [
  {
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
    route: '/',
  },
  {
    label: 'Place',
    icon: 'location-outline',
    activeIcon: 'location',
    route: '/place',
  },
  {
    label: 'Event',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    route: '/event',
  },
  {
    label: 'Checklist',
    icon: 'checkbox-outline',
    activeIcon: 'checkbox',
    route: '/checklist',
  },
];

/* =========================================================
   BOTTOM NAV
========================================================= */

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === '/') {
      return (
        pathname === '/' ||
        pathname === '/index'
      );
    }

    return pathname.startsWith(route);
  };

  return (
    <View style={styles.container}>
      <View style={styles.navInner}>

        {TABS.map((tab) => {
          const active =
            isActive(tab.route);

          return (
            <TouchableOpacity
              key={tab.route}
              activeOpacity={0.75}
              style={styles.tab}
              onPress={() => {
                if (!active) {
                  router.replace(tab.route);
                }
              }}
            >

              {/* ICON */}

              <View
                style={[
                  styles.iconContainer,
                  active &&
                    styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={
                    active
                      ? tab.activeIcon
                      : tab.icon
                  }
                  size={
                    active
                      ? 19
                      : 20
                  }
                  color={
                    active
                      ? COLORS.white
                      : COLORS.inactive
                  }
                />
              </View>

              {/* LABEL */}

              <Text
                style={[
                  styles.label,
                  active &&
                    styles.activeLabel,
                ]}
              >
                {tab.label}
              </Text>

            </TouchableOpacity>
          );
        })}

      </View>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* =====================================================
     CONTAINER

     HeadBar = 58
     BottomNav ≈ 64–68
  ===================================================== */

  container: {
    height:
      Platform.OS === 'ios'
        ? 68
        : 64,

    backgroundColor:
      COLORS.white,

    borderTopWidth: 0.5,

    borderTopColor:
      '#EFECEB',
  },

  /* =====================================================
     NAV INNER
  ===================================================== */

  navInner: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent:
      'space-around',

    paddingHorizontal: 12,

    paddingTop: 7,
  },

  /* =====================================================
     TAB
  ===================================================== */

  tab: {
    flex: 1,

    alignItems: 'center',

    justifyContent:
      'flex-start',

    minHeight: 55,
  },

  /* =====================================================
     ICON
  ===================================================== */

  iconContainer: {
    width: 31,

    height: 31,

    borderRadius: 16,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 3,
  },

  /* =====================================================
     ACTIVE ICON
  ===================================================== */

  activeIconContainer: {
    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor:
      COLORS.orange,
  },

  /* =====================================================
     LABEL
  ===================================================== */

  label: {
    fontSize: 9,

    lineHeight: 12,

    fontWeight: '500',

    color:
      COLORS.inactive,

    textAlign: 'center',
  },

  /* =====================================================
     ACTIVE LABEL
  ===================================================== */

  activeLabel: {
    color:
      COLORS.orange,

    fontWeight: '700',
  },
});