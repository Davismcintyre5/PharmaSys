const express = require('express');
const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getLowStockMedicines,
  getExpiringSoonMedicines,
  updateMedicineStock,
  searchMedicines,
  getMedicinesByCategory,
  getMedicinesBySupplier,
  getMedicineCategories,
  getInventoryValue,
  getMedicinesByExpiryRange,
  bulkImportMedicines,
  getExpiredMedicines,
} = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// Public (authenticated) routes
router.get('/', protect, getMedicines);
router.get('/search', protect, searchMedicines);
router.get('/low-stock', protect, getLowStockMedicines);
router.get('/expiring-soon', protect, getExpiringSoonMedicines);
router.get('/expired', protect, getExpiredMedicines);
router.get('/categories', protect, getMedicineCategories);
router.get('/inventory-value', protect, getInventoryValue);
router.get('/expiry-range', protect, getMedicinesByExpiryRange);
router.get('/category/:category', protect, getMedicinesByCategory);
router.get('/supplier/:supplierId', protect, getMedicinesBySupplier);

// Routes with ID param
router.get('/:id', protect, getMedicineById);
router.put('/:id', protect, roleMiddleware('admin', 'manager', 'pharmacist'), updateMedicine);
router.patch('/:id/stock', protect, roleMiddleware('admin', 'manager', 'pharmacist'), updateMedicineStock);
router.delete('/:id', protect, roleMiddleware('admin', 'manager'), deleteMedicine);

// Create (requires appropriate role)
router.post('/', protect, roleMiddleware('admin', 'manager', 'pharmacist'), createMedicine);
router.post('/bulk', protect, roleMiddleware('admin', 'manager'), bulkImportMedicines);

module.exports = router;