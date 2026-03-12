const Order = require('../models/Order.model');

// @desc    Get all orders
// @route   GET /api/orders
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('patientId')
      .populate('items.medicineId')
      .populate('createdBy', 'name');
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('patientId')
      .populate('items.medicineId')
      .populate('createdBy', 'name');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new order
// @route   POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    // Add createdBy from authenticated user
    req.body.createdBy = req.user.id;
    const order = await Order.create(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
exports.updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};