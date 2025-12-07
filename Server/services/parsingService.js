const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

/**
 * ✅ COMPLETE: Parse all 8 headings separately
 */
exports.parseResume = async (filePath, fileType) => {
  let extractedText = '';
  let htmlRepresentation = '';

  if (fileType === 'pdf') {
    const result = await parsePDF(filePath);
    extractedText = result.text;
    htmlRepresentation = result.html;
  } else if (fileType === 'docx') {
    const result = await parseDOCX(filePath);
    extractedText = result.text;
    htmlRepresentation = result.html;
  }

  const parsedData = extractAllHeadings(extractedText);

  return {
    parsedData,
    htmlRepresentation
  };
};

async function parsePDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);

  const html = generateStructuredHTML(data.text);

  return {
    text: data.text,
    html,
    numPages: data.numpages
  };
}

async function parseDOCX(filePath) {
  const result = await mammoth.convertToHtml({ path: filePath });
  const textResult = await mammoth.extractRawText({ path: filePath });

  return {
    text: textResult.value,
    html: `<div class="resume-content">${result.value}</div>`,
    warnings: result.messages
  };
}

/**
 * ✅ NEW: Extract all 8 headings with structure
 */
function extractAllHeadings(text) {
  console.log('📋 Parsing all 8 resume sections...');

  const normalizedText = text.replace(/\r\n/g, '\n').trim();

  // Contact info
  const name = extractName(normalizedText);
  const email = extractEmail(normalizedText);
  const phone = extractPhone(normalizedText);
  const linkedin = extractLinkedIn(normalizedText);
  const location = extractLocation(normalizedText);

  // ✅ ALL 8 HEADINGS
  const summary = extractSummary(normalizedText);
  const skills = extractSkills(normalizedText);
  const experience = extractExperience(normalizedText);
  const projects = extractProjects(normalizedText);
  const education = extractEducation(normalizedText);
  const certifications = extractCertifications(normalizedText);
  const languages = extractLanguages(normalizedText);
  const hobbies = extractHobbies(normalizedText);

  console.log('✅ Parsed 8 sections:');
  console.log(`   1. Summary: ${summary ? '✓' : '✗'}`);
  console.log(`   2. Skills: ${skills.length || 0} items`);
  console.log(`   3. Experience: ${experience.length || 0} positions`);
  console.log(`   4. Projects: ${projects.length || 0} items`);
  console.log(`   5. Education: ${education.length || 0} degrees`);
  console.log(`   6. Certifications: ${certifications.length || 0} items`);
  console.log(`   7. Languages: ${languages.length || 0} languages`);
  console.log(`   8. Hobbies: ${hobbies.length || 0} items`);

  // ✅ Return with ALL headings (empty if not found)
  return {
    name,
    email,
    phone,
    linkedin,
    location,
    summary: summary || '',
    skills: skills || [],
    experience: experience || [],
    projects: projects || [],
    education: education || [],
    certifications: certifications || [],
    languages: languages || [],
    hobbies: hobbies || [],
    fullText: normalizedText
  };
}

function extractName(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const firstLine = lines[0] || '';
  
  if (firstLine.split(' ').length >= 2 && firstLine.split(' ').length <= 5 && !/[@\d]/.test(firstLine)) {
    return firstLine.trim();
  }
  return null;
}

