// @ts-nocheck
// Extracted from the repeated search-bar block in HomeScreen / PlaceScreen / EventScreen.
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * SearchBar
 * props:
 *  - value: string
 *  - onChangeText: (text: string) => void
 *  - placeholder: string
 */
export default function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={18} color="#999" />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});
