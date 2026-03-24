const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['sale', 'purchase'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue'],
      default: 'draft',
    },
    dueDate: Date,
    description: String,
    client: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'clientModel',
    },
    clientModel: {
      type: String,
      enum: ['Patient', 'Supplier'],
    },
    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        total: Number,
      },
    ],
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    }, // when paid, linked to a sale transaction
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);