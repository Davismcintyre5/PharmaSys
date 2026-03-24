const express = require('express');
const {
  getDashboardSummary,
  getIncomeOverview,
  getLowStockMedicines,
  getTopMedicines,
  getRecentActivity,
  getInventoryValue,
  getPrescriptionStats,
  getMonthlyRevenue,
  getDailySales,
  getPendingPrescriptionsCount,
  getExpiredMedicinesCount,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/summary', protect, getDashboardSummary);
router.get('/income-overview', protect, getIncomeOverview);
router.get('/low-stock', protect, getLowStockMedicines);
router.get('/top-medicines', protect, getTopMedicines);
router.get('/recent-activity', protect, getRecentActivity);
router.get('/inventory-value', protect, getInventoryValue);
router.get('/prescription-stats', protect, getPrescriptionStats);
router.get('/monthly-revenue', protect, getMonthlyRevenue);
router.get('/daily-sales', protect, getDailySales);
router.get('/pending-prescriptions-count', protect, getPendingPrescriptionsCount);
router.get('/expired-medicines-count', protect, getExpiredMedicinesCount);

module.exports = router;