const Supplier = require('../models/Supplier.model');

// @desc    Get all suppliers
// @route   GET /api/suppliers
exports.getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};