const express = require('express');
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplier.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.route('/').get(getSuppliers).post(createSupplier);
router.route('/:id').get(getSupplier).put(updateSupplier).delete(deleteSupplier);

module.exports = router;