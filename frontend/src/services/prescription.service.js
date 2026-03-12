import api from './api';

export const getPrescriptions = () => api.get('/prescriptions');
export const verifyPrescription = (id, status) => api.put(`/prescriptions/${id}`, { status });
// etc.