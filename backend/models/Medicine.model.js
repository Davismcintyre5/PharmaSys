const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  batchNo: String,
  expiryDate: Date,
  quantity: Number,
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
});

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: String,
  category: String,
  manufacturer: String,
  price: { type: Number, required: true },
  cost: Number,
  stock: { type: Number, default: 0 },
  reorderLevel: Number,
  batches: [BatchSchema],
  requiresPrescription: { type: Boolean, default: false },
  image: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Medicine', MedicineSchema);