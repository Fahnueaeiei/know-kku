// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function HeadBar({ avatar, onAvatarPress }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>
        Know <Text style={styles.titleAccent}>KKU</Text>
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onAvatarPress}
        disabled={!onAvatarPress}
        style={styles.avatarButton}
      >
        {avatar ? (
          <Image source={avatar} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>U</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 43,
    width: '100%',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#252525',
    letterSpacing: -0.2,
  },

  titleAccent: {
    color: '#FA7C35',
  },

  avatarButton: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 1.2,
    borderColor: '#E8E8E8',
  },

  avatarPlaceholder: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#F3E8E0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FA7C35',
  },
});