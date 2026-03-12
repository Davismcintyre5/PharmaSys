const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User.model');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Check if any admin exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      console.log(`Found ${adminCount} admin user(s).`);
      const confirm = await askQuestion('Delete all existing admins and create a new one? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('Aborted.');
        process.exit(0);
      }
      // Delete all admins
      await User.deleteMany({ role: 'admin' });
      console.log('All existing admins deleted.');
    } else {
      console.log('No existing admin found. Proceeding to create new admin.');
    }

    // Gather new admin details
    const name = await askQuestion('Enter admin name: ');
    const email = await askQuestion('Enter admin email: ');
    const password = await askQuestion('Enter password (min 6 characters): ');
    const confirm = await askQuestion('Confirm password: ');

    // Basic validations
    if (!name || !email || !password) {
      console.log('All fields are required.');
      process.exit(1);
    }
    if (password.length < 6) {
      console.log('Password must be at least 6 characters.');
      process.exit(1);
    }
    if (password !== confirm) {
      console.log('Passwords do not match.');
      process.exit(1);
    }
    if (!email.includes('@')) {
      console.log('Invalid email address.');
      process.exit(1);
    }

    // Create new admin
    await User.create({
      name,
      email,
      password,
      role: 'admin',
    });

    console.log('New admin user created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    rl.close();
  }
}

resetAdmin();