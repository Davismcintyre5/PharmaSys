const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dropCollectionsExceptUsers = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const usersCollectionName = 'users'; // Mongoose model name, pluralized

    for (const coll of collections) {
      if (coll.name !== usersCollectionName) {
        await db.collection(coll.name).drop();
        console.log(`Dropped collection: ${coll.name}`);
      }
    }
    console.log('All collections except "users" dropped successfully');
  } catch (err) {
    console.error('Error dropping collections:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  }
};

dropCollectionsExceptUsers();