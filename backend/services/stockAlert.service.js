const Medicine = require('../models/Medicine.model');
const { createNotification } = require('./notification.service');

const checkLowStock = async () => {
  const medicines = await Medicine.find({
    $expr: { $lte: ['$stock', '$reorderLevel'] }
  });
  for (const med of medicines) {
    // Create notification for admin users (you'd need to fetch admin users)
    // For now, just log
    console.log(`Low stock alert: ${med.name} (${med.stock} left)`);
  }
};

module.exports = { checkLowStock };