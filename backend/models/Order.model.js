const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  items: [{
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    quantity: Number,
    priceAtSale: Number,
  }],
  total: Number,
  paymentMethod: { type: String, enum: ['cash', 'card', 'insurance'] },
  insuranceClaimId: String,
  status: { type: String, enum: ['completed', 'pending', 'cancelled'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', OrderSchema);