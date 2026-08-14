// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const TABS = [
  { label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/' },
  { label: 'Place', icon: 'location-outline', activeIcon: 'location', route: '/place' },
  { label: 'Event', icon: 'calendar-outline', activeIcon: 'calendar', route: '/event' },
  { label: 'Checklist', icon: 'checkbox-outline', activeIcon: 'checkbox', route: '/checklist' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            onPress={() => {
              if (!active) router.replace(tab.route);
            }}
          >
            {active ? (
              <View style={styles.activeIconWrap}>
                <Ionicons name={tab.activeIcon} size={20} color="#fff" />
              </View>
            ) : (
              <Ionicons name={tab.icon} size={22} color="#8a8a8a" />
            )}
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  activeIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#E86A33', alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  label: { fontSize: 11, color: '#8a8a8a' },
  activeLabel: { color: '#E86A33', fontWeight: '600' },
});