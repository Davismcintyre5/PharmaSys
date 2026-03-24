import api from './api'

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Private
export const getMedicines = async () => {
  try {
    const response = await api.get('/medicines')
    return response.data
  } catch (error) {
    console.error('Error fetching medicines:', error)
    throw error
  }
}

// @desc    Get single medicine by ID
// @route   GET /api/medicines/:id
// @access  Private
export const getMedicineById = async (id) => {
  try {
    const response = await api.get(`/medicines/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching medicine by ID:', error)
    throw error
  }
}

// @desc    Create a new medicine
// @route   POST /api/medicines
// @access  Private (admin/manager/pharmacist)
export const createMedicine = async (medicineData) => {
  try {
    const response = await api.post('/medicines', medicineData)
    return response.data
  } catch (error) {
    console.error('Error creating medicine:', error)
    throw error
  }
}

// @desc    Update a medicine
// @route   PUT /api/medicines/:id
// @access  Private (admin/manager/pharmacist)
export const updateMedicine = async (id, medicineData) => {
  try {
    const response = await api.put(`/medicines/${id}`, medicineData)
    return response.data
  } catch (error) {
    console.error('Error updating medicine:', error)
    throw error
  }
}

// @desc    Delete a medicine
// @route   DELETE /api/medicines/:id
// @access  Private (admin/manager)
export const deleteMedicine = async (id) => {
  try {
    const response = await api.delete(`/medicines/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting medicine:', error)
    throw error
  }
}

// @desc    Get low stock medicines (where currentStock <= reorderLevel)
// @route   GET /api/medicines/low-stock
// @access  Private
export const getLowStockMedicines = async () => {
  try {
    const response = await api.get('/medicines/low-stock')
    return response.data
  } catch (error) {
    console.error('Error fetching low stock medicines:', error)
    return []
  }
}

// @desc    Get medicines expiring within specified days
// @route   GET /api/medicines/expiring-soon?days=30
// @access  Private
export const getExpiringSoonMedicines = async (days = 30) => {
  try {
    const response = await api.get(`/medicines/expiring-soon?days=${days}`)
    return response.data
  } catch (error) {
    console.error('Error fetching expiring medicines:', error)
    return []
  }
}

// @desc    Update medicine stock quantity
// @route   PATCH /api/medicines/:id/stock
// @access  Private (admin/manager/pharmacist)
export const updateMedicineStock = async (id, quantity, operation = 'set') => {
  try {
    const response = await api.patch(`/medicines/${id}/stock`, { quantity, operation })
    return response.data
  } catch (error) {
    console.error('Error updating medicine stock:', error)
    throw error
  }
}

// @desc    Search medicines by name or generic name
// @route   GET /api/medicines/search?q=paracetamol
// @access  Private
export const searchMedicines = async (query) => {
  try {
    const response = await api.get(`/medicines/search?q=${encodeURIComponent(query)}`)
    return response.data
  } catch (error) {
    console.error('Error searching medicines:', error)
    return []
  }
}

// @desc    Get medicines by category
// @route   GET /api/medicines/category/:category
// @access  Private
export const getMedicinesByCategory = async (category) => {
  try {
    const response = await api.get(`/medicines/category/${encodeURIComponent(category)}`)
    return response.data
  } catch (error) {
    console.error('Error fetching medicines by category:', error)
    return []
  }
}

// @desc    Get medicines by supplier
// @route   GET /api/medicines/supplier/:supplierId
// @access  Private
export const getMedicinesBySupplier = async (supplierId) => {
  try {
    const response = await api.get(`/medicines/supplier/${supplierId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching medicines by supplier:', error)
    return []
  }
}

// @desc    Get medicine categories (distinct list)
// @route   GET /api/medicines/categories
// @access  Private
export const getMedicineCategories = async () => {
  try {
    const response = await api.get('/medicines/categories')
    return response.data
  } catch (error) {
    console.error('Error fetching medicine categories:', error)
    return []
  }
}

// @desc    Get total inventory value (sum of currentStock * unitPrice)
// @route   GET /api/medicines/inventory-value
// @access  Private
export const getInventoryValue = async () => {
  try {
    const response = await api.get('/medicines/inventory-value')
    return response.data
  } catch (error) {
    console.error('Error fetching inventory value:', error)
    return { totalValue: 0 }
  }
}

// @desc    Get medicines with expiry date within range
// @route   GET /api/medicines/expiry-range?from=2024-01-01&to=2024-12-31
// @access  Private
export const getMedicinesByExpiryRange = async (fromDate, toDate) => {
  try {
    const params = new URLSearchParams()
    if (fromDate) params.append('from', fromDate)
    if (toDate) params.append('to', toDate)
    const response = await api.get(`/medicines/expiry-range?${params}`)
    return response.data
  } catch (error) {
    console.error('Error fetching medicines by expiry range:', error)
    return []
  }
}

// @desc    Bulk import medicines (for initial setup or bulk updates)
// @route   POST /api/medicines/bulk
// @access  Private (admin/manager)
export const bulkImportMedicines = async (medicinesArray) => {
  try {
    const response = await api.post('/medicines/bulk', { medicines: medicinesArray })
    return response.data
  } catch (error) {
    console.error('Error bulk importing medicines:', error)
    throw error
  }
}

// @desc    Get expired medicines
// @route   GET /api/medicines/expired
// @access  Private
export const getExpiredMedicines = async () => {
  try {
    const response = await api.get('/medicines/expired')
    return response.data
  } catch (error) {
    console.error('Error fetching expired medicines:', error)
    return []
  }
}