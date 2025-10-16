// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://favourite-elaina-osca-ado-e60a58b9.koyeb.app',
  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// API endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    PROFILE: '/auth/profile',
  },
  
  // Testnet management endpoints
  TESTNETS: {
    LIST: '/testnets',
    CREATE: '/testnets',
    GET: (id) => `/testnets/${id}`,
    UPDATE: (id) => `/testnets/${id}`,
    DELETE: (id) => `/testnets/${id}`,
    COMPLETE: (id) => `/testnets/${id}/complete`,
    STATS: '/testnets/stats',
  },
  
  // Faucet library endpoints
  FAUCETS: {
    LIST: '/faucets',
    SEARCH: '/faucets/search',
    GET: (id) => `/faucets/${id}`,
    CHAINS: '/faucets/chains',
    NETWORKS: '/faucets/networks',
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
    SETTINGS: '/notifications/settings',
    SUBSCRIBE: '/notifications/subscribe',
  },
  
  // User management endpoints
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
    DELETE_ACCOUNT: '/users/account',
  },
};

export default API_CONFIG;