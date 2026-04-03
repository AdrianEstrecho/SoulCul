// Admin API Service Layer
// Connects the frontend admin panel to the PHP backend API

const isLocalVitePort =
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  /^517\d$/.test(window.location.port || '');

const API_BASE_URL = (
  window.SOUCUL_ADMIN_API_BASE_URL ||
  (isLocalVitePort ? '' : 'http://localhost:8000')
).replace(/\/+$/, '');

class AdminAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('admin_token') || null;
  }

  // Helper method to make authenticated requests
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

  // Authentication
  async login(email, password) {
    const result = await this.request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true
    });

    if (result.success && result.data.token) {
      this.token = result.data.token;
      localStorage.setItem('admin_token', result.data.token);
      localStorage.setItem('admin_user', JSON.stringify(result.data.admin));
    }

    return result;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  async getProfile() {
    return await this.request('/api/v1/admin/profile');
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

  async updateProductInventory(productId, quantity) {
    return await this.request(`/api/v1/admin/products/${productId}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity_in_stock: quantity })
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

  // Health check
  async healthCheck() {
    return await this.request('/health', { skipAuth: true });
  }
  async getVouchers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/vouchers${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async getVoucherDetails(voucherId) {
    return await this.request(`/api/v1/admin/vouchers/${voucherId}`);
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

  async toggleVoucherStatus(voucherId) {
    return await this.request(`/api/v1/admin/vouchers/${voucherId}/toggle`, {
      method: 'PATCH'
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

  async permanentlyDeleteProduct(productId) {
    return await this.request(`/api/v1/admin/archive/products/${productId}`, {
      method: 'DELETE'
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

  async permanentlyDeleteUser(userId) {
    return await this.request(`/api/v1/admin/archive/users/${userId}`, {
      method: 'DELETE'
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

  async permanentlyDeleteOrder(orderId) {
    return await this.request(`/api/v1/admin/archive/orders/${orderId}`, {
      method: 'DELETE'
    });
  }

  // ── AUDIT TRAIL ──────────────────────────────────────

  async getAuditLogs(params = {}) {
    // Supported params: action, entity, admin_id, date_from, date_to, page, limit
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/audit${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async exportAuditLogs(params = {}) {
    // Returns a downloadable CSV/JSON export of audit logs
    const queryString = new URLSearchParams({ ...params, export: 'csv' }).toString();
    const endpoint = `/api/v1/admin/audit/export?${queryString}`;
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

  async getActiveSessions() {
    return await this.request('/api/v1/admin/profile/sessions');
  }

  async revokeAllSessions() {
    return await this.request('/api/v1/admin/profile/sessions', {
      method: 'DELETE'
    });
  }

  // ── DASHBOARD EXTRAS ─────────────────────────────────

  async getSalesAnalytics(params = {}) {
    // params: { period: 'daily' | 'weekly' | 'monthly', date_from, date_to }
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/admin/dashboard/analytics${queryString ? '?' + queryString : ''}`;
    return await this.request(endpoint);
  }

  async getTopProducts(limit = 5) {
    return await this.request(`/api/v1/admin/dashboard/top-products?limit=${limit}`);
  }

  async getLowStockAlerts(threshold = 10) {
    return await this.request(`/api/v1/admin/dashboard/low-stock?threshold=${threshold}`);
  }

  // ── UTILITY HELPERS ──────────────────────────────────

  isAuthenticated() {
    return !!this.token;
  }

  getStoredAdmin() {
    try {
      const raw = localStorage.getItem('admin_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setBaseURL(url) {
    this.baseURL = url;
  }

}



// Create and export a singleton instance
// const adminAPI = new AdminAPI();
