// Customer API Service Layer
// Connects the frontend to the PHP customer backend API

const isLocalVitePort =
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  /^517\d$/.test(window.location.port || '');

const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const runtimeConfig = window.__SOUCUL_CONFIG__ || {};

const CUSTOMER_API_BASE_URL = (
  window.SOUCUL_CUSTOMER_API_BASE_URL ||
  runtimeConfig.customerApiBaseUrl ||
  (isLocalVitePort ? '' : (isLocalHost ? 'http://localhost:8001' : window.location.origin))
).replace(/\/+$/, '');
const SAME_ORIGIN_BASE_URL = String(window.location.origin || '').replace(/\/+$/, '');
const API_CONFIG_ERROR_MESSAGE =
  'Customer API returned an unexpected response. Check runtime-config.js customerApiBaseUrl and backend routing.';

const SESSION_INACTIVITY_SECONDS = 60 * 60 * 24 * 15;
const SESSION_INACTIVITY_MS = SESSION_INACTIVITY_SECONDS * 1000;
const SESSION_ACTIVITY_COOKIE = 'customer_last_activity_at';

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

function setCookie(name, value, maxAgeSeconds = SESSION_INACTIVITY_SECONDS) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function removeCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function dispatchSessionExpired(reason = 'expired') {
  window.dispatchEvent(new CustomEvent('soucul:customer-session-expired', { detail: { reason } }));
}

class CustomerAPI {
  constructor() {
    this.baseURL = CUSTOMER_API_BASE_URL;
    this.token = getCookie('customer_token') || null;

    if (this.token) {
      if (this.isSessionStale()) {
        this.expireSession('inactivity');
      } else {
        this.touchSessionActivity();
      }
    }
  }

  isSessionStale() {
    const raw = getCookie(SESSION_ACTIVITY_COOKIE);
    if (!raw) return false;

    const lastActivityAt = Number(raw);
    if (!Number.isFinite(lastActivityAt) || lastActivityAt <= 0) return false;

    return Date.now() - lastActivityAt > SESSION_INACTIVITY_MS;
  }

  touchSessionActivity() {
    if (!this.token) return;

    const now = String(Date.now());
    setCookie(SESSION_ACTIVITY_COOKIE, now, SESSION_INACTIVITY_SECONDS);
    setCookie('customer_token', this.token, SESSION_INACTIVITY_SECONDS);

    const userJson = getCookie('customer_user');
    if (userJson) {
      setCookie('customer_user', userJson, SESSION_INACTIVITY_SECONDS);
    }
  }

