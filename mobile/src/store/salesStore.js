import { create } from 'zustand';
import { salesAPI } from '../services/api';

const useSalesStore = create((set, get) => ({
  cart: [],
  recentSales: [],
  lastReceipt: null,
  isProcessing: false,

  // Cart operations
  addToCart: (product, qty = 1) => {
    const cart = get().cart;
    const existing = cart.find(c => c.product_id === product.id);

    if (existing) {
      set({
        cart: cart.map(c =>
          c.product_id === product.id
            ? { ...c, qty: c.qty + qty }
            : c
        ),
      });
    } else {
      set({
        cart: [
          ...cart,
          {
            product_id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            qty,
            unit: product.unit || 'pcs',
          },
        ],
      });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter(c => c.product_id !== productId) });
  },

  updateCartQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map(c =>
        c.product_id === productId ? { ...c, qty } : c
      ),
    });
  },

  clearCart: () => set({ cart: [] }),

  getSubtotal: () =>
    get().cart.reduce((sum, item) => sum + item.price * item.qty, 0),

  getItemCount: () =>
    get().cart.reduce((sum, item) => sum + item.qty, 0),

  // Checkout
  checkout: async ({ paymentMethod, mpesaRef, discount, customerName, customerPhone }) => {
    set({ isProcessing: true });
    try {
      const subtotal = get().getSubtotal();
      const total = subtotal - (parseFloat(discount) || 0);

      const res = await salesAPI.create({
        items: get().cart,
        subtotal,
        discount: parseFloat(discount) || 0,
        total,
        payment_method: paymentMethod,
        mpesa_ref: mpesaRef,
        customer_name: customerName,
        customer_phone: customerPhone,
      });

      const sale = res.data.sale;
      set({ lastReceipt: sale, cart: [], isProcessing: false });
      return sale;
    } catch (err) {
      set({ isProcessing: false });
      throw err;
    }
  },

  fetchRecentSales: async (params = {}) => {
    try {
      const res = await salesAPI.getAll({ limit: 20, ...params });
      set({ recentSales: res.data.sales });
    } catch {}
  },
}));

export default useSalesStore;
