const Transaction = require('../models/Transaction');
const { generateReceiptHTML } = require('../utils/printHelper');

// @desc    Get receipt HTML for a transaction
// @route   GET /api/receipts/:transactionId
// @access  Private
const getReceipt = async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  const html = await generateReceiptHTML(transaction);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};

module.exports = { getReceipt };