const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: String,
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    }, // when approved, an expense transaction is created
  },
  { timestamps: true }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);