function extractEmail(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

function extractPhone(text) {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
}

function extractLinkedIn(text) {
  const linkedinRegex = /(linkedin\.com\/in\/[\w-]+)/i;
  const match = text.match(linkedinRegex);
  return match ? `https://${match[1]}` : null;
}

function extractLocation(text) {
  const locationRegex = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b/;
  const match = text.match(locationRegex);
  return match ? match[0] : null;
}

/**
 * ✅ 1. SUMMARY - Extract as text
 */
function extractSummary(text) {
  const regex = /(?:professional\s+)?summary\s*:?\s*\n([\s\S]+?)(?=\n\s*(?:skills?|experience|education|projects?|certifications?|languages?|hobbies|interests|$))/i;
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * ✅ 2. SKILLS - Extract as array
 */
function extractSkills(text) {
  const regex = /(?:technical\s+)?skills?\s*:?\s*\n([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:experience|education|projects?|certifications?|languages?|hobbies|$))/i;
  const match = text.match(regex);
  
  if (match) {
    const skillsText = match[1];
    const skills = skillsText
      .split(/[,|•\-➢\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 50)
      .filter(s => !/^\d+$/.test(s));
    
    return [...new Set(skills)];
  }
  
  return [];
}

/**
 * ✅ 3. EXPERIENCE - Extract as structured objects
 */
function extractExperience(text) {
  const regex = /(?:work\s+)?(?:professional\s+)?experience\s*:?\s*\n([\s\S]+?)(?=\n\s*(?:education|projects?|skills?|certifications?|languages?|hobbies|$))/i;
  const match = text.match(regex);
  
  if (!match) return [];
  
  const expText = match[1];
  const jobs = expText.split(/\n\s*\n/).filter(j => j.trim().length > 10);
  
  return jobs.map((job, idx) => {
    const lines = job.split('\n').map(l => l.trim()).filter(l => l);
    
    return {
      title: lines[0] || `Position ${idx + 1}`,
      company: lines[1] || '',
      duration: extractDuration(job),
      location: extractLocation(job) || '',
      description: lines.slice(2).join('\n').trim()
    };
  });
}

/**
 * ✅ 4. PROJECTS - Extract as structured objects
 */
function extractProjects(text) {
  const regex = /projects?\s*:?\s*\n([\s\S]+?)(?=\n\s*(?:education|experience|skills?|certifications?|languages?|hobbies|$))/i;
  const match = text.match(regex);
  
  if (!match) return [];
  
  const projectsText = match[1];
  const projects = projectsText.split(/\n(?=➢|•|–|-\s+[A-Z])/).filter(p => p.trim());
  
  return projects.map(proj => {
    const lines = proj.split('\n').map(l => l.trim()).filter(l => l);
    
    return {
      name: lines[0]?.replace(/^[➢•\-]\s*/, '') || '',
      description: lines.slice(1).join(' ').trim(),
      technologies: '',
      link: ''
    };
  });
}

/**
 * ✅ 5. EDUCATION - Extract as structured objects
 */
function extractEducation(text) {
  const regex = /education\s*:?\s*\n([\s\S]+?)(?=\n\s*(?:experience|projects?|skills?|certifications?|languages?|hobbies|$))/i;
  const match = text.match(regex);
  
  if (!match) return [];
  
  const eduText = match[1];
  const entries = eduText.split(/\n\s*\n/).filter(e => e.trim().length > 5);
  
  return entries.map(entry => {
    const lines = entry.split('\n').map(l => l.trim()).filter(l => l);
    
    return {
      degree: lines[0] || '',
      institution: lines[1] || '',
      year: extractYear(entry),
      details: lines.slice(2).join(' ').trim()
    };
  });
}

/**
 * ✅ 6. CERTIFICATIONS - Extract as structured objects
 */
function extractCertifications(text) {
  const regex = /(?:certifications?|achievements?|awards?)\s*:?\s*\n([\s\S]+?)(?=\n\s*(?:education|experience|projects?|skills?|languages?|hobbies|$))/i;
  const match = text.match(regex);
  
  if (!match) return [];
  
  const certText = match[1];
  const certs = certText.split(/\n(?=•|–|-\s)/).filter(c => c.trim());
  
  return certs.map(cert => {
    const lines = cert.split('\n').map(l => l.trim()).filter(l => l);
    
    return {
      title: lines[0]?.replace(/^[•\-]\s*/, '') || '',
      issuer: lines[1] || '',
      year: extractYear(cert),
      details: lines.slice(2).join(' ').trim()
    };
  });
}

/**
 * ✅ 7. LANGUAGES - Extract as structured objects
 */
function extractLanguages(text) {
  const regex = /languages?\s*:?\s*\n([\s\S]+?)(?=\n\s*(?:hobbies|interests|education|experience|projects?|skills?|certifications?|$))/i;
  const match = text.match(regex);
  
  if (!match) return [];
  
  const langText = match[1];
  const languages = langText.split(/[,•\n]/).map(l => l.trim()).filter(l => l.length > 0);
  
  return languages.map(lang => {
    // Try to extract language and proficiency
    const parts = lang.split(/[-–—:]/);
    return {
      name: parts[0]?.trim() || lang,
      proficiency: parts[1]?.trim() || ''
    };
  });
}

/**
 * ✅ 8. HOBBIES - Extract as array
 */
function extractHobbies(text) {
  const regex = /(?:hobbies|interests?)\s*:?\s*\n([\s\S]+?)(?=\n\s*(?:education|experience|projects?|skills?|certifications?|languages?|$))/i;
  const match = text.match(regex);
  
  if (!match) return [];
  
  const hobbiesText = match[1];
  const hobbies = hobbiesText
    .split(/[,•\n]/)
    .map(h => h.trim().replace(/^[•\-]\s*/, ''))
    .filter(h => h.length > 0);
  
  return hobbies;
}

// Helper functions
function extractDuration(text) {
  const durationMatch = text.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}|present|current\b/i);
  return durationMatch ? durationMatch[0] : '';
}

function extractYear(text) {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : '';
}

function generateStructuredHTML(text) {
  const lines = text.split('\n');
  let html = '<div class="resume-content" style="font-family: Arial, sans-serif; line-height: 1.6;">';
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      html += '<br>';
    } else if (/^(summary|skills?|experience|education|projects?|certifications?|languages?|hobbies|interests)/i.test(trimmed)) {
      html += `<h2 style="color: #2563eb; margin-top: 20px;">${escapeHtml(trimmed)}</h2>`;
    } else if (/^[•\-\*➢]/.test(trimmed)) {
      html += `<li style="margin-left: 20px;">${escapeHtml(trimmed.replace(/^[•\-\*➢]\s*/, ''))}</li>`;
    } else {
      html += `<p>${escapeHtml(trimmed)}</p>`;
    }
  });
  
  html += '</div>';
  return html;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
