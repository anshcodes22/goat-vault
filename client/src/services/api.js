import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const problemService = {
  getProblems: async (params = {}) => {
    const response = await api.get('/problems', { params });
    return response.data;
  },

  getProblemById: async (id) => {
    const response = await api.get(`/problems/${id}`);
    return response.data;
  },

  createProblem: async (data) => {
    const response = await api.post('/problems', data);
    return response.data;
  },

  updateProblem: async (id, data) => {
    const response = await api.put(`/problems/${id}`, data);
    return response.data;
  },

  deleteProblem: async (id) => {
    const response = await api.delete(`/problems/${id}`);
    return response.data;
  },

  markAsRevisited: async (id, data = {}) => {
    const response = await api.post(`/problems/${id}/revisit`, data);
    return response.data;
  },

  getRevisionHistory: async (id) => {
    const response = await api.get(`/problems/${id}/revision-history`);
    return response.data;
  },

  addApproachVariant: async (id, variantData) => {
    const response = await api.post(`/problems/${id}/approaches`, variantData);
    return response.data;
  },

  updateApproachVariant: async (id, approachId, variantData) => {
    const response = await api.put(`/problems/${id}/approaches/${approachId}`, variantData);
    return response.data;
  },

  renameApproachVariant: async (id, approachId, name) => {
    const response = await api.patch(`/problems/${id}/approaches/${approachId}/rename`, { name });
    return response.data;
  },

  deleteApproachVariant: async (id, approachId) => {
    const response = await api.delete(`/problems/${id}/approaches/${approachId}`);
    return response.data;
  },
};

export const statsService = {
  getDashboardStats: async () => {
    const response = await api.get('/stats/dashboard');
    return response.data;
  },
};

export const tagService = {
  getTags: async () => {
    const response = await api.get('/tags');
    return response.data;
  },

  createTag: async (name) => {
    const response = await api.post('/tags', { name });
    return response.data;
  },
};

export default api;
