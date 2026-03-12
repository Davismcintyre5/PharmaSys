const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { User, Medicine, Patient } = require('../models');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB, seeding...');

    // Clear existing data
    await User.deleteMany();
    await Medicine.deleteMany();
    await Patient.deleteMany();

    // Create admin user
    await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    // Create sample medicines
    await Medicine.create([
      { name: 'Paracetamol', price: 5.99, stock: 100, reorderLevel: 20 },
      { name: 'Amoxicillin', price: 12.50, stock: 50, reorderLevel: 10, requiresPrescription: true },
    ]);

    // Create sample patient
    await Patient.create({
      name: 'John Doe',
      phone: '1234567890',
      email: 'john@example.com',
    });

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDatabase();