const cron = require('node-cron');
const Medicine = require('../models/Medicine.model');
const { createNotification } = require('../services/notification.service');

// Run every day at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running expiry alert job...');
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringMedicines = await Medicine.find({
    'batches.expiryDate': { $lte: thirtyDaysFromNow }
  });

  for (const med of expiringMedicines) {
    // Create notifications (simplified)
    console.log(`Expiry alert: ${med.name} has batches expiring soon.`);
    // await createNotification(null, 'expiry', `Medicine ${med.name} expiring soon`);
  }
});