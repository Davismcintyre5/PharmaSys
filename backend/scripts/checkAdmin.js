const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
// Load .env from the backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User.model');

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log('Admin exists:', admin.email);
    } else {
      console.log('No admin user found');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkAdmin();