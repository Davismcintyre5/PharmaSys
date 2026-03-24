const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from the parent folder (project root)
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model (adjust path if scripts are in different location)
// Assuming scripts are inside backend/scripts, the model is in ../models/User.js
const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

const createUser = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }

  try {
    const username = await prompt('Username: ');
    const email = await prompt('Email: ');
    const password = await prompt('Password: ');
    const role = await prompt('Role (admin/manager/pharmacist/cashier): ');
    const isActive = (await prompt('Active? (y/n): ')).toLowerCase() === 'y';

    if (!['admin', 'manager', 'pharmacist', 'cashier'].includes(role)) {
      console.error('Invalid role. Choose from: admin, manager, pharmacist, cashier');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      console.error('User with that username or email already exists');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      passwordHash: hashedPassword,
      role,
      isActive,
    });
    await user.save();

    console.log(`User ${username} (${role}) created successfully`);
  } catch (err) {
    console.error('Error creating user:', err);
  } finally {
    await mongoose.disconnect();
    rl.close();
    process.exit(0);
  }
};

createUser();