const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    genericName: String,
    category: String,
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    unitPrice: { type: Number, required: true },
    currentStock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    expiryDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);