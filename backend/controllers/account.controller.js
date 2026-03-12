const AccountTransaction = require('../models/AccountTransaction.model');

// @desc    Get all transactions
// @route   GET /api/accounts/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await AccountTransaction.find()
      .populate('createdBy', 'name')
      .sort('-date');
    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single transaction
// @route   GET /api/accounts/transactions/:id
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await AccountTransaction.findById(req.params.id)
      .populate('createdBy', 'name');
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

// @desc    Create transaction
// @route   POST /api/accounts/transactions
exports.createTransaction = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const transaction = await AccountTransaction.create(req.body);
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

// @desc    Update transaction
// @route   PUT /api/accounts/transactions/:id
exports.updateTransaction = async (req, res, next) => {
  try {
    const transaction = await AccountTransaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/accounts/transactions/:id
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await AccountTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Get account balance
// @route   GET /api/accounts/balance
exports.getBalance = async (req, res, next) => {
  try {
    const result = await AccountTransaction.aggregate([
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          },
          totalWithdrawal: {
            $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] }
          },
        },
      },
    ]);
    const totals = result[0] || { totalIncome: 0, totalExpense: 0, totalWithdrawal: 0 };
    const balance = totals.totalIncome - totals.totalExpense - totals.totalWithdrawal;
    res.status(200).json({
      success: true,
      data: {
        balance,
        ...totals,
      },
    });
  } catch (err) {
    next(err);
  }
};