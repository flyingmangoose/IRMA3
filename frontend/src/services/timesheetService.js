import api from './api';

/**
 * Timesheet Service for handling timesheet-related API calls
 */
const timesheetService = {
  /**
   * Get the current user's timesheet for a specific period
   * @param {string} startDate - Period start date (YYYY-MM-DD)
   * @param {string} endDate - Period end date (YYYY-MM-DD)
   * @returns {Promise} Promise with timesheet data
   */
  getCurrentTimesheet(startDate, endDate) {
    return api.get('/timesheets/current', { params: { startDate, endDate } });
  },

  /**
   * Get a list of timesheets for a user
   * @param {Object} filters - Filters like status, date range, etc.
   * @returns {Promise} Promise with timesheets data
   */
  getTimesheets(filters = {}) {
    return api.get('/timesheets', { params: filters });
  },

  /**
   * Get a specific timesheet by ID
   * @param {string|number} id - Timesheet ID
   * @returns {Promise} Promise with timesheet data
   */
  getTimesheet(id) {
    return api.get(`/timesheets/${id}`);
  },

  /**
   * Create a new timesheet
   * @param {Object} timesheetData - Timesheet data
   * @returns {Promise} Promise with created timesheet
   */
  createTimesheet(timesheetData) {
    return api.post('/timesheets', timesheetData);
  },

  /**
   * Update an existing timesheet
   * @param {string|number} id - Timesheet ID
   * @param {Object} timesheetData - Updated timesheet data
   * @returns {Promise} Promise with updated timesheet
   */
  updateTimesheet(id, timesheetData) {
    return api.put(`/timesheets/${id}`, timesheetData);
  },

  /**
   * Save timesheet entries in batch
   * @param {Array} entries - Array of time entries
   * @returns {Promise} Promise with saved entries
   */
  saveEntries(entries) {
    return api.post('/timeentries/batch', { entries });
  },

  /**
   * Submit a timesheet for approval
   * @param {string|number} id - Timesheet ID
   * @returns {Promise} Promise with submission result
   */
  submitTimesheet(id) {
    return api.post(`/timesheets/${id}/submit`);
  },

  /**
   * Approve a timesheet
   * @param {string|number} id - Timesheet ID
   * @param {Object} data - Approval data (comments, etc.)
   * @returns {Promise} Promise with approval result
   */
  approveTimesheet(id, data = {}) {
    return api.post(`/timesheets/${id}/approve`, data);
  },

  /**
   * Reject a timesheet
   * @param {string|number} id - Timesheet ID
   * @param {Object} data - Rejection data (reason, comments)
   * @returns {Promise} Promise with rejection result
   */
  rejectTimesheet(id, data) {
    return api.post(`/timesheets/${id}/reject`, data);
  }
};

export default timesheetService; 