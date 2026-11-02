/**
 * Provider / Technician Management Service
 * Path: src/services/providerService.js
 */

import api from './api';

export const providerService = {
  /**
   * Search and filter public provider profiles
   * @param {Object} params - { q, category, minRating, maxPrice, emergencyOnly, page, limit }
   * @returns {Promise<Array>} List of providers
   */
  async searchProviders(params = {}) {
    const response = await api.get('/customer/providers/search', { params });
    return response.data.providers || response.data;
  },

  /**
   * Fetch public provider profile details including services and reviews
   * @param {string} providerId
   * @returns {Promise<Object>} { provider, services, reviews }
   */
  async getProviderProfile(providerId) {
    const response = await api.get(`/customer/providers/${providerId}`);
    return response.data;
  },

  /**
   * Fetch provider dashboard overview stats & earnings summary
   * @returns {Promise<Object>} { totalEarnings, jobsCompleted, activeJobs, rating }
   */
  async getDashboardOverview() {
    const response = await api.get('/provider/dashboard/stats');
    return response.data;
  },

  /**
   * Update provider profile details (bio, hourly rate, coverage radius, working hours)
   * @param {Object} profileData
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(profileData) {
    const response = await api.put('/provider/profile', profileData);
    return response.data.provider || response.data;
  },

  /**
   * Fetch service catalog offered by the logged-in provider
   * @returns {Promise<Array>} List of services
   */
  async getOfferedServices() {
    const response = await api.get('/provider/services');
    return response.data.services || response.data;
  },

  /**
   * Add a new service offering to provider profile
   * @param {Object} serviceData - { title, category, basePrice, estimatedDuration, description }
   * @returns {Promise<Object>} Created service
   */
  async addService(serviceData) {
    const response = await api.post('/provider/services', serviceData);
    return response.data.service || response.data;
  },

  /**
   * Update an existing service catalog item
   * @param {string} serviceId
   * @param {Object} serviceData
   * @returns {Promise<Object>}
   */
  async updateService(serviceId, serviceData) {
    const response = await api.put(`/provider/services/${serviceId}`, serviceData);
    return response.data.service || response.data;
  },

  /**
   * Delete a service catalog item
   * @param {string} serviceId
   * @returns {Promise<Object>}
   */
  async deleteService(serviceId) {
    const response = await api.delete(`/provider/services/${serviceId}`);
    return response.data;
  },

  /**
   * Toggle provider availability status for standard or SOS emergency dispatches
   * @param {boolean} isAvailable
   * @param {boolean} isEmergencyAvailable
   * @returns {Promise<Object>}
   */
  async toggleAvailability(isAvailable, isEmergencyAvailable = false) {
    const response = await api.patch('/provider/availability', {
      isAvailable,
      isEmergencyAvailable,
    });
    return response.data;
  },

  /**
   * Upload verification documents (certification, license, background check)
   * @param {FormData} formData - Multipart form containing document files
   * @returns {Promise<Object>}
   */
  async uploadVerificationDoc(formData) {
    const response = await api.post('/provider/verification/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default providerService;