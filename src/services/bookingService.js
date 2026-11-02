/**
 * Booking & Dispatch Service
 * Path: src/services/bookingService.js
 */

import api from './api';

export const bookingService = {
  /**
   * Create a standard service booking request
   * @param {Object} bookingData - { providerId, serviceId, date, timeSlot, address, notes, estimatedPrice }
   * @returns {Promise<Object>} Created booking response
   */
  async createBooking(bookingData) {
    const response = await api.post('/customer/bookings', bookingData);
    return response.data;
  },

  /**
   * Dispatch an immediate SOS emergency booking
   * @param {Object} emergencyData - { category, description, location: { lat, lng, address }, photos }
   * @returns {Promise<Object>} Emergency dispatch confirmation
   */
  async createEmergencyBooking(emergencyData) {
    const response = await api.post('/customer/bookings/emergency', {
      ...emergencyData,
      isEmergency: true,
      requestedAt: new Date().toISOString(),
    });
    return response.data;
  },

  /**
   * Fetch customer bookings list with optional filter
   * @param {Object} [params] - { status: 'pending'|'accepted'|'completed'|'cancelled', page, limit }
   * @returns {Promise<Array>} Array of booking items
   */
  async getCustomerBookings(params = {}) {
    const response = await api.get('/customer/bookings', { params });
    return response.data.bookings || response.data;
  },

  /**
   * Fetch specific booking details by ID
   * @param {string} bookingId
   * @returns {Promise<Object>}
   */
  async getBookingById(bookingId) {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data.booking || response.data;
  },

  /**
   * Fetch provider assigned jobs/requests
   * @param {Object} [params] - { status, date }
   * @returns {Promise<Array>}
   */
  async getProviderJobs(params = {}) {
    const response = await api.get('/provider/jobs', { params });
    return response.data.jobs || response.data;
  },

  /**
   * Update booking status (e.g., accepted, ongoing, completed, cancelled)
   * @param {string} bookingId
   * @param {string} status - 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled'
   * @param {Object} [extraData] - Additional payload like completion notes or cancellation reason
   * @returns {Promise<Object>} Updated booking object
   */
  async updateBookingStatus(bookingId, status, extraData = {}) {
    const response = await api.patch(`/bookings/${bookingId}/status`, {
      status,
      ...extraData,
    });
    return response.data.booking || response.data;
  },

  /**
   * Cancel an active booking
   * @param {string} bookingId
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async cancelBooking(bookingId, reason) {
    return this.updateBookingStatus(bookingId, 'cancelled', { cancellationReason: reason });
  },

  /**
   * Rate and review a completed booking
   * @param {string} bookingId
   * @param {Object} reviewData - { rating: number, comment: string }
   * @returns {Promise<Object>}
   */
  async submitBookingReview(bookingId, reviewData) {
    const response = await api.post(`/bookings/${bookingId}/review`, reviewData);
    return response.data;
  },
};

export default bookingService;