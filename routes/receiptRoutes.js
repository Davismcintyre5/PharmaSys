const express = require('express');
const { getReceipt } = require('../controllers/receiptController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/:id', protect, getReceipt);

module.exports = router;