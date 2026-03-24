import api from './api';

export const getWithdrawals = async (params = {}) => {
  const response = await api.get('/withdrawals', { params });
  return response.data;
};

export const getWithdrawalById = async (id) => {
  const response = await api.get(`/withdrawals/${id}`);
  return response.data;
};

export const requestWithdrawal = async (data) => {
  const response = await api.post('/withdrawals', data);
  return response.data;
};

export const approveWithdrawal = async (id) => {
  const response = await api.put(`/withdrawals/${id}/approve`);
  return response.data;
};

export const rejectWithdrawal = async (id, reason) => {
  const response = await api.put(`/withdrawals/${id}/reject`, { reason });
  return response.data;
};

export const printWithdrawal = async (id) => {
  const response = await api.get(`/withdrawals/${id}/print`, { responseType: 'text' });
  return response.data;
};