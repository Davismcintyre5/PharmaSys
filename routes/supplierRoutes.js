const express = require('express');
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, getSuppliers)
  .post(protect, roleMiddleware('admin', 'manager'), createSupplier);

router.route('/:id')
  .get(protect, getSupplierById)
  .put(protect, roleMiddleware('admin', 'manager'), updateSupplier)
  .delete(protect, roleMiddleware('admin', 'manager'), deleteSupplier);

module.exports = router;