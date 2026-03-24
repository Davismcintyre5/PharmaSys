const Medicine = require('../models/Medicine');

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Private
const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().populate('supplier', 'name');
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single medicine by ID
// @route   GET /api/medicines/:id
// @access  Private
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate('supplier');
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (error) {
    console.error('Error fetching medicine by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new medicine
// @route   POST /api/medicines
// @access  Private (admin/manager/pharmacist)
const createMedicine = async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    const created = await medicine.save();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a medicine
// @route   PUT /api/medicines/:id
// @access  Private (admin/manager/pharmacist)
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    Object.assign(medicine, req.body);
    const updated = await medicine.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a medicine
// @route   DELETE /api/medicines/:id
// @access  Private (admin/manager)
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    await medicine.deleteOne();
    res.json({ message: 'Medicine removed' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get low stock medicines
// @route   GET /api/medicines/low-stock
// @access  Private
const getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] }
    }).populate('supplier', 'name');
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching low stock medicines:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get medicines expiring within specified days
// @route   GET /api/medicines/expiring-soon?days=30
// @access  Private
const getExpiringSoonMedicines = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + days);
    const medicines = await Medicine.find({
      expiryDate: { $lte: expiryThreshold, $gte: new Date() }
    }).populate('supplier', 'name');
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching expiring medicines:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update medicine stock quantity
// @route   PATCH /api/medicines/:id/stock
// @access  Private (admin/manager/pharmacist)
const updateMedicineStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'set', 'add', 'subtract'
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    let newStock;
    switch (operation) {
      case 'add':
        newStock = medicine.currentStock + quantity;
        break;
      case 'subtract':
        newStock = medicine.currentStock - quantity;
        break;
      default:
        newStock = quantity;
    }
    if (newStock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }
    medicine.currentStock = newStock;
    await medicine.save();
    res.json(medicine);
  } catch (error) {
    console.error('Error updating medicine stock:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search medicines by name or generic name
// @route   GET /api/medicines/search?q=paracetamol
// @access  Private
const searchMedicines = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.json([]);
    }
    const medicines = await Medicine.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { genericName: { $regex: query, $options: 'i' } }
      ]
    }).populate('supplier', 'name');
    res.json(medicines);
  } catch (error) {
    console.error('Error searching medicines:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get medicines by category
// @route   GET /api/medicines/category/:category
// @access  Private
const getMedicinesByCategory = async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const medicines = await Medicine.find({ category: { $regex: category, $options: 'i' } })
      .populate('supplier', 'name');
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get medicines by supplier
// @route   GET /api/medicines/supplier/:supplierId
// @access  Private
const getMedicinesBySupplier = async (req, res) => {
  try {
    const medicines = await Medicine.find({ supplier: req.params.supplierId })
      .populate('supplier', 'name');
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines by supplier:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get medicine categories (distinct list)
// @route   GET /api/medicines/categories
// @access  Private
const getMedicineCategories = async (req, res) => {
  try {
    const categories = await Medicine.distinct('category');
    res.json(categories.filter(c => c)); // remove empty strings
  } catch (error) {
    console.error('Error fetching medicine categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get total inventory value
// @route   GET /api/medicines/inventory-value
// @access  Private
const getInventoryValue = async (req, res) => {
  try {
    const medicines = await Medicine.find();
    const totalValue = medicines.reduce((sum, med) => sum + (med.currentStock * med.unitPrice), 0);
    res.json({ totalValue });
  } catch (error) {
    console.error('Error fetching inventory value:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get medicines by expiry date range
// @route   GET /api/medicines/expiry-range?from=2024-01-01&to=2024-12-31
// @access  Private
const getMedicinesByExpiryRange = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from) filter.expiryDate = { $gte: new Date(from) };
    if (to) filter.expiryDate = { ...filter.expiryDate, $lte: new Date(to) };
    const medicines = await Medicine.find(filter).populate('supplier', 'name');
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines by expiry range:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Bulk import medicines
// @route   POST /api/medicines/bulk
// @access  Private (admin/manager)
const bulkImportMedicines = async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: 'Invalid medicines array' });
    }
    const results = await Medicine.insertMany(medicines, { ordered: false });
    res.status(201).json({ count: results.length, medicines: results });
  } catch (error) {
    console.error('Error bulk importing medicines:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get expired medicines
// @route   GET /api/medicines/expired
// @access  Private
const getExpiredMedicines = async (req, res) => {
  try {
    const today = new Date();
    const medicines = await Medicine.find({ expiryDate: { $lt: today } })
      .populate('supplier', 'name');
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching expired medicines:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getLowStockMedicines,
  getExpiringSoonMedicines,
  updateMedicineStock,
  searchMedicines,
  getMedicinesByCategory,
  getMedicinesBySupplier,
  getMedicineCategories,
  getInventoryValue,
  getMedicinesByExpiryRange,
  bulkImportMedicines,
  getExpiredMedicines,
};