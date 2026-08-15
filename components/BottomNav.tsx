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

const COLORS = {
  orange: '#FA7C35',
  inactive: '#77716D',
  white: '#FFFFFF',
};

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

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === '/') {
      return pathname === '/' || pathname === '/index';
    }

    return pathname.startsWith(route);
  };

  return (
    <View style={styles.container}>
      <View style={styles.navInner}>
        {TABS.map((tab) => {
          const active = isActive(tab.route);

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
              <View
                style={[
                  styles.iconContainer,
                  active && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={active ? tab.activeIcon : tab.icon}
                  size={active ? 15 : 16}
                  color={active ? COLORS.white : COLORS.inactive}
                />
              </View>

              <Text
                style={[
                  styles.label,
                  active && styles.activeLabel,
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

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? 59 : 55,
    backgroundColor: COLORS.white,
    borderTopWidth: 0.5,
    borderTopColor: '#EFECEB',
  },

  navInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 9,
    paddingTop: 5,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 48,
  },

  iconContainer: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  activeIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.orange,
  },

  label: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: '500',
    color: COLORS.inactive,
    textAlign: 'center',
  },

  activeLabel: {
    color: COLORS.orange,
    fontWeight: '700',
  },
});