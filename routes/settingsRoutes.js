const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getPharmacySettings,
  updatePharmacySettings,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// Profile routes (any authenticated user)
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);
router.put('/profile/password', protect, changePassword); // <-- new

// User management (admin & manager only)
router.route('/users')
  .get(protect, roleMiddleware('admin', 'manager'), getUsers)
  .post(protect, roleMiddleware('admin', 'manager'), createUser);
router.route('/users/:id')
  .put(protect, roleMiddleware('admin', 'manager'), updateUser)
  .delete(protect, roleMiddleware('admin', 'manager'), deleteUser);

// Pharmacy info (admin & manager only)
router.route('/pharmacy')
  .get(protect, getPharmacySettings)
  .put(protect, roleMiddleware('admin', 'manager'), updatePharmacySettings);

module.exports = router;