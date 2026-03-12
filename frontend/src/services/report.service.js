import api from './api';

export const getSalesReport = (params) => api.get('/reports/sales', { params });
export const getInventoryReport = () => api.get('/reports/inventory');
export const getFinancialReport = (params) => api.get('/reports/financial', { params });