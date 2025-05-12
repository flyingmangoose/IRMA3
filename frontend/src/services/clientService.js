import api from './api';

/**
 * Client Service for handling client-related API calls
 */
const clientService = {
  /**
   * Get all clients
   * @param {Object} filters - Optional filters for clients
   * @returns {Promise} Promise with client data
   */
  getAllClients(filters = {}) {
    return api.get('/clients', { params: filters });
  },

  /**
   * Get a client by ID
   * @param {string|number} id - The client ID
   * @returns {Promise} Promise with client data
   */
  getClientById(id) {
    return api.get(`/clients/${id}`);
  },

  /**
   * Create a new client
   * @param {Object} clientData - Client data to create
   * @returns {Promise} Promise with created client
   */
  createClient(clientData) {
    return api.post('/clients', clientData);
  },

  /**
   * Update an existing client
   * @param {string|number} id - The client ID
   * @param {Object} clientData - Updated client data
   * @returns {Promise} Promise with updated client
   */
  updateClient(id, clientData) {
    return api.put(`/clients/${id}`, clientData);
  },

  /**
   * Delete a client
   * @param {string|number} id - The client ID
   * @returns {Promise} Promise with deletion result
   */
  deleteClient(id) {
    return api.delete(`/clients/${id}`);
  },

  /**
   * Get projects for a client
   * @param {string|number} id - The client ID
   * @returns {Promise} Promise with client projects data
   */
  getClientProjects(id) {
    return api.get(`/clients/${id}/projects`);
  }
};

export default clientService; 