  expireSession(reason = 'expired') {
    this.token = null;
    removeCookie('customer_token');
    removeCookie('customer_user');
    removeCookie(SESSION_ACTIVITY_COOKIE);
    dispatchSessionExpired(reason);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const sameOriginUrl = `${SAME_ORIGIN_BASE_URL}${endpoint}`;
    const canRetrySameOrigin =
      !!this.baseURL &&
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

    if (this.token && !options.skipAuth && this.isSessionStale()) {
      this.expireSession('inactivity');
      throw new Error('Session expired due to inactivity. Please log in again.');
    }

    if (this.token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      let response;
      let usedFallbackBaseUrl = false;

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
          lowered.includes('networkerror') ||
          lowered.includes('name_not_resolved');

        if (!canRetrySameOrigin || !isNetworkFailure) {
          throw primaryError;
        }

        response = await fetch(sameOriginUrl, {
          ...options,
          headers
        });
        usedFallbackBaseUrl = true;
      }

      if (usedFallbackBaseUrl) {
        this.baseURL = SAME_ORIGIN_BASE_URL;
      }

      // Read the body as text first so we can handle empty bodies (204, etc.)
      // and non-JSON error pages without throwing "Unexpected end of JSON input".
      const rawText = await response.text();
      let data = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          const compact = rawText.slice(0, 120).replace(/\s+/g, ' ').trim().toLowerCase();
          if (compact.startsWith('<!doctype') || compact.startsWith('<html')) {
            throw new Error(`${API_CONFIG_ERROR_MESSAGE} Received HTML instead of JSON.`);
          }

          const snippet = rawText.slice(0, 120).replace(/\s+/g, ' ').trim();
          throw new Error(
            `Server returned ${response.status} ${response.statusText || ''} with non-JSON body${snippet ? `: ${snippet}` : ''}`
          );
        }
      }

      if (!response.ok) {
        if (response.status === 401 && !options.skipAuth) {
          this.expireSession('unauthorized');
        }

        throw new Error(
          (data && data.message) || `Request failed with status ${response.status}`
        );
      }

      if (this.token && !options.skipAuth) {
        const refreshedToken = response.headers.get('X-Auth-Token');
        if (refreshedToken) {
          this.token = refreshedToken;
        }
        this.touchSessionActivity();
      }

      // Empty 2xx response (e.g. 204 No Content) — return a minimal success envelope
      // so callers that read result.success / result.data don't crash.
      return data ?? { success: true, data: null };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async register(firstName, lastName, email, password) {
    return await this.request('/api/v1/customer/auth/register', {
      method: 'POST',
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password }),
      skipAuth: true
    });
  }

  async login(email, password) {
    const result = await this.request('/api/v1/customer/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true
    });

    if (result.success && result.data.token) {
      this.token = result.data.token;
      setCookie('customer_token', result.data.token, SESSION_INACTIVITY_SECONDS);
      setCookie('customer_user', JSON.stringify(result.data.user), SESSION_INACTIVITY_SECONDS);
      this.touchSessionActivity();
    }

    return result;
  }

  logout() {
    this.token = null;
    removeCookie('customer_token');
    removeCookie('customer_user');
    removeCookie(SESSION_ACTIVITY_COOKIE);
  }

  // Profile
  async getProfile() {
    return await this.request('/api/v1/customer/profile');
  }

  async updateProfile(data) {
    return await this.request('/api/v1/customer/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);

    return await this.request('/api/v1/customer/profile/photo', {
      method: 'POST',
      body: formData
    });
  }

  async changePassword(currentPassword, newPassword, confirmPassword) {
    return await this.request('/api/v1/customer/profile/password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });
  }

  // Products
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/customer/products${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint, { skipAuth: true });
  }

  async getProduct(productId) {
    return await this.request(`/api/v1/customer/products/${productId}`, { skipAuth: true });
  }

  async getLocations() {
    return await this.request('/api/v1/customer/locations', { skipAuth: true });
  }

  // Cart
  async getCart() {
    return await this.request('/api/v1/customer/cart');
  }

  async addToCart(productId, quantity) {
    return await this.request('/api/v1/customer/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity })
    });
  }

  async updateCartItem(itemId, quantity) {
    return await this.request(`/api/v1/customer/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity })
    });
  }

  async removeCartItem(itemId) {
    return await this.request(`/api/v1/customer/cart/${itemId}`, {
      method: 'DELETE'
    });
  }

  // Orders
  async getOrders() {
    return await this.request('/api/v1/customer/orders');
  }

  async getOrder(orderId) {
    return await this.request(`/api/v1/customer/orders/${orderId}`);
  }

  async checkout(data) {
    return await this.request('/api/v1/customer/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Wishlist
  async getWishlist() {
    return await this.request('/api/v1/customer/wishlist');
  }

  async addToWishlist(productId) {
    return await this.request('/api/v1/customer/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId })
    });
  }

  async removeFromWishlist(productId) {
    return await this.request(`/api/v1/customer/wishlist/${productId}`, {
      method: 'DELETE'
    });
  }

  // Addresses
  async getAddresses() {
    return await this.request('/api/v1/customer/addresses');
  }

  async addAddress(data) {
    return await this.request('/api/v1/customer/addresses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateAddress(addressId, data) {
    return await this.request(`/api/v1/customer/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteAddress(addressId) {
    return await this.request(`/api/v1/customer/addresses/${addressId}`, {
      method: 'DELETE'
    });
  }

  // Payment methods
  async getPaymentMethods() {
    return await this.request('/api/v1/customer/payment-methods');
  }

  async addPaymentMethod(data) {
    return await this.request('/api/v1/customer/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePaymentMethod(methodId, data) {
    return await this.request(`/api/v1/customer/payment-methods/${methodId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deletePaymentMethod(methodId) {
    return await this.request(`/api/v1/customer/payment-methods/${methodId}`, {
      method: 'DELETE'
    });
  }

  // Security
  async getSecuritySettings() {
    return await this.request('/api/v1/customer/security');
  }

  async updateSecuritySettings(data) {
    return await this.request('/api/v1/customer/security', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async getLoginActivity() {
    return await this.request('/api/v1/customer/security/login-activity');
  }

  async getLinkedAccounts() {
    return await this.request('/api/v1/customer/security/linked-accounts');
  }

  // Reviews
  async getReviews() {
    return await this.request('/api/v1/customer/reviews');
  }

  async createReview(data) {
    return await this.request('/api/v1/customer/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteReview(reviewId) {
    return await this.request(`/api/v1/customer/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  }

  // Health check
  async healthCheck() {
    return await this.request('/api/v1/customer/health', { skipAuth: true });
  }

  // Notifications
  async getNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/customer/notifications${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async getUnreadNotificationCount() {
    return await this.request('/api/v1/customer/notifications/unread-count');
  }

  async markNotificationRead(notificationId) {
    return await this.request(`/api/v1/customer/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  async markAllNotificationsRead() {
    return await this.request('/api/v1/customer/notifications/read-all', {
      method: 'PATCH'
    });
  }

  async getNotificationSettings() {
    return await this.request('/api/v1/customer/notification-settings');
  }

  async updateNotificationSettings(settings) {
    return await this.request('/api/v1/customer/notification-settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  }
}

// Create and export a singleton instance
const customerAPI = new CustomerAPI();

// Make available globally
window.CustomerAPI = customerAPI;
window.customerAPI = customerAPI;