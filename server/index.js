const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { seedPredefinedTags } = require('./controllers/tagController');

// Routes
const problemRoutes = require('./routes/problemRoutes');
const tagRoutes = require('./routes/tagRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Connect to MongoDB
connectDB().then(() => {
  seedPredefinedTags();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'GOAT Vault API'
  });
});

// Mount Routes
app.use('/api/problems', problemRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/stats', statsRoutes);

// In production, serve frontend static build
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
} else {
  // 404 Handler in development
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.originalUrl}`
    });
  });
}

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`GOAT Vault Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = app;
