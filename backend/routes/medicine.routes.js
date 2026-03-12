const express = require('express');
const {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicine.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.route('/').get(getMedicines).post(createMedicine);
router.route('/:id').get(getMedicine).put(updateMedicine).delete(deleteMedicine);

module.exports = router;