// @ts-nocheck
// Extracted from the repeated header block in HomeScreen / PlaceScreen / EventScreen.
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * HeadBar
 * Top header shown on Home / Place / Event: "Know KKU" title + user avatar.
 *
 * props:
 *  - avatar: image source (require(...) or { uri })
 *  - onAvatarPress: () => void   // e.g. router.push('/profile')
 */
export default function HeadBar({ avatar, onAvatarPress }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        Know <Text style={styles.headerTitleAccent}>KKU</Text>
      </Text>
      <TouchableOpacity onPress={onAvatarPress} disabled={!onAvatarPress}>
        <Image source={avatar} style={styles.avatar} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerTitleAccent: {
    color: '#E86A33',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E86A33',
  },
});
