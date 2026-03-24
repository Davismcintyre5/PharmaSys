const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    phone: String,
    email: String,
    address: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);