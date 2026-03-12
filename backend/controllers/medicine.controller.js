const Medicine = require('../models/Medicine.model');

// @desc    Get all medicines
// @route   GET /api/medicines
exports.getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find().populate('batches.supplier');
    res.status(200).json({ success: true, data: medicines });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single medicine
// @route   GET /api/medicines/:id
exports.getMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate('batches.supplier');
    if (!medicine) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }
    res.status(200).json({ success: true, data: medicine });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new medicine
// @route   POST /api/medicines
exports.createMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.create(req.body);
    res.status(201).json({ success: true, data: medicine });
  } catch (err) {
    next(err);
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
exports.updateMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!medicine) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }
    res.status(200).json({ success: true, data: medicine });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
exports.deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};