const mongoose = require('mongoose');

const pharmacySettingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: String,
    phone: String,
    email: String,
    logo: String, // file path or URL
    currency: { type: String, default: 'KES' },
    taxRate: { type: Number, default: 0 }, // e.g., 16 for 16%
    businessReg: String, // e.g., PIN
    watermarkEnabled: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Ensure only one document exists
pharmacySettingSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ name: 'Pharmacy Name' });
  }
  return settings;
};

module.exports = mongoose.model('PharmacySetting', pharmacySettingSchema);