import api from './api';

/**
 * Project Service for handling project-related API calls
 */
const projectService = {
  /**
   * Get all projects
   * @param {Object} filters - Optional filters for projects
   * @returns {Promise} Promise with project data
   */
  getAllProjects(filters = {}) {
    return api.get('/projects', { params: filters });
  },

  /**
   * Get projects assigned to the current user
   * @returns {Promise} Promise with user's project data
   */
  getUserProjects() {
    return api.get('/projects/assigned');
  },

  /**
   * Get a project by ID
   * @param {string|number} id - The project ID
   * @returns {Promise} Promise with project data
   */
  getProjectById(id) {
    return api.get(`/projects/${id}`);
  },

  /**
   * Create a new project
   * @param {Object} projectData - Project data to create
   * @returns {Promise} Promise with created project
   */
  createProject(projectData) {
    return api.post('/projects', projectData);
  },

  /**
   * Update an existing project
   * @param {string|number} id - The project ID
   * @param {Object} projectData - Updated project data
   * @returns {Promise} Promise with updated project
   */
  updateProject(id, projectData) {
    return api.put(`/projects/${id}`, projectData);
  },

  /**
   * Delete a project
   * @param {string|number} id - The project ID
   * @returns {Promise} Promise with deletion result
   */
  deleteProject(id) {
    return api.delete(`/projects/${id}`);
  },

  /**
   * Get project team members
   * @param {string|number} id - The project ID
   * @returns {Promise} Promise with project team data
   */
  getProjectTeam(id) {
    return api.get(`/projects/${id}/team`);
  }
};

export default projectService; 