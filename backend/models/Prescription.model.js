const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorName: String,
  issueDate: Date,
  expiryDate: Date,
  items: [{
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    dosage: String,
    duration: String,
    quantity: Number,
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'dispensed', 'rejected'],
    default: 'pending',
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);