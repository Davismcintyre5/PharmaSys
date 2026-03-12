const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;