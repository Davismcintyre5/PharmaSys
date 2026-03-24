const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from the parent folder (project root)
dotenv.config({ path: path.join(__dirname, '../.env') });

const dropDatabase = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    await db.dropDatabase();
    console.log('Database dropped successfully');
  } catch (err) {
    console.error('Error dropping database:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  }
};

dropDatabase();