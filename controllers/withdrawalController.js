const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');
const PharmacySetting = require('../models/PharmacySetting');

// @desc    Request a withdrawal
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
    console.error('Request withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all withdrawals (with filters)
const getWithdrawals = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from) filter.createdAt = { ...filter.createdAt, $gte: new Date(from) };
    if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };
    const withdrawals = await Withdrawal.find(filter)
      .populate('requestedBy', 'username')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single withdrawal
const getWithdrawalById = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('requestedBy', 'username')
      .populate('approvedBy', 'username');
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    res.json(withdrawal);
  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve withdrawal (creates expense transaction)
const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }
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
    res.json(withdrawal);
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject withdrawal
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
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Print withdrawal receipt
const printWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('requestedBy', 'username')
      .populate('approvedBy', 'username');
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    const pharmacy = await PharmacySetting.getSingleton();
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Withdrawal Receipt</title>
      <style>
        body { font-family: Arial; margin: 20px; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: gray; }
      </style>
      </head>
      <body>
        <h2>${pharmacy.name}</h2>
        <h3>WITHDRAWAL RECEIPT</h3>
        <p><strong>Requested by:</strong> ${withdrawal.requestedBy?.username}</p>
        <p><strong>Date:</strong> ${new Date(withdrawal.createdAt).toLocaleString()}</p>
        <p><strong>Amount:</strong> ${pharmacy.currency} ${withdrawal.amount.toFixed(2)}</p>
        <p><strong>Reason:</strong> ${withdrawal.reason}</p>
        <p><strong>Status:</strong> ${withdrawal.status}</p>
        ${withdrawal.approvedBy ? `<p><strong>Approved by:</strong> ${withdrawal.approvedBy.username}</p>` : ''}
        ${withdrawal.rejectionReason ? `<p><strong>Rejection reason:</strong> ${withdrawal.rejectionReason}</p>` : ''}
        <hr />
        <div class="footer">
          <p>${pharmacy.name} – Official Withdrawal Receipt</p>
          <p>Generated: ${new Date().toLocaleString()} | Generated by: ${req.user.username}</p>
          <p>Powered by PharmaSys</p>
        </div>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Print withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  requestWithdrawal,
  getWithdrawals,
  getWithdrawalById,
  approveWithdrawal,
  rejectWithdrawal,
  printWithdrawal,
};