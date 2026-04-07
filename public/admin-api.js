// Admin API Service Layer
// Connects the frontend admin panel to the PHP backend API
// Keep this class aligned with active calls from public/admin.js.

const isLocalVitePort =
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  /^517\d$/.test(window.location.port || '');

const runtimeConfig = window.__SOUCUL_CONFIG__ || {};

const API_BASE_URL = (
  window.SOUCUL_ADMIN_API_BASE_URL ||
  runtimeConfig.adminApiBaseUrl ||
  (isLocalVitePort ? '' : window.location.origin)
).replace(/\/+$/, '');

const API_CONFIG_ERROR_MESSAGE =
  'Admin API returned an unexpected response. Check runtime-config.js adminApiBaseUrl and backend routing.';
const SAME_ORIGIN_BASE_URL = String(window.location.origin || '').replace(/\/+$/, '');

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getCookie(name) {
  const encodedName = `${encodeURIComponent(name)}=`;
  const parts = document.cookie ? document.cookie.split(';') : [];

  for (const part of parts) {
    const cookie = part.trim();
    if (cookie.startsWith(encodedName)) {
      return decodeURIComponent(cookie.slice(encodedName.length));
    }
  }

  return null;
}

function setCookie(name, value, maxAgeSeconds = COOKIE_MAX_AGE_SECONDS) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function removeCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function getJsonCookie(name) {
  const raw = getCookie(name);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

class AdminAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = getCookie('admin_token') || null;
  }

  // Helper for authenticated requests.
  // Expected success shape from backend: { success: true, data: ... }.
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const sameOriginUrl = `${SAME_ORIGIN_BASE_URL}${endpoint}`;
    const canRetrySameOrigin =
      !!SAME_ORIGIN_BASE_URL &&
      SAME_ORIGIN_BASE_URL !== this.baseURL &&
      (endpoint.startsWith('/api/') || endpoint.startsWith('/health'));
    const headers = {
      ...(options.headers || {})
    };

    const hasContentTypeHeader = Object.keys(headers)
      .some(key => key.toLowerCase() === 'content-type');
    const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;

    if (!hasContentTypeHeader && !isFormDataBody) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      let response;

      try {
        response = await fetch(url, {
          ...options,
          headers
        });
      } catch (primaryError) {
        const lowered = String(primaryError?.message || '').toLowerCase();
        const isNetworkFailure =
          primaryError instanceof TypeError ||
          lowered.includes('failed to fetch') ||
          lowered.includes('networkerror');

        if (!canRetrySameOrigin || !isNetworkFailure) {
          throw primaryError;
        }

        response = await fetch(sameOriginUrl, {
          ...options,
          headers
        });
      }

      if (response.status === 204) {
        return { success: true, data: null };
      }

      const contentType = response.headers.get('content-type') || '';
      const expectsJson = endpoint.startsWith('/api/') || endpoint.startsWith('/health');

      if (expectsJson && !contentType.includes('application/json')) {
        const responseText = await response.text();
        const compact = String(responseText || '').trim().slice(0, 120).toLowerCase();
        if (compact.startsWith('<!doctype') || compact.startsWith('<html')) {
          throw new Error(`${API_CONFIG_ERROR_MESSAGE} Received HTML instead of JSON.`);
        }
        throw new Error(API_CONFIG_ERROR_MESSAGE);
      }

      const data = contentType.includes('application/json')
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error((data && data.message) || `API request failed (${response.status})`);
      }

      return data || { success: true, data: null };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    const result = await this.request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true
    });

    const token = result?.data?.token;
    const admin = result?.data?.admin;

    if (result?.success && token) {
      this.token = token;
      setCookie('admin_token', token);
      if (admin) {
        setCookie('admin_user', JSON.stringify(admin));
      }
    } else if (result?.success && !token) {
      throw new Error(
        'Login did not return an auth token. Verify runtime-config.js adminApiBaseUrl points to the admin backend.'
      );
    }

    return result;
  }

  logout() {
    this.token = null;
    removeCookie('admin_token');
    removeCookie('admin_user');
  }

  async getProfile() {
    return await this.request('/api/v1/admin/profile');
  }

  async getHealth() {
    return await this.request('/health', { skipAuth: true });
  }

  // Notifications
  async getNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/notifications${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async getUnreadNotificationCount() {
    return await this.request('/api/v1/admin/notifications/unread-count');
  }

  async markNotificationRead(notificationId) {
    return await this.request(`/api/v1/admin/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  async markAllNotificationsRead() {
    return await this.request('/api/v1/admin/notifications/read-all', {
      method: 'PATCH'
    });
  }

  // Dashboard
  async getDashboardStats() {
    return await this.request('/api/v1/admin/dashboard/stats');
  }

  // Products
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/products${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async createProduct(productData) {
    return await this.request('/api/v1/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(productId, productData) {
    return await this.request(`/api/v1/admin/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(productData)
    });
  }

  async uploadProductImage(file, metadata = {}) {
    const formData = new FormData();
    formData.append('image', file);

    if (metadata.productName) {
      formData.append('product_name', String(metadata.productName));
    }

    if (metadata.location) {
      formData.append('location', String(metadata.location));
    }

    return await this.request('/api/v1/admin/uploads/product-image', {
      method: 'POST',
      body: formData
    });
  }

  // Orders
  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/orders${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async getOrderDetails(orderId) {
    return await this.request(`/api/v1/admin/orders/${orderId}`);
  }

  async updateOrderStatus(orderId, status) {
    return await this.request(`/api/v1/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Users
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/users${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async getUserDetails(userId) {
    return await this.request(`/api/v1/admin/users/${userId}`);
  }

  async toggleUserStatus(userId) {
    return await this.request(`/api/v1/admin/users/${userId}/toggle`, {
      method: 'PATCH'
    });
  }

  // Admins
  async getAdmins() {
    return await this.request('/api/v1/admin/admins');
  }

  async createAdmin(adminData) {
    return await this.request('/api/v1/admin/admins', {
      method: 'POST',
      body: JSON.stringify(adminData)
    });
  }

  async toggleAdminStatus(adminId) {
    return await this.request(`/api/v1/admin/admins/${adminId}/toggle`, {
      method: 'PATCH'
    });
  }

  // Vouchers
  async getVouchers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/vouchers${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async createVoucher(voucherData) {
    return await this.request('/api/v1/admin/vouchers', {
      method: 'POST',
      body: JSON.stringify(voucherData)
    });
  }

  async updateVoucher(voucherId, voucherData) {
    return await this.request(`/api/v1/admin/vouchers/${voucherId}`, {
      method: 'PATCH',
      body: JSON.stringify(voucherData)
    });
  }

  async deleteVoucher(voucherId) {
    return await this.request(`/api/v1/admin/vouchers/${voucherId}`, {
      method: 'DELETE'
    });
  }

  async archiveProduct(productId) {
    return await this.request(`/api/v1/admin/products/${productId}`, {
      method: 'DELETE'
    });
  }

  async archiveUser(userId) {
    return await this.request(`/api/v1/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async archiveOrder(orderId) {
    return await this.request(`/api/v1/admin/orders/${orderId}`, {
      method: 'DELETE'
    });
  }

  // ── ARCHIVED PRODUCTS ────────────────────────────────

  async getArchivedProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/archive/products${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async restoreArchivedProduct(productId) {
    return await this.request(`/api/v1/admin/archive/products/${productId}/restore`, {
      method: 'PATCH'
    });
  }

  // ── ARCHIVED USERS ───────────────────────────────────

  async getArchivedUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/archive/users${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async restoreArchivedUser(userId) {
    return await this.request(`/api/v1/admin/archive/users/${userId}/restore`, {
      method: 'PATCH'
    });
  }

  // ── ARCHIVED ORDERS ──────────────────────────────────

  async getArchivedOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/archive/orders${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async restoreArchivedOrder(orderId) {
    return await this.request(`/api/v1/admin/archive/orders/${orderId}/restore`, {
      method: 'PATCH'
    });
  }

  // ── AUDIT TRAIL ──────────────────────────────────────

  async getAuditLogs(params = {}) {
    // Supported params: action, entity, admin_id, date_from, date_to, page, limit
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/audit${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  // ── SECURITY & PROFILE ───────────────────────────────

  async updateProfile(profileData) {
    // profileData: { username, email, fname, lname, phone }
    return await this.request('/api/v1/admin/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  }

  async changePassword(passwordData) {
    // passwordData: { current_password, new_password, confirm_password }
    return await this.request('/api/v1/admin/profile/password', {
      method: 'POST',
      body: JSON.stringify(passwordData)
    });
  }

  async revokeAllSessions() {
    return await this.request('/api/v1/admin/profile/sessions', {
      method: 'DELETE'
    });
  }

  // ── UTILITY HELPERS ──────────────────────────────────

  isAuthenticated() {
    return !!this.token;
  }

  getStoredAdmin() {
    return getJsonCookie('admin_user');
  }

}

if (typeof window !== 'undefined') {
  window.AdminAPI = AdminAPI;
}
