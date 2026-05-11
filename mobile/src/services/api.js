import axios from 'axios';
import storage from '../utils/storage';

// ─────────────────────────────────────────────────────────────────────────────
//  URL GUIDE:
//
//  Expo web (browser, backend on same PC) → 'http://localhost:3000'
//  Android emulator                       → 'http://10.0.2.2:3000'
//  Real phone on same WiFi                → 'http://192.168.x.x:3000'
//  Deployed backend                       → 'https://your-app.railway.app'
// ─────────────────────────────────────────────────────────────────────────────
export const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('auth_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
    console.log(`[API →] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (err) => { console.error('[API request error]', err); return Promise.reject(err); }
);

api.interceptors.response.use(
  (res) => {
    console.log(`[API ✅] ${res.status} ${res.config.url}`);
    return res;
  },
  async (err) => {
    const status  = err.response?.status;
    const url     = err.config?.url || '?';
    const message = err.response?.data?.error || err.message || 'Unknown error';
    console.error(`[API ❌] ${status ?? 'NETWORK'} ${url} — ${message}`);
    if (status === 401) {
      await storage.removeItem('auth_token');
      await storage.removeItem('auth_user');
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:  (data) => api.post('/auth/register', data),
  login:     (data) => api.post('/auth/login', data),
  addWorker: (data) => api.post('/auth/add-worker', data),
  me:        ()     => api.get('/auth/me'),
};

export const productsAPI = {
  getAll:        (params) => api.get('/products', { params }),
  getById:       (id)     => api.get(`/products/${id}`),
  getByBarcode:  (bc)     => api.get(`/products/barcode/${bc}`),
  create:        (data)   => api.post('/products', data),
  update:        (id, d)  => api.put(`/products/${id}`, d),
  updatePrice:   (id, p)  => api.patch(`/products/${id}/price`, { price: p }),
  updateStock:   (id, d)  => api.patch(`/products/${id}/stock`, d),
  delete:        (id)     => api.delete(`/products/${id}`),
  getCategories: ()       => api.get('/products/meta/categories'),
};

export const salesAPI = {
  create: (data)   => api.post('/sales', data),
  getAll: (params) => api.get('/sales', { params }),
};

export const reportsAPI = {
  kpis:          ()         => api.get('/reports/kpis'),
  getSettings:   ()         => api.get('/reports/settings'),
  updateSetting: (key, val) => api.put('/reports/settings', { key, value: val }),
};

export const usersAPI = {
  getAll:     ()          => api.get('/users'),
  updateRole: (id, role)  => api.put(`/users/${id}/role`, { role }),
  deactivate: (id)        => api.put(`/users/${id}/deactivate`),
};

export const subscriptionAPI = {
  create:   (data)  => api.post('/subscription/create', data),
  status:   ()      => api.get('/subscription/status'),
  activate: (subId) => api.post('/subscription/activate', { subscription_id: subId }),
};

export const receiptsAPI = {
  getPDFUrl: (receiptNumber) => `${API_BASE_URL}/api/receipts/${receiptNumber}/pdf`,
};

export default api;