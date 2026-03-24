import api from './api';

export const getBalance = async () => {
  const response = await api.get('/accounts/balance');
  return response.data;
};

export const getPendingApprovals = async () => {
  const response = await api.get('/accounts/pending-approvals');
  return response.data;
};

export const getTransactions = async (params = {}) => {
  const response = await api.get('/accounts/transactions', { params });
  return response.data;
};

export const approveTransaction = async (id) => {
  const response = await api.put(`/accounts/transactions/${id}/approve`);
  return response.data;
};

export const rejectTransaction = async (id, reason) => {
  const response = await api.put(`/accounts/transactions/${id}/reject`, { reason });
  return response.data;
};