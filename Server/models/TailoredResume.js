const mongoose = require('mongoose');

const tailoredResumeSchema = new mongoose.Schema({
  originalResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  tailoredFilePath: {
    type: String,
    required: true
  },
  matchScore: {
    type: Number,
    default: 0
  },
  embeddingModel: {
    type: String,
    default: 'pdf-overlay'
  },
  llmModel: {
    type: String,
    default: 'gemini-2.0-flash'
  },
  iterationSteps: [{
    iteration: Number,
    action: String,
    summary: String,
    skills: [String]
  }],
  processingLogs: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TailoredResume', tailoredResumeSchema);
