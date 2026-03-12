const Order = require('../models/Order.model');
const Medicine = require('../models/Medicine.model');
const Patient = require('../models/Patient.model');
const AccountTransaction = require('../models/AccountTransaction.model');

// @desc    Sales report
// @route   GET /api/reports/sales
exports.salesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    const orders = await Order.find(match)
      .populate('patientId', 'name')
      .populate('items.medicineId', 'name')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// @desc    Inventory report
// @route   GET /api/reports/inventory
exports.inventoryReport = async (req, res, next) => {
  try {
    const medicines = await Medicine.find().sort('name');
    res.status(200).json({ success: true, data: medicines });
  } catch (err) {
    next(err);
  }
};

// @desc    Financial report (income/expense)
// @route   GET /api/reports/financial
exports.financialReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }
    const transactions = await AccountTransaction.find(match).sort('-date');
    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    next(err);
  }
};