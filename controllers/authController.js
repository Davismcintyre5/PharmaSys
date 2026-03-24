const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { logAction } = require('../utils/logger');

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log('User found:', user.email, 'Role:', user.role);
    console.log('Has passwordHash:', !!user.passwordHash);
    
    // Check if user has passwordHash
    if (!user.passwordHash) {
      console.error('User has no passwordHash set:', user.email);
      return res.status(401).json({ message: 'Account setup incomplete. Please contact administrator.' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      console.log('User account deactivated:', user.email);
      return res.status(401).json({ message: 'Account is deactivated. Please contact administrator.' });
    }
    
    // Compare password
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.passwordHash);
      console.log('Password match result:', isMatch);
    } catch (bcryptError) {
      console.error('bcrypt compare error:', bcryptError);
      return res.status(500).json({ message: 'Error verifying password' });
    }
    
    if (!isMatch) {
      console.log('Invalid password for user:', user.email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    // Return user data (without password)
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      token: token,
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login', 
      error: error.message 
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, getMe };