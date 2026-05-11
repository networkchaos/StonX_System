import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  shop: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  // Load stored session on app start
  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userStr = await SecureStore.getItemAsync('auth_user');
      const shopStr = await SecureStore.getItemAsync('auth_shop');

      if (token && userStr) {
        set({
          token,
          user: JSON.parse(userStr),
          shop: shopStr ? JSON.parse(shopStr) : null,
          isAuthenticated: true,
        });
      }
    } catch (err) {
      console.error('Session load error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    const res = await authAPI.register(data);
    const { token, user, shop } = res.data;
    await _persistSession(token, user, shop);
    set({ token, user, shop, isAuthenticated: true });
    return res.data;
  },

  login: async (data) => {
    const res = await authAPI.login(data);
    const { token, user, shop } = res.data;
    await _persistSession(token, user, shop);
    set({ token, user, shop, isAuthenticated: true });
    return res.data;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    await SecureStore.deleteItemAsync('auth_shop');
    set({ user: null, shop: null, token: null, isAuthenticated: false });
  },

  updateShop: (shopUpdates) => {
    const shop = { ...get().shop, ...shopUpdates };
    set({ shop });
    SecureStore.setItemAsync('auth_shop', JSON.stringify(shop));
  },

  isOwner: () => get().user?.role === 'owner',
  isManager: () => ['owner', 'manager'].includes(get().user?.role),
  isTrialActive: () => {
    const shop = get().shop;
    if (!shop?.trial_end) return false;
    return new Date() < new Date(shop.trial_end);
  },
  trialDaysLeft: () => {
    const shop = get().shop;
    if (!shop?.trial_end) return 0;
    return Math.max(0, Math.ceil((new Date(shop.trial_end) - new Date()) / 86400000));
  },
  hasActiveSubscription: () => {
    const shop = get().shop;
    return !!(shop?.subscription_id) || new Date() < new Date(shop?.trial_end || 0);
  },
}));

async function _persistSession(token, user, shop) {
  await SecureStore.setItemAsync('auth_token', token);
  await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
  await SecureStore.setItemAsync('auth_shop', JSON.stringify(shop));
}

export default useAuthStore;
