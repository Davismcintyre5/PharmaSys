import api from './api';

export const getTransactions = async (params = {}) => {
  const response = await api.get('/transactions', { params });
  return response.data;
};

export const getTransactionById = async (id) => {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
};

export const createTransaction = async (data) => {
  const response = await api.post('/transactions', data);
  return response.data;
};

export const updateTransaction = async (id, data) => {
  const response = await api.put(`/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

export const printTransaction = async (id) => {
  const response = await api.get(`/transactions/${id}/print`, { responseType: 'text' });
  return response.data;
};