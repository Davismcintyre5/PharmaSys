const express = require('express');
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patient.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.route('/').get(getPatients).post(createPatient);
router.route('/:id').get(getPatient).put(updatePatient).delete(deletePatient);

module.exports = router;