import api from './api';

// Profile
export const getProfile = async () => {
  const response = await api.get('/settings/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/settings/profile', data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.put('/settings/profile/password', data);
  return response.data;
};

// Users (admin/manager only)
export const getUsers = async () => {
  const response = await api.get('/settings/users');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/settings/users', userData);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`/settings/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/settings/users/${userId}`);
  return response.data;
};

// Pharmacy info (admin/manager only)
export const getPharmacySettings = async () => {
  const response = await api.get('/settings/pharmacy');
  return response.data;
};

export const updatePharmacySettings = async (settings) => {
  const response = await api.put('/settings/pharmacy', settings);
  return response.data;
};