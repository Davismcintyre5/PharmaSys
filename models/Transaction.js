const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['sale', 'expense'],
      required: true,
    },
    reference: {
      type: String, // e.g., 'Prescription 123', 'Invoice #INV-001'
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'insurance', 'card', 'mobile_money', 'bank', 'other'],
      default: 'cash',
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);