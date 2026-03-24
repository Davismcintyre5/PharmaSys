const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // Determine connection type and sanitize host display
    const uri = process.env.MONGO_URI;
    let displayHost = 'MongoDB';
    if (uri.includes('mongodb+srv') || uri.includes('atlas')) {
      displayHost = 'Atlas';
    } else if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      displayHost = 'Localhost';
    }
    
    console.log(`MongoDB Connected: ${displayHost} (${conn.connection.name})`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;