import api from './api';

export const getCoins = async (refresh = false) => {
  const response = await api.get('/coins', {
    params: { refresh }
  });
  return response.data;
};

export const getCoinPrice = async (coinId) => {
  const response = await api.get(`/coins/${coinId}/price`);
  return response.data;
};

export const getCoinHistory = async (coinId, days = 7) => {
  const response = await api.get(`/coins/${coinId}/history`, {
    params: { days }
  });
  return response.data;
};

export default {
  getCoins,
  getCoinPrice,
  getCoinHistory
};
