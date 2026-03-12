const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: String,
  phone: String,
  email: String,
  address: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Supplier', SupplierSchema);