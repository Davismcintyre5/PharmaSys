const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
const User = require('../models/User');

const listUsers = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find().select('-passwordHash').lean();

    if (users.length === 0) {
      console.log('No users found.');
    } else {
      console.table(users.map(u => ({
        _id: u._id.toString(),
        username: u.username,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })));
    }
  } catch (err) {
    console.error('Error listing users:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

listUsers();