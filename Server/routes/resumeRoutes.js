const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const resumeController = require('../controllers/resumeController');
const fs = require('fs');

// ✅ Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
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

// ✅ Resume routes
router.post('/upload', upload.single('file'), resumeController.uploadResume);
router.get('/', resumeController.getAllResumes);

// ❌ REMOVED: Parse route - parsing happens automatically in background
// router.post('/:id/parse', resumeController.parseResume);

router.post('/:id/tailor', resumeController.tailorResume);
router.get('/:id/history', resumeController.getResumeHistory);
router.get('/:id/preview', resumeController.previewResume);
router.get('/tailored/:tid/download', resumeController.downloadTailoredResume);
router.get('/tailored/:tid/preview', resumeController.previewTailoredResume);

module.exports = router;
