/**
 * storage.js — cross-platform key-value storage
 *
 * expo-secure-store  → works on iOS / Android
 * localStorage       → works on Expo web (browser)
 *
 * Import this everywhere instead of calling SecureStore directly.
 */

import { Platform } from 'react-native';

// Only import SecureStore on native — importing it on web crashes silently
let SecureStore = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

const storage = {
  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn(`[storage] getItem(${key}) failed:`, err.message);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (err) {
      console.warn(`[storage] setItem(${key}) failed:`, err.message);
    }
  },

  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (err) {
      console.warn(`[storage] removeItem(${key}) failed:`, err.message);
    }
  },
};

export default storage;