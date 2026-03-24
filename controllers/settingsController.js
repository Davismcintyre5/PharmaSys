const User = require('../models/User');
const PharmacySetting = require('../models/PharmacySetting');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/logger');

// ========== Profile ==========
// @desc    Get own profile
// @route   GET /api/settings/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update own profile (username, email, etc.)
// @route   PUT /api/settings/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Allowed fields
    if (req.body.username) user.username = req.body.username;
    if (req.body.email) user.email = req.body.email;
    if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;
    const updated = await user.save();
    await logAction(req.user._id, 'update_profile', { fields: Object.keys(req.body) }, req.ip);
    res.json({ message: 'Profile updated', user: { ...updated.toObject(), passwordHash: undefined } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change password (requires old password)
// @route   PUT /api/settings/profile/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    await logAction(req.user._id, 'change_password', {}, req.ip);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== User Management (Admin & Manager only) ==========
// @desc    Get all users
// @route   GET /api/settings/users
// @access  Private (admin/manager)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new user
// @route   POST /api/settings/users
// @access  Private (admin/manager)
const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      passwordHash: hashed,
      role: role || 'pharmacist',
      isActive: true,
    });
    const created = await user.save();
    await logAction(req.user._id, 'create_user', { userId: created._id, username, role }, req.ip);
    res.status(201).json({ message: 'User created', user: { ...created.toObject(), passwordHash: undefined } });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user (role, active status)
// @route   PUT /api/settings/users/:id
// @access  Private (admin/manager)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (req.body.role) user.role = req.body.role;
    if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;
    // If password is sent, update it (admin can reset password)
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(req.body.password, salt);
    }
    const updated = await user.save();
    await logAction(req.user._id, 'update_user', { userId: updated._id, changes: req.body }, req.ip);
    res.json({ message: 'User updated', user: { ...updated.toObject(), passwordHash: undefined } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a user (fix: use deleteOne)
// @route   DELETE /api/settings/users/:id
// @access  Private (admin/manager)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete another admin' });
    }
    await user.deleteOne(); // <-- FIX: use deleteOne instead of remove()
    await logAction(req.user._id, 'delete_user', { userId: user._id, username: user.username }, req.ip);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== Pharmacy Info (Admin & Manager only) ==========
// @desc    Get pharmacy settings
// @route   GET /api/settings/pharmacy
// @access  Private
const getPharmacySettings = async (req, res) => {
  try {
    const settings = await PharmacySetting.getSingleton();
    res.json(settings);
  } catch (error) {
    console.error('Get pharmacy settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update pharmacy settings
// @route   PUT /api/settings/pharmacy
// @access  Private (admin/manager)
const updatePharmacySettings = async (req, res) => {
  try {
    const settings = await PharmacySetting.getSingleton();
    const allowed = ['name', 'address', 'phone', 'email', 'logo', 'currency', 'taxRate', 'businessReg', 'watermarkEnabled'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) settings[field] = req.body[field];
    });
    settings.updatedBy = req.user._id;
    const updated = await settings.save();
    await logAction(req.user._id, 'update_pharmacy_settings', { changes: req.body }, req.ip);
    res.json(updated);
  } catch (error) {
    console.error('Update pharmacy settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getPharmacySettings,
  updatePharmacySettings,
};