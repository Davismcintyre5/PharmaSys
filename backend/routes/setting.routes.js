const express = require('express');
const { getSettings, updateSettings } = require('../controllers/setting.controller');
const { protect, authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.use(protect);
router.route('/')
  .get(getSettings)
  .put(authorize('admin'), updateSettings);

module.exports = router;