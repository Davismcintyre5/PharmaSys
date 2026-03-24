const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const Transaction = require('../models/Transaction');

// @desc    Get dashboard summary data (only completed transactions)
const getDashboardSummary = async (req, res) => {
  try {
    // Current balance: sum of all completed sales - completed expenses
    const sales = await Transaction.aggregate([
      { $match: { type: 'sale', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const expenses = await Transaction.aggregate([
      { $match: { type: 'expense', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const currentBalance = (sales[0]?.total || 0) - (expenses[0]?.total || 0);

    // Revenue today (only completed sales today)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const revenueToday = await Transaction.aggregate([
      { $match: { type: 'sale', status: 'completed', createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Expenses today (only completed expenses today)
    const expensesToday = await Transaction.aggregate([
      { $match: { type: 'expense', status: 'completed', createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Low stock items count
    const lowStockCount = await Medicine.countDocuments({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] },
    });

    const totalPatients = await Patient.countDocuments();
    const medicinesCount = await Medicine.countDocuments();
    const pendingRx = await Prescription.countDocuments({ status: 'pending' });

    // Inventory value (total stock value)
    const medicines = await Medicine.find();
    const inventoryValue = medicines.reduce((sum, med) => sum + (med.currentStock * med.unitPrice), 0);

    res.json({
      currentBalance,
      revenueToday: revenueToday[0]?.total || 0,
      expensesToday: expensesToday[0]?.total || 0,
      lowStockItems: lowStockCount,
      totalPatients,
      medicines: medicinesCount,
      pendingRx,
      inventoryValue,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get income overview for last n days (only completed sales)
const getIncomeOverview = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          type: 'sale',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const results = await Transaction.aggregate(pipeline);

    // Fill missing days with zero
    const dailyMap = new Map(results.map(r => [r._id, r.total]));
    const overview = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      overview.push({
        date: dateStr,
        income: dailyMap.get(dateStr) || 0,
      });
    }
    res.json(overview);
  } catch (error) {
    console.error('Error fetching income overview:', error);
    res.json([]);
  }
};

// @desc    Get low stock medicines list
const getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] }
    }).select('name currentStock reorderLevel unitPrice category');
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching low stock medicines:', error);
    res.json([]);
  }
};

// @desc    Get top selling medicines (from completed sales transactions)
const getTopMedicines = async (req, res) => {
  try {
    // Get all completed sale transactions that reference prescriptions
    const transactions = await Transaction.find({
      type: 'sale',
      status: 'completed',
      reference: { $regex: /^Prescription/ }
    });
    // Aggregate medicine sales (simplified; can be improved with aggregation pipeline)
    // For simplicity, we'll return empty array – implement as needed
    res.json([]);
  } catch (error) {
    console.error('Error fetching top medicines:', error);
    res.json([]);
  }
};

// @desc    Get recent activity (audit logs or recent completed transactions)
const getRecentActivity = async (req, res) => {
  try {
    const recent = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'username');
    res.json(recent);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.json([]);
  }
};

// @desc    Get inventory total value
const getInventoryValue = async (req, res) => {
  try {
    const medicines = await Medicine.find();
    const totalValue = medicines.reduce((sum, med) => sum + (med.currentStock * med.unitPrice), 0);
    res.json({ totalValue });
  } catch (error) {
    console.error('Error fetching inventory value:', error);
    res.json({ totalValue: 0 });
  }
};

// @desc    Get prescription statistics
const getPrescriptionStats = async (req, res) => {
  try {
    const fulfilled = await Prescription.countDocuments({ status: 'fulfilled' });
    const pending = await Prescription.countDocuments({ status: 'pending' });
    const cancelled = await Prescription.countDocuments({ status: 'cancelled' });
    res.json({ fulfilled, pending, cancelled });
  } catch (error) {
    console.error('Error fetching prescription stats:', error);
    res.json({ fulfilled: 0, pending: 0, cancelled: 0 });
  }
};

// @desc    Get monthly revenue trend (only completed sales)
const getMonthlyRevenue = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          type: 'sale',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const revenueByMonth = Array(12).fill(0);
    for (const month of monthlyRevenue) {
      revenueByMonth[month._id - 1] = month.total;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = months.map((month, index) => ({ month, revenue: revenueByMonth[index] }));
    res.json(result);
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.json([]);
  }
};

// @desc    Get daily sales for current week (only completed sales)
const getDailySales = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const dailySales = await Transaction.aggregate([
      {
        $match: {
          type: 'sale',
          status: 'completed',
          createdAt: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(dailySales);
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    res.json([]);
  }
};

// @desc    Get pending prescriptions count
const getPendingPrescriptionsCount = async (req, res) => {
  try {
    const count = await Prescription.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching pending prescriptions count:', error);
    res.json({ count: 0 });
  }
};

// @desc    Get expired medicines count
const getExpiredMedicinesCount = async (req, res) => {
  try {
    const today = new Date();
    const count = await Medicine.countDocuments({ expiryDate: { $lt: today } });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching expired medicines count:', error);
    res.json({ count: 0 });
  }
};

module.exports = {
  getDashboardSummary,
  getIncomeOverview,
  getLowStockMedicines,
  getTopMedicines,
  getRecentActivity,
  getInventoryValue,
  getPrescriptionStats,
  getMonthlyRevenue,
  getDailySales,
  getPendingPrescriptionsCount,
  getExpiredMedicinesCount,
};