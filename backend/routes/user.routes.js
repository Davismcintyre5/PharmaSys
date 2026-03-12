const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/role.middleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Change password - available to all authenticated users
router.put('/changepassword', changePassword);

// Admin-only routes
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;