const express = require('express');
const {
  salesReport,
  inventoryReport,
  financialReport,
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/sales', salesReport);
router.get('/inventory', inventoryReport);
router.get('/financial', financialReport);

module.exports = router;