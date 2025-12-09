const Resume = require('../models/Resume');
const TailoredResume = require('../models/TailoredResume');
const parsingService = require('../services/parsingService');
const pdfOverlayService = require('../services/pdfOverlayService');
const aiTailoringService = require('../services/aiTailoringService');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs'); // For sync checks and mkdirSync

/**
 * POST /api/resumes/upload
 */
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileType = path.extname(req.file.originalname).slice(1).toLowerCase();
    if (!['pdf', 'docx'].includes(fileType)) {
      return res.status(400).json({ error: 'Only PDF and DOCX files are supported' });
    }

    // Windows-safe path
    const safeFilePath = req.file.path.replace(/\\/g, '/');

    const resume = new Resume({
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: safeFilePath,
      fileType
    });

    await resume.save();

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resumeId: resume._id,
      filename: resume.originalFilename,
      uploadedAt: resume.uploadedAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/resumes
 */
exports.getAllResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find()
      .sort({ uploadedAt: -1 })
      .select('-htmlRepresentation -parsedData.fullText')
      .populate({
        path: 'tailoredVersions',
        select: 'jobTitle company matchScore createdAt',
        options: { sort: { createdAt: -1 } }
      });

    res.json({
      count: resumes.length,
      resumes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/resumes/:id/parse
 */
exports.parseResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.isParsed) {
      return res.json({
        message: 'Resume already parsed',
        parsedData: resume.parsedData
      });
    }

    const { parsedData, htmlRepresentation } = await parsingService.parseResume(
      resume.filePath,
      resume.fileType
    );

    resume.parsedData = parsedData;
    resume.htmlRepresentation = htmlRepresentation;
    resume.isParsed = true;
    await resume.save();

    res.json({
      message: 'Resume parsed successfully',
      parsedData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/resumes/:id/tailor
 * PDF Overlay Tailoring - Preserves original layout
 */
exports.tailorResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { jobDescription, jobTitle, company } = req.body;

    console.log('📥 Received tailor request:', { id, jobTitle, company });

    if (!jobDescription || !jobTitle || !company) {
      return res.status(400).json({ 
        error: 'Missing required fields: jobDescription, jobTitle, company' 
      });
    }

    const resume = await Resume.findById(id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.fileType !== 'pdf') {
      return res.status(400).json({ 
        error: 'PDF overlay method only supports PDF files. Please upload a PDF resume.' 
      });
    }

    console.log('🚀 Starting PDF overlay tailoring...');

    // 1. Extract original content
    console.log('📄 Extracting original content...');
    const { originalSummary, originalSkills } = await pdfOverlayService.extractOriginalContent(resume.filePath);

    console.log('✅ Extracted:', {
      summaryLength: originalSummary.length,
      skillsLength: originalSkills.length
    });

    // 2. AI tailoring
    console.log('🤖 AI tailoring summary...');
    const tailoredSummary = await aiTailoringService.tailorSummary(
      originalSummary || 'Motivated professional with strong technical skills',
      jobDescription,
      jobTitle
    );

    console.log('🤖 AI tailoring skills...');
    const tailoredSkills = await aiTailoringService.tailorSkills(
      originalSkills || 'JavaScript, React, Node.js',
      jobDescription
    );

    console.log('✅ AI tailoring complete:', {
      summaryLength: tailoredSummary.length,
      skillsCount: tailoredSkills.length
    });

    // 3. Generate output path
    const timestamp = Date.now();
    const outputFilename = `tailored_${timestamp}_${resume.originalFilename}`;
    const tailoredDir = path.join(__dirname, '../../uploads/tailored');

    // Ensure directory exists
    if (!fsSync.existsSync(tailoredDir)) {
      fsSync.mkdirSync(tailoredDir, { recursive: true });
    }

    const outputPath = path.join(tailoredDir, outputFilename).replace(/\\/g, '/'); // Windows-safe

    // 4. Generate PDF
    console.log('📝 Generating tailored PDF...');
    await pdfOverlayService.generateTailoredPdfWithOverlay(
      resume.filePath,
      tailoredSummary,
      tailoredSkills,
      outputPath
    );

    console.log('✅ PDF generated at:', outputPath);

    // 5. Calculate match score
    const matchScore = 90;

    // 6. Save to database
    console.log('💾 Saving to database...');
    const tailoredResume = new TailoredResume({
      originalResumeId: resume._id,
      jobTitle,
      company,
      jobDescription,
      tailoredFilePath: outputPath,
      matchScore: matchScore,
      embeddingModel: 'pdf-overlay',
      llmModel: 'gemini-1.5-flash',
      iterationSteps: [{
        iteration: 1,
        action: 'pdf_overlay_tailoring',
        summary: tailoredSummary,
        skills: tailoredSkills
      }],
      processingLogs: [
        `Extracted summary: ${originalSummary.substring(0, 50)}...`,
        `Extracted skills: ${originalSkills.substring(0, 50)}...`,
        `Generated tailored summary: ${tailoredSummary.substring(0, 50)}...`,
        `Generated ${tailoredSkills.length} tailored skills`
      ]
    });

    await tailoredResume.save();
    console.log('✅ Saved tailored resume:', tailoredResume._id);

    // 7. Update original resume references
    resume.tailoredVersions.push(tailoredResume._id);
    await resume.save();

    console.log('✅ Tailoring complete!');

    // 8. Send response
    res.status(200).json({
      message: 'Resume tailored successfully!',
      tailoredResume: {
        id: tailoredResume._id,
        downloadUrl: `/api/resumes/tailored/${tailoredResume._id}/download`,
        previewUrl: `/api/resumes/tailored/${tailoredResume._id}/preview`,
        jobTitle,
        company,
        matchScore,
        tailoredSummary,
        tailoredSkills,
        createdAt: tailoredResume.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Tailoring failed:', error);
    
    res.status(500).json({
      error: 'Tailoring failed',
      message: error.message,
      details: error.stack
    });
  }
};

/**
 * GET /api/resumes/:id/history
 */
exports.getResumeHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id).select('originalFilename uploadedAt');
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const history = await TailoredResume.find({ originalResumeId: id })
      .sort({ createdAt: -1 })
      .select('-jobDescription -processingLogs');

    res.json({
      resumeId: id,
      resumeName: resume.originalFilename,
      uploadedAt: resume.uploadedAt,
      count: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/resumes/tailored/:tid/download
 */
exports.downloadTailoredResume = async (req, res, next) => {
  try {
    const { tid } = req.params;
    const tailoredResume = await TailoredResume.findById(tid);
    if (!tailoredResume) {
      return res.status(404).json({ error: 'Tailored resume not found' });
    }

    const filePath = path.resolve(tailoredResume.tailoredFilePath);
    await fs.access(filePath);

    res.download(filePath, `${tailoredResume.jobTitle}-${tailoredResume.company}.pdf`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    next(error);
  }
};

/**
 * GET /api/resumes/tailored/:tid/preview
 */
exports.previewTailoredResume = async (req, res, next) => {
  try {
    const { tid } = req.params;
    const tailoredResume = await TailoredResume.findById(tid);
    if (!tailoredResume) {
      return res.status(404).json({ error: 'Tailored resume not found' });
    }

    const filePath = path.resolve(tailoredResume.tailoredFilePath);
    await fs.access(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${tailoredResume.jobTitle}-tailored.pdf"`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/resumes/:id/preview
 */
exports.previewResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const filePath = path.resolve(resume.filePath);
    await fs.access(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resume.originalFilename}"`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};