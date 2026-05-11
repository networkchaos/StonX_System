import { create } from 'zustand';
import { productsAPI } from '../services/api';

const useInventoryStore = create((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  activeCategory: 'All',

  fetchProducts: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await productsAPI.getAll(params);
      set({ products: res.data.products, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const res = await productsAPI.getCategories();
      set({ categories: ['All', ...res.data.categories] });
    } catch {}
  },

  addProduct: async (data) => {
    const res = await productsAPI.create(data);
    set(state => ({ products: [res.data.product, ...state.products] }));
    return res.data.product;
  },

  updateProduct: async (id, data) => {
    const res = await productsAPI.update(id, data);
    set(state => ({
      products: state.products.map(p => p.id === id ? res.data.product : p),
    }));
    return res.data.product;
  },

  updatePrice: async (id, price) => {
    const res = await productsAPI.updatePrice(id, price);
    set(state => ({
      products: state.products.map(p => p.id === id ? res.data.product : p),
    }));
    return res.data.product;
  },

  updateStock: async (id, data) => {
    const res = await productsAPI.updateStock(id, data);
    set(state => ({
      products: state.products.map(p => p.id === id ? res.data.product : p),
    }));
    return res.data.product;
  },

  deleteProduct: async (id) => {
    await productsAPI.delete(id);
    set(state => ({ products: state.products.filter(p => p.id !== id) }));
  },

  getFiltered: () => {
    const { products, searchQuery, activeCategory } = get();
    let filtered = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    if (activeCategory && activeCategory !== 'All') {
      filtered = filtered.filter(p =>
        p.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    return filtered;
  },

  getLowStock: () =>
    get().products.filter(p => {
      const qty = parseInt(p.quantity) || 0;
      return qty > 0 && qty <= (parseInt(p.threshold) || 5);
    }),

  getOutOfStock: () =>
    get().products.filter(p => parseInt(p.quantity) === 0),

  setSearch: (q) => set({ searchQuery: q }),
  setCategory: (c) => set({ activeCategory: c }),
}));

export default useInventoryStore;
