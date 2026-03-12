const Patient = require('../models/Patient.model');
const Medicine = require('../models/Medicine.model');
const Prescription = require('../models/Prescription.model');
const AccountTransaction = require('../models/AccountTransaction.model');

exports.getStats = async (req, res, next) => {
  try {
    // Basic counts
    const totalPatients = await Patient.countDocuments();
    const totalMedicines = await Medicine.countDocuments();
    const pendingPrescriptions = await Prescription.countDocuments({ status: 'pending' });

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Income transactions today (type 'income')
    const todayIncomeAgg = await AccountTransaction.aggregate([
      { $match: { 
        type: 'income',
        date: { $gte: todayStart, $lte: todayEnd }
      } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayIncome = todayIncomeAgg[0]?.total || 0;

    // Expenses today (for future use)
    const todayExpenseAgg = await AccountTransaction.aggregate([
      { $match: { 
        type: { $in: ['expense', 'withdrawal'] },
        date: { $gte: todayStart, $lte: todayEnd }
      } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayExpense = todayExpenseAgg[0]?.total || 0;

    // Low stock items
    const lowStockItems = await Medicine.countDocuments({
      $expr: { $lte: ['$stock', '$reorderLevel'] }
    });

    // Last 7 days income for chart (using income transactions)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const incomeByDay = await AccountTransaction.aggregate([
      { $match: { 
        type: 'income',
        date: { $gte: sevenDaysAgo }
      } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with zero
    const labels = [];
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      labels.push(dateStr);
      const found = incomeByDay.find((item) => item._id === dateStr);
      data.push(found ? found.total : 0);
    }

    // Optionally get account balance
    const balanceResult = await AccountTransaction.aggregate([
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          totalExpense: {
            $sum: { $cond: [{ $in: ['$type', ['expense', 'withdrawal']] }, '$amount', 0] }
          },
        },
      },
    ]);
    const { totalIncome = 0, totalExpense = 0 } = balanceResult[0] || {};
    const currentBalance = totalIncome - totalExpense;

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        totalMedicines,
        pendingPrescriptions,
        todayIncome,        // can be displayed as "Revenue Today"
        todayExpense,
        lowStockItems,
        currentBalance,
        incomeChart: { labels, data },  // rename from salesChart
      },
    });
  } catch (err) {
    next(err);
  }
};