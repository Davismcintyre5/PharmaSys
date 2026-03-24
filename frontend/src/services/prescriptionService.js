import api from './api'

export const getPrescriptions = async () => {
  const response = await api.get('/prescriptions')
  return response.data
}

export const getPrescriptionById = async (id) => {
  const response = await api.get(`/prescriptions/${id}`)
  return response.data
}

export const createPrescription = async (prescriptionData) => {
  const response = await api.post('/prescriptions', prescriptionData)
  return response.data
}

export const updatePrescriptionStatus = async (id, status, paymentMethod = 'cash') => {
  const response = await api.put(`/prescriptions/${id}`, { status, paymentMethod })
  return response.data
}