// withdrawalRoutes.js
const express = require('express');
const {
  requestWithdrawal,
  getWithdrawals,
  getWithdrawalById,
  approveWithdrawal,
  rejectWithdrawal,
  printWithdrawal,
} = require('../controllers/withdrawalController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

router.post('/', protect, roleMiddleware('admin', 'manager', 'pharmacist'), requestWithdrawal);
router.get('/', protect, roleMiddleware('admin', 'manager'), getWithdrawals);
router.get('/:id', protect, roleMiddleware('admin', 'manager'), getWithdrawalById);
router.put('/:id/approve', protect, roleMiddleware('admin', 'manager'), approveWithdrawal);
router.put('/:id/reject', protect, roleMiddleware('admin', 'manager'), rejectWithdrawal);
router.get('/:id/print', protect, printWithdrawal);

module.exports = router;