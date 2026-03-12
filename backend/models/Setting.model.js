const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  currency: { type: String, default: 'KES' },
  taxRate: { type: Number, default: 0 },
  pharmacyName: String,
  address: String,
  phone: String,
  email: String,
  licenseNumber: String,
}, { timestamps: true });

SettingSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Setting', SettingSchema);