const express = require('express');
const {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
} = require('../controllers/prescription.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.route('/').get(getPrescriptions).post(createPrescription);
router.route('/:id').get(getPrescription).put(updatePrescription).delete(deletePrescription);

module.exports = router;