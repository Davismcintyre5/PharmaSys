const express = require('express');
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  printTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// Any authenticated user can view transactions and print
router.get('/', protect, getTransactions);
router.get('/:id', protect, getTransactionById);
router.get('/:id/print', protect, printTransaction);

// Any authenticated user can create a transaction (pending)
router.post('/', protect, createTransaction);

// Only admin can edit/delete pending transactions
router.put('/:id', protect, roleMiddleware('admin'), updateTransaction);
router.delete('/:id', protect, roleMiddleware('admin'), deleteTransaction);

module.exports = router;