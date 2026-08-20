// @ts-nocheck

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function HeadBar({ avatar, onAvatarPress }) {
  return (
    <View style={styles.header}>
      
      {/* APP NAME */}
      <Text style={styles.title}>
        Know <Text style={styles.titleAccent}>KKU</Text>
      </Text>

      {/* AVATAR */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onAvatarPress}
        disabled={!onAvatarPress}
        style={styles.avatarButton}
      >
        {avatar ? (
          <Image
            source={avatar}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              U
            </Text>
          </View>
        )}
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    height: 58,

    width: '100%',

    paddingHorizontal: 16,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    backgroundColor: '#FFFFFF',

    borderBottomWidth: 0.5,

    borderBottomColor: '#F0EBE8',
  },

  /* =====================================================
     APP TITLE
  ===================================================== */

  title: {
    fontSize: 17,

    fontWeight: '700',

    color: '#252525',

    letterSpacing: -0.3,
  },

  titleAccent: {
    color: '#FA7C35',
  },

  /* =====================================================
     AVATAR BUTTON
  ===================================================== */

  avatarButton: {
    width: 38,

    height: 38,

    alignItems: 'center',

    justifyContent: 'center',
  },

  /* =====================================================
     AVATAR
  ===================================================== */

  avatar: {
    width: 34,

    height: 34,

    borderRadius: 17,

    borderWidth: 1.2,

    borderColor: '#E8E8E8',
  },

  /* =====================================================
     AVATAR PLACEHOLDER
  ===================================================== */

  avatarPlaceholder: {
    width: 34,

    height: 34,

    borderRadius: 17,

    backgroundColor: '#F3E8E0',

    alignItems: 'center',

    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 13,

    fontWeight: '700',

    color: '#FA7C35',
  },
});