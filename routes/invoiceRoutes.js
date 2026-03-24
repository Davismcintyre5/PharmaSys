// invoiceRoutes.js
const express = require('express');
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  printInvoice,
  sendInvoice,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

router.post('/', protect, roleMiddleware('admin', 'manager'), createInvoice);
router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.put('/:id', protect, roleMiddleware('admin', 'manager'), updateInvoice);
router.delete('/:id', protect, roleMiddleware('admin', 'manager'), deleteInvoice);
router.get('/:id/print', protect, printInvoice);
router.post('/:id/send', protect, roleMiddleware('admin', 'manager'), sendInvoice);

module.exports = router;