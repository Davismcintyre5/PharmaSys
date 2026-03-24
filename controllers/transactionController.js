const Transaction = require('../models/Transaction');
const PharmacySetting = require('../models/PharmacySetting');

// @desc    Get all transactions (with filtering)
const getTransactions = async (req, res) => {
  try {
    const { type, status, from, to, limit = 100 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (from) filter.createdAt = { ...filter.createdAt, $gte: new Date(from) };
    if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };
    
    const transactions = await Transaction.find(filter)
      .populate('createdBy', 'username')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('approvedBy', 'username');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new transaction (sale or expense)
const createTransaction = async (req, res) => {
  try {
    const { type, amount, paymentMethod, description, reference } = req.body;
    if (!type || !amount) {
      return res.status(400).json({ message: 'Type and amount are required' });
    }
    const transaction = new Transaction({
      type,
      amount,
      paymentMethod,
      description,
      reference,
      createdBy: req.user._id,
      status: 'pending',
    });
    const saved = await transaction.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a transaction (admin only)
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending transactions can be edited' });
    }
    const allowed = ['amount', 'paymentMethod', 'description', 'reference'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) transaction[field] = req.body[field];
    });
    const updated = await transaction.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a transaction (admin only)
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending transactions can be deleted' });
    }
    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Print transaction receipt (returns HTML)
const printTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('createdBy', 'username');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    const pharmacy = await PharmacySetting.getSingleton();
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .receipt { width: 300px; margin: 0 auto; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: gray; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>${pharmacy.name}</h2>
            <p>${pharmacy.address || ''}<br>${pharmacy.phone || ''}</p>
            <h3>${transaction.type === 'sale' ? 'SALE RECEIPT' : 'EXPENSE VOUCHER'}</h3>
          </div>
          <div class="line"></div>
          <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
          <p><strong>Reference:</strong> ${transaction.reference || '—'}</p>
          <p><strong>Amount:</strong> ${pharmacy.currency} ${transaction.amount.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${transaction.paymentMethod}</p>
          <p><strong>Status:</strong> ${transaction.status}</p>
          ${transaction.description ? `<p><strong>Description:</strong> ${transaction.description}</p>` : ''}
          <div class="line"></div>
          <div class="footer">
            <p>${pharmacy.name} – Official Receipt</p>
            <p>Generated: ${new Date().toLocaleString()} | Generated by: ${req.user.username}</p>
            <p>Powered by PharmaSys</p>
          </div>
        </div>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error printing transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  printTransaction,
};