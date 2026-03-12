const app = require('./app');
const { PORT } = require('./config/env');

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection, shutting down...', err);
  server.close(() => process.exit(1));
});