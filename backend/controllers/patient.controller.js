const Patient = require('../models/Patient.model');

// @desc    Get all patients
// @route   GET /api/patients
exports.getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find();
    res.status(200).json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
exports.getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('prescriptions');
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.status(200).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new patient
// @route   POST /api/patients
exports.createPatient = async (req, res, next) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
exports.updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.status(200).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
exports.deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};