const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models (optional, for clarity)
const User = require('../models/User.model');

async function dropAllButAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`Found ${collections.length} collections. Processing...`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      // Skip system collections
      if (collectionName.startsWith('system.')) {
        console.log(`Skipping system collection: ${collectionName}`);
        continue;
      }

      if (collectionName === 'users') {
        // Delete all non-admin users
        const result = await User.deleteMany({ role: { $ne: 'admin' } });
        console.log(`Users collection: deleted ${result.deletedCount} non-admin user(s). Admins kept.`);
      } else {
        // Delete all documents from other collections
        const result = await db.collection(collectionName).deleteMany({});
        console.log(`${collectionName}: deleted ${result.deletedCount} document(s).`);
      }
    }

    // Verify at least one admin remains
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.warn('⚠️  No admin users left! You may want to create one using scripts/createAdmin.js');
    } else {
      console.log(`✅ Done. ${adminCount} admin user(s) retained.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dropAllButAdmin();