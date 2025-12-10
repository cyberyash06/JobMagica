//server.js
require('dotenv').config();
const config = require('./config/env');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const resumeRoutes = require('./routes/resumeRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Create required folders on startup
const createFolders = () => {
  const folders = [
    path.join(__dirname, 'storage'),
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/tailored')
  ];
  
  folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      console.log(`✅ Created folder: ${folder}`);
    }
  });
};

createFolders();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files (for PDF downloads)
app.use('/storage', express.static(path.join(__dirname, 'storage')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/resumes', resumeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    folders: {
      storage: path.join(__dirname, 'storage'),
      uploads: path.join(__dirname, 'uploads'),
      tailored: path.join(__dirname, 'uploads/tailored')
    }
  });
});

// Error handling (must be last)
app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Storage: ${path.join(__dirname, 'storage')}`);
    console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
    console.log(`📁 Tailored: ${path.join(__dirname, 'uploads/tailored')}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
