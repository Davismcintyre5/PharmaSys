import api from './api';

export const getBalance = () => api.get('/accounts/balance');
export const getTransactions = () => api.get('/accounts/transactions');
export const getTransaction = (id) => api.get(`/accounts/transactions/${id}`);
export const createTransaction = (data) => api.post('/accounts/transactions', data);
export const updateTransaction = (id, data) => api.put(`/accounts/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/accounts/transactions/${id}`);