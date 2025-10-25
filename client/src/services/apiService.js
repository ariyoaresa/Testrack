import API_CONFIG, { API_ENDPOINTS } from '../config/api.js';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.defaultHeaders = API_CONFIG.HEADERS;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('authToken', token);
  }

  // Remove auth token from localStorage
  removeAuthToken() {
    localStorage.removeItem('authToken');
  }

  // Get headers with authentication
  getHeaders(includeAuth = true) {
    const headers = { ...this.defaultHeaders };
    
    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: this.getHeaders(options.includeAuth !== false),
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      // Handle authentication errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.removeAuthToken();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  async post(endpoint, data = {}, includeAuth = true) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth,
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.post(API_ENDPOINTS.AUTH.LOGIN, credentials, false);
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  async register(userData) {
    const response = await this.post(API_ENDPOINTS.AUTH.REGISTER, userData, false);
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      this.removeAuthToken();
    }
  }

  async forgotPassword(email) {
    return this.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }, false);
  }

  async resetPassword(resetData) {
    return this.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, resetData, false);
  }

  async getProfile() {
    return this.get(API_ENDPOINTS.AUTH.PROFILE);
  }

  async updateProfile(profileData) {
    return this.put(API_ENDPOINTS.AUTH.PROFILE, profileData);
  }

  // Testnet methods
  async getTestnets(params = {}) {
    return this.get(API_ENDPOINTS.TESTNETS.LIST, params);
  }

  async createTestnet(testnetData) {
    return this.post(API_ENDPOINTS.TESTNETS.CREATE, testnetData);
  }

  async getTestnet(id) {
    return this.get(API_ENDPOINTS.TESTNETS.GET(id));
  }

  async updateTestnet(id, testnetData) {
    return this.put(API_ENDPOINTS.TESTNETS.UPDATE(id), testnetData);
  }

  async deleteTestnet(id) {
    return this.delete(API_ENDPOINTS.TESTNETS.DELETE(id));
  }

  async completeTestnet(id) {
    return this.post(API_ENDPOINTS.TESTNETS.COMPLETE(id));
  }

  async getTestnetStats() {
    return this.get(API_ENDPOINTS.TESTNETS.STATS);
  }

  // Faucet methods
  async getFaucets(params = {}) {
    return this.get(API_ENDPOINTS.FAUCETS.LIST, params);
  }

  async searchFaucets(query, filters = {}) {
    return this.get(API_ENDPOINTS.FAUCETS.SEARCH, { q: query, ...filters });
  }

  async getFaucet(id) {
    return this.get(API_ENDPOINTS.FAUCETS.GET(id));
  }

  async getFaucetChains() {
    return this.get(API_ENDPOINTS.FAUCETS.CHAINS);
  }

  async getFaucetNetworks() {
    return this.get(API_ENDPOINTS.FAUCETS.NETWORKS);
  }

  // Notification methods
  async getNotifications(params = {}) {
    return this.get(API_ENDPOINTS.NOTIFICATIONS.LIST, params);
  }

  async markNotificationRead(id) {
    return this.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  }

  async markAllNotificationsRead() {
    return this.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  }

  async getNotificationSettings() {
    return this.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS);
  }

  async updateNotificationSettings(settings) {
    return this.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS, settings);
  }

  async subscribeToNotifications(subscription) {
    return this.post(API_ENDPOINTS.NOTIFICATIONS.SUBSCRIBE, subscription);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;