const express = require('express');
const {
  getTransactions,
  approveTransaction,
  rejectTransaction,
  createInvoice,
  getInvoices,
  payInvoice,
  requestWithdrawal,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getBalance,
  getPendingApprovals,
} = require('../controllers/accountsController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// All endpoints in this file require admin or manager role (except maybe balance/pending can be view-only)
router.use(protect, roleMiddleware('admin', 'manager'));

// Balance and summary
router.get('/balance', getBalance);
router.get('/pending-approvals', getPendingApprovals);

// Transactions
router.get('/transactions', getTransactions);
router.put('/transactions/:id/approve', approveTransaction);
router.put('/transactions/:id/reject', rejectTransaction);

// Invoices
router.post('/invoices', createInvoice);
router.get('/invoices', getInvoices);
router.put('/invoices/:id/pay', payInvoice);

// Withdrawals
router.post('/withdrawals', requestWithdrawal);
router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id/approve', approveWithdrawal);
router.put('/withdrawals/:id/reject', rejectWithdrawal);

module.exports = router;