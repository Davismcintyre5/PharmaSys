const Transaction = require('../models/Transaction');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const { generateReportHTML } = require('../utils/printHelper');
const PharmacySetting = require('../models/PharmacySetting');

// @desc    Get sales report data (only completed sales)
const getSalesReportData = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { type: 'sale', status: 'completed' };
    if (from) filter.createdAt = { ...filter.createdAt, $gte: new Date(from) };
    if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };
    const sales = await Transaction.find(filter).populate('createdBy', 'username');
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales report data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory report (low stock & expiring)
const getInventoryReportData = async (req, res) => {
  try {
    const lowStock = await Medicine.find({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] },
    });
    const expiringSoon = await Medicine.find({
      expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
    res.json({ lowStock, expiringSoon });
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate printable HTML for sales report (only completed sales)
const printSalesReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { type: 'sale', status: 'completed' };
    if (from) filter.createdAt = { ...filter.createdAt, $gte: new Date(from) };
    if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };
    const sales = await Transaction.find(filter).populate('createdBy', 'username').lean();
    const columns = [
      { key: '_id', label: 'Transaction ID' },
      { key: 'amount', label: 'Amount' },
      { key: 'paymentMethod', label: 'Method' },
      { key: 'createdAt', label: 'Date' },
      { key: 'createdBy.username', label: 'Cashier' },
    ];
    const data = sales.map(s => ({
      ...s,
      createdAt: new Date(s.createdAt).toLocaleString(),
      amount: `${s.amount.toFixed(2)}`,
      'createdBy.username': s.createdBy?.username || '—',
    }));
    const settings = await PharmacySetting.getSingleton();
    const html = await generateReportHTML('Sales Report (Approved)', data, columns, settings, req.user);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error printing sales report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSalesReportData,
  getInventoryReportData,
  printSalesReport,
};