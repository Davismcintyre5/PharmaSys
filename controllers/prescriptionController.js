const Prescription = require('../models/Prescription');
const PrescriptionItem = require('../models/PrescriptionItem');
const Medicine = require('../models/Medicine');
const Transaction = require('../models/Transaction');

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('patient', 'firstName lastName')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single prescription with items
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient')
      .populate('createdBy', 'username');
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    const items = await PrescriptionItem.find({ prescription: prescription._id })
      .populate('medicine', 'name unitPrice');
    res.json({ prescription, items });
  } catch (error) {
    console.error('Error fetching prescription by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new prescription (and items)
// @route   POST /api/prescriptions
// @access  Private (admin/manager/pharmacist)
const createPrescription = async (req, res) => {
  try {
    const { patient, prescribedBy, items, paymentMethod = 'cash' } = req.body;
    
    // Calculate total amount
    let totalAmount = 0;
    const medicineDetails = [];
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicine);
      if (!medicine) {
        return res.status(400).json({ message: `Medicine ${item.medicine} not found` });
      }
      const itemTotal = medicine.unitPrice * item.quantity;
      totalAmount += itemTotal;
      medicineDetails.push({ medicine, quantity: item.quantity, instruction: item.instruction, unitPrice: medicine.unitPrice });
    }
    
    // Create prescription
    const prescription = new Prescription({
      patient,
      prescribedBy,
      totalAmount,
      createdBy: req.user._id,
      status: 'pending',
    });
    const savedPrescription = await prescription.save();
    
    // Create prescription items
    for (const item of medicineDetails) {
      const prescriptionItem = new PrescriptionItem({
        prescription: savedPrescription._id,
        medicine: item.medicine._id,
        quantity: item.quantity,
        instruction: item.instruction,
      });
      await prescriptionItem.save();
    }
    
    res.status(201).json(savedPrescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update prescription status (fulfill/cancel)
// @route   PUT /api/prescriptions/:id
// @access  Private (admin/manager/pharmacist)
const updatePrescriptionStatus = async (req, res) => {
  try {
    const { status, paymentMethod = 'cash' } = req.body;
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    if (prescription.status === 'fulfilled') {
      return res.status(400).json({ message: 'Prescription already fulfilled' });
    }
    
    if (status === 'fulfilled') {
      // Update stock and create transaction
      const items = await PrescriptionItem.find({ prescription: prescription._id }).populate('medicine');
      for (const item of items) {
        if (item.medicine.currentStock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${item.medicine.name}` });
        }
        item.medicine.currentStock -= item.quantity;
        await item.medicine.save();
      }
      // Create sale transaction with pending status
      const transaction = new Transaction({
        type: 'sale',
        reference: `Prescription ${prescription._id}`,
        amount: prescription.totalAmount,
        paymentMethod,
        description: `Prescription fulfillment for patient ${prescription.patient}`,
        status: 'pending', // requires approval by accounts
        createdBy: req.user._id,
      });
      await transaction.save();
    }
    
    prescription.status = status;
    const updated = await prescription.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
};