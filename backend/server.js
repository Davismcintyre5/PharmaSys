const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const routes = require('./routes'); // This should point to your combined routes

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS configuration – allow localhost:3000 and your production domain
const allowedOrigins = [
  'http://localhost:3000',
  'https://pharmasys.pxxl.click'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // if you need to send cookies/auth headers
}));

// Body parser
app.use(express.json());

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ------------------------------------------------------------
// JSON endpoints
// ------------------------------------------------------------

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
      accounts: '/api/accounts/balance (GET), /api/accounts/transactions (GET, POST, DELETE)',
      reports: '/api/reports/sales, /api/reports/inventory, /api/reports/financial (GET)',
      dashboard: '/api/dashboard/stats (GET)',
      settings: '/api/settings (GET, PUT)',
      notifications: '/api/notifications (GET, PUT /:id/read)',
    },
  });
});

// ------------------------------------------------------------
// Mount all API routes under /api
// ------------------------------------------------------------
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

// ------------------------------------------------------------
// Start server
// ------------------------------------------------------------
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection, shutting down...', err);
  server.close(() => process.exit(1));
});