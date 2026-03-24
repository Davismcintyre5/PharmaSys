const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity: { type: Number, required: true, min: 1 },
  instruction: String, // e.g., "twice a day"
});

module.exports = mongoose.model('PrescriptionItem', prescriptionItemSchema);