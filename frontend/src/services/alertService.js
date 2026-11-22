import api from './api';

export const createAlert = async (alertData) => {
  const response = await api.post('/alerts', alertData);
  return response.data;
};

export const getAlerts = async (status = '') => {
  const params = {};
  if (status && status !== 'ALL') {
    params.status = status;
  }
  const response = await api.get('/alerts', { params });
  return response.data;
};

export const getAlert = async (id) => {
  const response = await api.get(`/alerts/${id}`);
  return response.data;
};

export const updateAlert = async (id, updateData) => {
  const response = await api.patch(`/alerts/${id}`, updateData);
  return response.data;
};

export const pauseAlert = async (id) => {
  const response = await api.patch(`/alerts/${id}/pause`);
  return response.data;
};

export const resumeAlert = async (id) => {
  const response = await api.patch(`/alerts/${id}/resume`);
  return response.data;
};

export const deleteAlert = async (id) => {
  const response = await api.delete(`/alerts/${id}`);
  return response.data;
};

export default {
  createAlert,
  getAlerts,
  getAlert,
  updateAlert,
  pauseAlert,
  resumeAlert,
  deleteAlert
};
