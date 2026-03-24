const express = require('express');
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, getPatients)
  .post(protect, roleMiddleware('admin', 'manager', 'pharmacist'), createPatient);

router.route('/:id')
  .get(protect, getPatientById)
  .put(protect, roleMiddleware('admin', 'manager', 'pharmacist'), updatePatient)
  .delete(protect, roleMiddleware('admin', 'manager'), deletePatient);

module.exports = router;