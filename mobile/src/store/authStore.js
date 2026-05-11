import { create } from 'zustand';
import { authAPI } from '../services/api';
import storage from '../utils/storage';

const useAuthStore = create((set, get) => ({
  user: null,
  shop: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  loadSession: async () => {
    try {
      const token   = await storage.getItem('auth_token');
      const userStr = await storage.getItem('auth_user');
      const shopStr = await storage.getItem('auth_shop');
      if (token && userStr) {
        console.log('[AUTH] Session restored');
        set({
          token,
          user: JSON.parse(userStr),
          shop: shopStr ? JSON.parse(shopStr) : null,
          isAuthenticated: true,
        });
      } else {
        console.log('[AUTH] No stored session');
      }
    } catch (err) {
      console.error('[AUTH] loadSession error:', err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    console.log('[AUTH] register ->', data.email);
    const res = await authAPI.register(data); // throws on error — screen catches it
    const { token, user, shop } = res.data;
    await _persist(token, user, shop);
    set({ token, user, shop, isAuthenticated: true });
    console.log('[AUTH] registered, shop:', shop?.id);
    return res.data;
  },

  login: async (data) => {
    console.log('[AUTH] login ->', data.email);
    const res = await authAPI.login(data);
    const { token, user, shop } = res.data;
    await _persist(token, user, shop);
    set({ token, user, shop, isAuthenticated: true });
    console.log('[AUTH] login OK, role:', user?.role);
    return res.data;
  },

  logout: async () => {
    await storage.removeItem('auth_token');
    await storage.removeItem('auth_user');
    await storage.removeItem('auth_shop');
    set({ user: null, shop: null, token: null, isAuthenticated: false });
  },

  updateShop: async (updates) => {
    const shop = { ...get().shop, ...updates };
    set({ shop });
    await storage.setItem('auth_shop', JSON.stringify(shop));
  },

  isOwner:   () => get().user?.role === 'owner',
  isManager: () => ['owner', 'manager'].includes(get().user?.role),

  trialDaysLeft: () => {
    const t = get().shop?.trial_end;
    return t ? Math.max(0, Math.ceil((new Date(t) - new Date()) / 86400000)) : 0;
  },

  isTrialActive: () => {
    const t = get().shop?.trial_end;
    return t ? new Date() < new Date(t) : false;
  },

  hasActiveSubscription: () => {
    const shop = get().shop;
    if (!shop) return false;
    return !!shop.subscription_id || new Date() < new Date(shop.trial_end || 0);
  },
}));

async function _persist(token, user, shop) {
  await storage.setItem('auth_token', token);
  await storage.setItem('auth_user', JSON.stringify(user));
  await storage.setItem('auth_shop', JSON.stringify(shop));
}

export default useAuthStore;