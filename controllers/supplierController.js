const Supplier = require('../models/Supplier');

const getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find();
  res.json(suppliers);
};

const getSupplierById = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (supplier) res.json(supplier);
  else {
    res.status(404);
    throw new Error('Supplier not found');
  }
};

const createSupplier = async (req, res) => {
  const supplier = new Supplier(req.body);
  const created = await supplier.save();
  res.status(201).json(created);
};

const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (supplier) {
    Object.assign(supplier, req.body);
    const updated = await supplier.save();
    res.json(updated);
  } else {
    res.status(404);
    throw new Error('Supplier not found');
  }
};

const deleteSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (supplier) {
    await supplier.remove();
    res.json({ message: 'Supplier removed' });
  } else {
    res.status(404);
    throw new Error('Supplier not found');
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};