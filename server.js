const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  app.use(compression());
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api', limiter);
}

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/accounts', require('./routes/accountsRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/withdrawals', require('./routes/withdrawalRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'PharmaSys API',
    version: '1.0.0',
    status: 'operational',
    endpoints: [
      '/api/auth',
      '/api/dashboard',
      '/api/medicines',
      '/api/patients',
      '/api/prescriptions',
      '/api/suppliers',
      '/api/reports',
      '/api/settings',
      '/api/receipts',
      '/api/transactions',
      '/api/accounts',
      '/api/invoices',
      '/api/withdrawals',
      '/health',
    ],
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PharmaSys API',
    version: '1.0.0',
    status: 'operational',
    message: 'Server is running',
    documentation: '/api',
    health: '/health',
  });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, 'frontend/dist');
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});