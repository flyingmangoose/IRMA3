import api from './api';

/**
 * Resource Service for handling resource/user-related API calls
 */
const resourceService = {
  /**
   * Get all resources/users
   * @param {Object} filters - Optional filters for resources
   * @returns {Promise} Promise with resource data
   */
  getAllResources(filters = {}) {
    return api.get('/users', { params: filters });
  },

  /**
   * Get a resource/user by ID
   * @param {string|number} id - The resource ID
   * @returns {Promise} Promise with resource data
   */
  getResourceById(id) {
    return api.get(`/users/${id}`);
  },

  /**
   * Create a new resource/user
   * @param {Object} resourceData - Resource data to create
   * @returns {Promise} Promise with created resource
   */
  createResource(resourceData) {
    return api.post('/users', resourceData);
  },

  /**
   * Update an existing resource/user
   * @param {string|number} id - The resource ID
   * @param {Object} resourceData - Updated resource data
   * @returns {Promise} Promise with updated resource
   */
  updateResource(id, resourceData) {
    return api.put(`/users/${id}`, resourceData);
  },

  /**
   * Delete a resource/user
   * @param {string|number} id - The resource ID
   * @returns {Promise} Promise with deletion result
   */
  deleteResource(id) {
    return api.delete(`/users/${id}`);
  },

  /**
   * Get projects assigned to a resource/user
   * @param {string|number} id - The resource ID
   * @returns {Promise} Promise with resource projects data
   */
  getResourceProjects(id) {
    return api.get(`/users/${id}/projects`);
  },

  /**
   * Get a resource's skills
   * @param {string|number} id - The resource ID
   * @returns {Promise} Promise with resource skills data
   */
  getResourceSkills(id) {
    return api.get(`/users/${id}/skills`);
  },

  /**
   * Update a resource's skills
   * @param {string|number} id - The resource ID
   * @param {Array} skills - Array of skill objects
   * @returns {Promise} Promise with updated skills
   */
  updateResourceSkills(id, skills) {
    return api.put(`/users/${id}/skills`, { skills });
  },

  /**
   * Get skill usage report across resources
   * @param {Object} filters - Filters for the report
   * @returns {Promise} Promise with skill usage report
   */
  getSkillsReport(filters = {}) {
    return api.get('/reports/skills', { params: filters });
  },

  /**
   * Get resource report with detailed stats
   * @param {Object} filters - Filters for the report
   * @returns {Promise} Promise with resource report data
   */
  getResourcesReport(filters = {}) {
    return api.get('/reports/resources', { params: filters });
  }
};

export default resourceService; 