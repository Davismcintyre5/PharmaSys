import api from './api'

export const getReceiptHtml = async (transactionId) => {
  const response = await api.get(`/receipts/${transactionId}`, { responseType: 'text' })
  return response.data
}