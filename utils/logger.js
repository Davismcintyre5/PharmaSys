const AuditLog = require('../models/AuditLog');

const logAction = async (userId, action, details, ipAddress = null) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

module.exports = { logAction };