import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ──────────────────────────────────────────────────────────────────────────
//  Replace with your deployed backend URL
// ──────────────────────────────────────────────────────────────────────────
export const API_BASE_URL = 'https://your-backend.railway.app';  // Change this!

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  addWorker:(data) => api.post('/auth/add-worker', data),
  me:       ()     => api.get('/auth/me'),
};

// ── Products ──────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll:       (params) => api.get('/products', { params }),
  getById:      (id)     => api.get(`/products/${id}`),
  getByBarcode: (bc)     => api.get(`/products/barcode/${bc}`),
  create:       (data)   => api.post('/products', data),
  update:       (id, d)  => api.put(`/products/${id}`, d),
  updatePrice:  (id, price)  => api.patch(`/products/${id}/price`, { price }),
  updateStock:  (id, data)   => api.patch(`/products/${id}/stock`, data),
  delete:       (id)     => api.delete(`/products/${id}`),
  getCategories:()       => api.get('/products/meta/categories'),
};

// ── Sales ─────────────────────────────────────────────────────────────────
export const salesAPI = {
  create:  (data)   => api.post('/sales', data),
  getAll:  (params) => api.get('/sales', { params }),
};

// ── Reports ───────────────────────────────────────────────────────────────
export const reportsAPI = {
  kpis:           () => api.get('/reports/kpis'),
  getSettings:    () => api.get('/reports/settings'),
  updateSetting:  (key, value) => api.put('/reports/settings', { key, value }),
};

// ── Users ─────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll:     () => api.get('/users'),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  deactivate: (id)       => api.put(`/users/${id}/deactivate`),
};

// ── Subscription ──────────────────────────────────────────────────────────
export const subscriptionAPI = {
  create:   (data) => api.post('/subscription/create', data),
  status:   ()     => api.get('/subscription/status'),
  activate: (subscription_id) => api.post('/subscription/activate', { subscription_id }),
};

// ── Receipts ──────────────────────────────────────────────────────────────
export const receiptsAPI = {
  getPDFUrl: (receiptNumber) =>
    `${API_BASE_URL}/api/receipts/${receiptNumber}/pdf`,
};

export default api;
