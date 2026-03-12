const mongoose = require('mongoose');

const AccountTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense', 'withdrawal'],
    required: true,
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reference: String, // e.g., order ID, receipt number
}, { timestamps: true });

module.exports = mongoose.model('AccountTransaction', AccountTransactionSchema);