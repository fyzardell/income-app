const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('income_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { error: text || 'Unknown response' };
  }
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
};

export const api = {
  // Website data
  getTicker: () => fetch(`${API_BASE}/website/ticker`).then(handleResponse),
  getTestimonials: () => fetch(`${API_BASE}/website/testimonials`).then(handleResponse),

  // Branches & Tables
  getBranches: () => fetch(`${API_BASE}/branches`).then(handleResponse),
  getBranchTables: (branchId) => fetch(`${API_BASE}/branches/${branchId}/tables`).then(handleResponse),
  validateQR: (token) => fetch(`${API_BASE}/tables/validate-qr?token=${encodeURIComponent(token)}`).then(handleResponse),
  getBranchMenu: (branchId) => fetch(`${API_BASE}/branches/${branchId}/menu`).then(handleResponse),

  // Auth
  requestOTP: (whatsapp_number) =>
    fetch(`${API_BASE}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp_number }),
    }).then(handleResponse),

  verifyOTP: (whatsapp_number, otp, name) =>
    fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp_number, otp, name }),
    }).then(handleResponse),

  staffLogin: (whatsapp_number, password) =>
    fetch(`${API_BASE}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp_number, password }),
    }).then(handleResponse),

  getProfile: () =>
    fetch(`${API_BASE}/customer/profile`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  updateProfile: (name) =>
    fetch(`${API_BASE}/customer/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    }).then(handleResponse),

  // Orders
  createOrder: (orderData) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    }).then(handleResponse),

  getCustomerOrders: () =>
    fetch(`${API_BASE}/orders`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  trackOrder: (orderNumber) =>
    fetch(`${API_BASE}/orders/track/${orderNumber}`).then(handleResponse),

  requestCancellation: (orderId, reason) =>
    fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    }).then(handleResponse),

  // Cashier
  getCashierOrders: (branchId, status = 'all') =>
    fetch(`${API_BASE}/cashier/orders?branch_id=${branchId || 0}&status=${status}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  updateOrderStatus: (orderId, status, notes = '') =>
    fetch(`${API_BASE}/cashier/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    }).then(handleResponse),

  confirmCashPayment: (orderId) =>
    fetch(`${API_BASE}/cashier/orders/${orderId}/confirm-cash`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  triggerSpeaker: (orderId) =>
    fetch(`${API_BASE}/cashier/orders/${orderId}/speaker`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  getSpeakerLogs: () =>
    fetch(`${API_BASE}/cashier/speaker-logs`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  toggleProductAvailability: (productId, isAvailable, branchId) =>
    fetch(`${API_BASE}/cashier/products/${productId}/availability`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_available: isAvailable, branch_id: branchId }),
    }).then(handleResponse),

  getCancellations: () =>
    fetch(`${API_BASE}/cashier/cancellations`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  decideCancellation: (reqId, approve, notes = '') =>
    fetch(`${API_BASE}/cashier/cancellations/${reqId}/decide`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approve, notes }),
    }).then(handleResponse),

  // Admin
  getReports: () =>
    fetch(`${API_BASE}/admin/reports`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  updateBranchPrice: (branchId, productId, price) =>
    fetch(`${API_BASE}/admin/price`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ branch_id: branchId, product_id: productId, price }),
    }).then(handleResponse),

  createProduct: (data) =>
    fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteProduct: (productId) =>
    fetch(`${API_BASE}/admin/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Payment Webhook Simulator
  simulateWebhook: (payload) =>
    fetch(`${API_BASE}/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),
};

