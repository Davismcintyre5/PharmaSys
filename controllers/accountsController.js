const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');

// ========== Transactions with approval ==========

// @desc    Get all transactions (with filtering by status)
// @route   GET /api/accounts/transactions?status=pending
// @access  Private (admin/manager)
const getTransactions = async (req, res) => {
  try {
    const { status, type, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (from) filter.createdAt = { ...filter.createdAt, $gte: new Date(from) };
    if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };
    const transactions = await Transaction.find(filter)
      .populate('createdBy', 'username')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a transaction (pending → completed)
// @route   PUT /api/accounts/transactions/:id/approve
// @access  Private (admin/manager)
const approveTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }
    transaction.status = 'completed';
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = new Date();
    await transaction.save();
    res.json(transaction);
  } catch (error) {
    console.error('Error approving transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject a transaction
// @route   PUT /api/accounts/transactions/:id/reject
// @access  Private (admin/manager)
const rejectTransaction = async (req, res) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }
    transaction.status = 'rejected';
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = new Date();
    transaction.rejectionReason = reason || 'No reason provided';
    await transaction.save();
    res.json(transaction);
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== Invoices ==========

// @desc    Create an invoice
// @route   POST /api/accounts/invoices
// @access  Private (admin/manager/pharmacist)
const createInvoice = async (req, res) => {
  try {
    const { type, amount, dueDate, description, client, clientModel, items } = req.body;
    const invoiceNumber = await generateInvoiceNumber();
    const invoice = new Invoice({
      invoiceNumber,
      type,
      amount,
      dueDate,
      description,
      client,
      clientModel,
      items,
      createdBy: req.user._id,
    });
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all invoices
// @route   GET /api/accounts/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('client', 'firstName lastName name')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark invoice as paid (creates a pending sale transaction)
// @route   PUT /api/accounts/invoices/:id/pay
// @access  Private (admin/manager)
const payInvoice = async (req, res) => {
  try {
    const { paymentMethod = 'cash' } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }
    // Create a sale transaction (pending)
    const transaction = new Transaction({
      type: 'sale',
      reference: `Invoice ${invoice.invoiceNumber}`,
      amount: invoice.amount,
      paymentMethod,
      description: `Payment for invoice ${invoice.invoiceNumber}`,
      status: 'pending',
      createdBy: req.user._id,
    });
    await transaction.save();
    // Update invoice
    invoice.status = 'paid';
    invoice.transaction = transaction._id;
    await invoice.save();
    res.json({ invoice, transaction });
  } catch (error) {
    console.error('Error paying invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== Withdrawals ==========

// @desc    Request a withdrawal
// @route   POST /api/accounts/withdrawals
// @access  Private (admin/manager/pharmacist)
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const withdrawal = new Withdrawal({
      amount,
      reason,
      requestedBy: req.user._id,
    });
    await withdrawal.save();
    res.status(201).json(withdrawal);
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all withdrawals
// @route   GET /api/accounts/withdrawals
// @access  Private (admin/manager)
const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate('requestedBy', 'username')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a withdrawal (creates pending expense transaction)
// @route   PUT /api/accounts/withdrawals/:id/approve
// @access  Private (admin/manager)
const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }
    // Create expense transaction (pending)
    const transaction = new Transaction({
      type: 'expense',
      reference: `Withdrawal ${withdrawal._id}`,
      amount: withdrawal.amount,
      description: withdrawal.reason,
      status: 'pending',
      createdBy: req.user._id,
    });
    await transaction.save();
    withdrawal.status = 'approved';
    withdrawal.approvedBy = req.user._id;
    withdrawal.approvedAt = new Date();
    withdrawal.transaction = transaction._id;
    await withdrawal.save();
    res.json({ withdrawal, transaction });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject a withdrawal
// @route   PUT /api/accounts/withdrawals/:id/reject
// @access  Private (admin/manager)
const rejectWithdrawal = async (req, res) => {
  try {
    const { reason } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }
    withdrawal.status = 'rejected';
    withdrawal.approvedBy = req.user._id;
    withdrawal.approvedAt = new Date();
    withdrawal.rejectionReason = reason || 'No reason provided';
    await withdrawal.save();
    res.json(withdrawal);
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== Financial Summary ==========

// @desc    Get account balance (sum of completed sales - completed expenses)
// @route   GET /api/accounts/balance
// @access  Private
const getBalance = async (req, res) => {
  try {
    const sales = await Transaction.aggregate([
      { $match: { type: 'sale', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expenses = await Transaction.aggregate([
      { $match: { type: 'expense', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const balance = (sales[0]?.total || 0) - (expenses[0]?.total || 0);
    res.json({ balance, totalSales: sales[0]?.total || 0, totalExpenses: expenses[0]?.total || 0 });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pending approvals count (transactions + withdrawals)
// @route   GET /api/accounts/pending-approvals
// @access  Private (admin/manager)
const getPendingApprovals = async (req, res) => {
  try {
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    res.json({ pendingTransactions, pendingWithdrawals, total: pendingTransactions + pendingWithdrawals });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // transactions
  getTransactions,
  approveTransaction,
  rejectTransaction,
  // invoices
  createInvoice,
  getInvoices,
  payInvoice,
  // withdrawals
  requestWithdrawal,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  // summary
  getBalance,
  getPendingApprovals,
};