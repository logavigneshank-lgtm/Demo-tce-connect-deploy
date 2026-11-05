require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// CORS configuration: allow the deployed TCE Connect frontend and local development.
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://demo-tce-connect-deploy.vercel.app',
]);

// Normalize FRONTEND_URL so a trailing slash does not cause a false CORS rejection.
if (process.env.FRONTEND_URL) {
  try {
    allowedOrigins.add(new URL(process.env.FRONTEND_URL).origin);
  } catch (error) {
    console.error('Invalid FRONTEND_URL environment variable:', process.env.FRONTEND_URL);
  }
}

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no Origin (mobile apps, health checks, or curl).
    if (!origin) return callback(null, true);

    // Keep production CORS restricted to explicitly allowed origins.
    if (process.env.NODE_ENV === 'production' && !allowedOrigins.has(origin)) {
      return callback(new Error(`CORS blocked origin: ${origin}`), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('TCE Connect Backend API is running');
});

// User routes
const userRoutes = require('./routes/user');
app.use('/api/users', userRoutes);

// Event routes
const eventRoutes = require('./routes/event');
app.use('/api/events', eventRoutes);

// Club routes
const clubRoutes = require('./routes/club');
app.use('/api/clubs', clubRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
