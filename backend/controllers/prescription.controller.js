const Prescription = require('../models/Prescription.model');

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
exports.getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('patientId')
      .populate('items.medicineId')
      .populate('uploadedBy', 'name');
    res.status(200).json({ success: true, data: prescriptions });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
exports.getPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId')
      .populate('items.medicineId')
      .populate('uploadedBy', 'name');
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }
    res.status(200).json({ success: true, data: prescription });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new prescription
// @route   POST /api/prescriptions
exports.createPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.create(req.body);
    res.status(201).json({ success: true, data: prescription });
  } catch (err) {
    next(err);
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
exports.updatePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }
    res.status(200).json({ success: true, data: prescription });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
exports.deletePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};