const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const routes = require('./routes');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'PharmaSys server running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API info endpoint – lists all available endpoints
app.get('/api', (req, res) => {
  res.json({
    message: 'PharmaSys API',
    endpoints: {
      auth: '/api/auth (POST login, POST register, GET me)',
      users: '/api/users (GET, POST, PUT, DELETE) – admin only',
      patients: '/api/patients (GET, POST, PUT, DELETE)',
      medicines: '/api/medicines (GET, POST, PUT, DELETE)',
      suppliers: '/api/suppliers (GET, POST, PUT, DELETE)',
      prescriptions: '/api/prescriptions (GET, POST, PUT, DELETE)',
      orders: '/api/orders (GET, POST, PUT, DELETE)',
      dashboard: '/api/dashboard/stats (GET)',
      notifications: '/api/notifications (GET, PUT /:id/read)',
    },
  });
});

// Mount all API routes under /api
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;