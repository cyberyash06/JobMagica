const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const resumeController = require('../controllers/resumeController');

// ✅ Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
});

// ✅ Routes
router.post('/upload', upload.single('file'), resumeController.uploadResume);
router.get('/', resumeController.getAllResumes);
router.post('/:id/parse', resumeController.parseResume);
router.post('/:id/tailor', resumeController.tailorResume);
router.get('/:id/history', resumeController.getResumeHistory);
router.get('/:id/preview', resumeController.previewResume);
router.get('/tailored/:tid/download', resumeController.downloadTailoredResume);
router.get('/tailored/:tid/preview', resumeController.previewTailoredResume);

module.exports = router;
