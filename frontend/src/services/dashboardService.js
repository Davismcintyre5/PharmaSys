import api from './api'

// @desc    Get dashboard summary data (cards)
// @route   GET /api/dashboard/summary
// @access  Private
export const getDashboardSummary = async () => {
  try {
    const response = await api.get('/dashboard/summary')
    return response.data
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    throw error
  }
}

// @desc    Get income overview for last n days
// @route   GET /api/dashboard/income-overview?days=7
// @access  Private
export const getIncomeOverview = async (days = 7) => {
  try {
    const response = await api.get(`/dashboard/income-overview?days=${days}`)
    return response.data
  } catch (error) {
    console.error('Error fetching income overview:', error)
    throw error
  }
}

// @desc    Get top selling medicines
// @route   GET /api/dashboard/top-medicines
// @access  Private
export const getTopMedicines = async () => {
  try {
    const response = await api.get('/dashboard/top-medicines')
    return response.data
  } catch (error) {
    console.error('Error fetching top medicines:', error)
    // Return empty array as fallback
    return []
  }
}

// @desc    Get recent activity feed
// @route   GET /api/dashboard/recent-activity
// @access  Private
export const getRecentActivity = async () => {
  try {
    const response = await api.get('/dashboard/recent-activity')
    return response.data
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    // Return empty array as fallback
    return []
  }
}

// @desc    Get low stock medicines list
// @route   GET /api/dashboard/low-stock
// @access  Private
export const getLowStockMedicines = async () => {
  try {
    const response = await api.get('/dashboard/low-stock')
    return response.data
  } catch (error) {
    console.error('Error fetching low stock medicines:', error)
    return []
  }
}

// @desc    Get monthly revenue trend (for advanced charts)
// @route   GET /api/dashboard/monthly-revenue?year=2024
// @access  Private
export const getMonthlyRevenue = async (year = new Date().getFullYear()) => {
  try {
    const response = await api.get(`/dashboard/monthly-revenue?year=${year}`)
    return response.data
  } catch (error) {
    console.error('Error fetching monthly revenue:', error)
    return []
  }
}

// @desc    Get prescription statistics (fulfilled vs pending)
// @route   GET /api/dashboard/prescription-stats
// @access  Private
export const getPrescriptionStats = async () => {
  try {
    const response = await api.get('/dashboard/prescription-stats')
    return response.data
  } catch (error) {
    console.error('Error fetching prescription stats:', error)
    return { fulfilled: 0, pending: 0, cancelled: 0 }
  }
}

// @desc    Get inventory value (total stock value)
// @route   GET /api/dashboard/inventory-value
// @access  Private
export const getInventoryValue = async () => {
  try {
    const response = await api.get('/dashboard/inventory-value')
    return response.data
  } catch (error) {
    console.error('Error fetching inventory value:', error)
    return { totalValue: 0 }
  }
}

// @desc    Get daily sales for current week (alternative to income overview)
// @route   GET /api/dashboard/daily-sales
// @access  Private
export const getDailySales = async () => {
  try {
    const response = await api.get('/dashboard/daily-sales')
    return response.data
  } catch (error) {
    console.error('Error fetching daily sales:', error)
    return []
  }
}

// @desc    Get pending prescriptions count
// @route   GET /api/dashboard/pending-prescriptions-count
// @access  Private
export const getPendingPrescriptionsCount = async () => {
  try {
    const response = await api.get('/dashboard/pending-prescriptions-count')
    return response.data
  } catch (error) {
    console.error('Error fetching pending prescriptions count:', error)
    return { count: 0 }
  }
}

// @desc    Get expired medicines count
// @route   GET /api/dashboard/expired-medicines-count
// @access  Private
export const getExpiredMedicinesCount = async () => {
  try {
    const response = await api.get('/dashboard/expired-medicines-count')
    return response.data
  } catch (error) {
    console.error('Error fetching expired medicines count:', error)
    return { count: 0 }
  }
}