const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.route('/').get(getOrders).post(createOrder);
router.route('/:id').get(getOrder).put(updateOrder).delete(deleteOrder);

module.exports = router;