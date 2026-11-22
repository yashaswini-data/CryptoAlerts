import api from './api';

export const getNotifications = async (unreadOnly = false) => {
  const response = await api.get('/notifications', {
    params: { unreadOnly }
  });
  return response.data;
};

export const getNotification = async (id) => {
  const response = await api.get(`/notifications/${id}`);
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export default {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead
};
