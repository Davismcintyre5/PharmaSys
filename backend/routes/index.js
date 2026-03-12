const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const patientRoutes = require('./patient.routes');
const medicineRoutes = require('./medicine.routes');
const supplierRoutes = require('./supplier.routes');
const prescriptionRoutes = require('./prescription.routes');
const orderRoutes = require('./order.routes');
const dashboardRoutes = require('./dashboard.routes');
const notificationRoutes = require('./notification.routes');
const settingRoutes = require('./setting.routes');
const accountRoutes = require('./account.routes');
const reportRoutes = require('./report.routes');


router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/patients', patientRoutes);
router.use('/medicines', medicineRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingRoutes);
router.use('/accounts', accountRoutes);
router.use('/reports', reportRoutes);

module.exports = router;