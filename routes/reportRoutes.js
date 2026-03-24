const express = require('express');
const {
  getSalesReportData,
  getInventoryReportData,
  printSalesReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/sales', protect, getSalesReportData);
router.get('/inventory', protect, getInventoryReportData);
router.get('/sales/print', protect, printSalesReport);

module.exports = router;