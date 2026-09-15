import axios from 'axios';

// Prefer `VITE_API_BASE` (full API base including /api). If not set, fall back to
// `VITE_API_TARGET` (host used by Vite proxy, appended with `/api`). Otherwise
// use the dev proxy path `/api` so the Vite dev server proxy works locally.
const viteApiTarget = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_TARGET : undefined;
const viteApiBase = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE : undefined;
let apiBase;
if (viteApiBase) {
  apiBase = viteApiBase.replace(/\/+$/, '');
} else if (viteApiTarget) {
  apiBase = `${viteApiTarget.replace(/\/+$/,'')}/api`;
} else {
  apiBase = '/api';
}

const api = axios.create({ baseURL: apiBase });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers?.Authorization;
  }
  return config;
});

// If a request returns 401 Unauthorized, clear stored auth and redirect to login.
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
      } catch (e) {
        // ignore
      }
      if (typeof window !== 'undefined') {
        // preserve current path so user can return after login
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnTo=${returnTo}`;
      }
    }
    return Promise.reject(error);
  }
);

// POS endpoints
export const posAPI = {
  // Auth
  login: (data)               => api.post('/auth/login', data),

  // Outlets
  getOutlets: ()              => api.get('/pos/outlets'),
  createOutlet: (data)        => api.post('/pos/outlets', data),
  updateOutlet: (id, data)    => api.put(`/pos/outlets/${id}`, data),

  // Tables
  getTables: (outletId)       => api.get('/pos/tables', { params: { outlet_id: outletId } }),
  updateTableStatus: (id, status) => api.patch(`/pos/tables/${id}/status`, { status }),
  createTable: (data)         => api.post('/pos/tables', data),

  // Menu
  getCategories: ()           => api.get('/pos/menu/categories'),
  getCategoryChildren: (id)   => api.get(`/pos/menu/categories/${id}/children`),
  getMenuItems: (params)      => api.get('/pos/menu/items', { params }),
  createCategory: (data)      => api.post('/pos/menu/categories', data),
  createMenuItem: (data)      => api.post('/pos/menu/items', data),
  updateMenuItem: (id, data)  => api.put(`/pos/menu/items/${id}`, data),
  getTaxClasses: ()           => api.get('/pos/menu/tax-classes'),
  getVoidReasons: ()          => api.get('/pos/menu/void-reasons'),

  // Orders
  getOrders: (params)         => api.get('/pos/orders', { params }),
  getOrder: (id)              => api.get(`/pos/orders/${id}`),
  openOrder: (data)           => api.post('/pos/orders', data),
  addItem: (orderId, data)    => api.post(`/pos/orders/${orderId}/items`, data),
  modifyItem: (orderId, itemId, data) => api.patch(`/pos/orders/${orderId}/items/${itemId}`, data),
  voidItem: (orderId, itemId, data)   => api.post(`/pos/orders/${orderId}/items/${itemId}/void`, data),
  transferTable: (orderId, data)      => api.post(`/pos/orders/${orderId}/transfer`, data),
  splitOrder: (orderId, data)         => api.post(`/pos/orders/${orderId}/split`, data),

  // Kitchen board
  getKitchenOrders: (params = {}) => api.get('/pos/kitchen/orders', { params }),
  updateKitchenOrderStatus: (id, data) => api.patch(`/pos/kitchen/orders/${id}/status`, data),

  // Bills
  generateBill: (orderId)     => api.post(`/pos/bills/${orderId}`),
  getBill: (id)               => api.get(`/pos/bills/${id}`),
  applyBillDiscount: (id, data) => api.post(`/pos/bills/${id}/discount`, data),

  // Payments
  pay: (billId, data)         => api.post(`/pos/payments/${billId}`, data),

  // Room posting
  roomLookup: (room)          => api.get('/pos/guests/room-lookup', { params: { room } }),

  // Config
  getWaiters: ()              => api.get('/pos/config/waiters'),
  createWaiter: (data)        => api.post('/pos/config/waiters', data),
  getMealPeriods: ()          => api.get('/pos/menu/meal-periods'),
  createMealPeriod: (data)    => api.post('/pos/menu/meal-periods', data),
  getPrinterStations: ()      => api.get('/pos/config/printer-stations'),
  getTaxes: ()                => api.get('/pos/config/taxes'),

  // Reports
  getSalesSummary: (params)   => api.get('/pos/reports/sales-summary', { params }),
  getVoidLog: (params)        => api.get('/pos/reports/void-log', { params }),
  getMealPeriodSummary: (params) => api.get('/pos/reports/meal-period-summary', { params }),
  getPaymentBreakdown: (params)  => api.get('/pos/reports/payment-breakdown', { params }),
};

export default api;
