/**
 * Authentication Service
 * Path: src/services/authService.js
 */

import api from './api';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export const authService = {
  /**
   * Log in user with credentials
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { user, token, refreshToken }
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    const { token, refreshToken } = response.data;
    const user = response.data.user || response.data;

    if (token) {
      this.setSession(token, refreshToken, user);
    }
    return response.data;
  },

  /**
   * Register a new user account
   * @param {Object} userData - { name, email, password, phone, role }
   * @returns {Promise<Object>}
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    const { user, token, refreshToken } = response.data;

    if (token) {
      this.setSession(token, refreshToken, user);
    }
    return response.data;
  },

  /**
   * Select or update user role (e.g., customer or provider)
   * @param {string} role - 'customer' | 'provider'
   * @returns {Promise<Object>} Updated user object
   */
  async selectRole(role) {
    const response = await api.post('/auth/select-role', { role });
    const updatedUser = response.data.user || response.data;

    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const mergedUser = { ...currentUser, role: updatedUser.role || role };
      this.setUser(mergedUser);
    }

    return updatedUser;
  },

  /**
   * Fetch latest profile of authenticated user
   * @returns {Promise<Object>}
   */
  async getProfile() {
    const response = await api.get('/auth/me');
    const user = response.data.user || response.data;
    this.setUser(user);
    return user;
  },

  /**
   * Refresh JWT auth token using stored refresh token
   * @returns {Promise<string>} New JWT access token
   */
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await api.post('/auth/refresh-token', { refreshToken });
    const { token, refreshToken: newRefreshToken } = response.data;

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }
    }
    return token;
  },

  /**
   * Log out user and clear session state
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore API logout errors and clear client session regardless
    } finally {
      this.clearSession();
    }
  },

  /**
   * Save session data to local storage
   */
  setSession(token, refreshToken, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Update stored user data
   */
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Clear all local authentication credentials
   */
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Retrieve stored access token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Retrieve stored refresh token
   * @returns {string|null}
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Retrieve stored user object
   * @returns {Object|null}
   */
  getCurrentUser() {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  },

  /**
   * Check if access token is present
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authService;