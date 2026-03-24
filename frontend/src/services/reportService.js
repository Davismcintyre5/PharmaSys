import api from './api'

export const getSalesReportData = async (from, to) => {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const response = await api.get(`/reports/sales?${params}`)
  return response.data
}

export const getInventoryReportData = async () => {
  const response = await api.get('/reports/inventory')
  return response.data
}

export const printSalesReport = async (from, to) => {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const response = await api.get(`/reports/sales/print?${params}`, { responseType: 'blob' })
  return response
}