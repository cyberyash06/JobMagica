//resume.js
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  originalFilename: { type: String, required: true },
  storedFilename: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'docx'], required: true },
  uploadedAt: { type: Date, default: Date.now },
  
  // ✅ COMPLETE: All 8 sections stored separately
  parsedData: {
    // Contact Info
    name: String,
    email: String,
    phone: String,
    linkedin: String,
    location: String,
    
    // ✅ ALL 8 HEADINGS - Each with structure
    
    // 1. Summary
    summary: String,
    
    
    
    // Full text for reference
    fullText: String
  },
  
  htmlRepresentation: String,
  isParsed: { type: Boolean, default: false },
  parseError: String,
  
  tailoredVersions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailoredResume'
  }]
});

module.exports = mongoose.model('Resume', resumeSchema);
