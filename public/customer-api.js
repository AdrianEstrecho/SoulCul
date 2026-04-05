// Customer API Service Layer
// Connects the frontend to the PHP customer backend API

const CUSTOMER_API_BASE_URL = 'http://localhost:8000';

class CustomerAPI {
  constructor() {
    this.baseURL = CUSTOMER_API_BASE_URL;
    this.token = localStorage.getItem('customer_token') || null;
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async register(firstName, lastName, email, password) {
    return await this.request('/v1/customer/auth/register', {
      method: 'POST',
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password }),
      skipAuth: true
    });
  }

  async login(email, password) {
    const result = await this.request('/v1/customer/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true
    });

    if (result.success && result.data.token) {
      this.token = result.data.token;
      localStorage.setItem('customer_token', result.data.token);
      localStorage.setItem('customer_user', JSON.stringify(result.data.user));
    }

    return result;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
  }

  // Profile
  async getProfile() {
    return await this.request('/v1/customer/profile');
  }

  // Products
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/v1/customer/products${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint, { skipAuth: true });
  }

  async getProduct(productId) {
    return await this.request(`/v1/customer/products/${productId}`, { skipAuth: true });
  }

  // Cart
  async getCart() {
    return await this.request('/v1/customer/cart');
  }

  async addToCart(productId, quantity) {
    return await this.request('/v1/customer/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity })
    });
  }

  async updateCartItem(itemId, quantity) {
    return await this.request(`/v1/customer/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity })
    });
  }

  async removeCartItem(itemId) {
    return await this.request(`/v1/customer/cart/${itemId}`, {
      method: 'DELETE'
    });
  }

  // Orders
  async getOrders() {
    return await this.request('/v1/customer/orders');
  }

  async getOrder(orderId) {
    return await this.request(`/v1/customer/orders/${orderId}`);
  }

  async checkout(data) {
    return await this.request('/v1/customer/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Health check
  async healthCheck() {
    return await this.request('/health', { skipAuth: true });
  }
}

// Create and export a singleton instance
const customerAPI = new CustomerAPI();

// Make available globally
window.CustomerAPI = customerAPI;