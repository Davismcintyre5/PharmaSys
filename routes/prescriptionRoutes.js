const express = require('express');
const {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, getPrescriptions)
  .post(protect, roleMiddleware('admin', 'manager', 'pharmacist'), createPrescription);

router.route('/:id')
  .get(protect, getPrescriptionById)
  .put(protect, roleMiddleware('admin', 'manager', 'pharmacist'), updatePrescriptionStatus);

module.exports = router;