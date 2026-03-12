const Notification = require('../models/Notification.model');

const createNotification = async (userId, type, message) => {
  try {
    await Notification.create({ userId, type, message });
  } catch (err) {
    console.error('Notification creation failed:', err);
  }
};

module.exports = { createNotification };