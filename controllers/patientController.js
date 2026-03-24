const Patient = require('../models/Patient');

// @desc    Get all patients
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single patient by ID
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new patient
const createPatient = async (req, res) => {
  try {
    const patientData = { ...req.body };
    if (patientData.gender === '') delete patientData.gender;
    const patient = new Patient(patientData);
    const created = await patient.save();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a patient
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const updateData = { ...req.body };
    if (updateData.gender === '') delete updateData.gender;
    Object.assign(patient, updateData);
    const updated = await patient.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a patient
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    await patient.deleteOne();
    res.json({ message: 'Patient removed' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};