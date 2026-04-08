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

class CustomerAPI {
  constructor() {
    this.baseURL = CUSTOMER_API_BASE_URL;
    this.token = getCookie('customer_token') || null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Read the body as text first so we can handle empty bodies (204, etc.)
      // and non-JSON error pages without throwing "Unexpected end of JSON input".
      const rawText = await response.text();
      let data = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          const snippet = rawText.slice(0, 120).replace(/\s+/g, ' ').trim();
          throw new Error(
            `Server returned ${response.status} ${response.statusText || ''} with non-JSON body${snippet ? `: ${snippet}` : ''}`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          (data && data.message) || `Request failed with status ${response.status}`
        );
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
      setCookie('customer_token', result.data.token);
      setCookie('customer_user', JSON.stringify(result.data.user));
    }

    return result;
  }

  logout() {
    this.token = null;
    removeCookie('customer_token');
    removeCookie('customer_user');
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