const fs = require('fs').promises;
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');

/**
 * ✅ FOCUSED: Extract ONLY Summary and Skills sections with coordinates
 */

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    return { canvas, context: canvas.getContext('2d') };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

/**
 * Extract ALL text items with coordinates
 */
async function extractAllTextItems(pdfPath) {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(dataBuffer),
      useSystemFonts: true,
      canvasFactory: new NodeCanvasFactory()
    });
    
    const pdfDocument = await loadingTask.promise;
    const page = await pdfDocument.getPage(1); // Only first page
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const items = [];
    textContent.items.forEach(item => {
      if (!item.str || item.str.trim().length === 0) return;

      const transform = item.transform;
      items.push({
        text: item.str.trim(),
        x: transform[4],
        y: transform[5], // Y from bottom
        fontSize: Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]),
        pageHeight: viewport.height
      });
    });

    console.log(`📄 Extracted ${items.length} text items from page 1`);
    return { items, pageHeight: viewport.height };

  } catch (error) {
    console.error('❌ Extraction failed:', error);
    throw error;
  }
}

/**
 * Find SPECIFIC section boundaries (Summary OR Skills)
 */
function findSectionBoundaries(items, sectionName) {
  const normalizedSection = sectionName.toLowerCase();
  
  // Section header keywords
  const sectionKeywords = {
    'summary': ['professional summary', 'summary', 'objective', 'profile'],
    'skills': ['technical skills', 'skills', 'core competencies', 'expertise']
  };

  const keywords = sectionKeywords[normalizedSection] || [normalizedSection];

  // Find section heading
  let headingIndex = -1;
  for (let i = 0; i < items.length; i++) {
    const text = items[i].text.toLowerCase();
    if (keywords.some(kw => text.includes(kw) || text === kw)) {
      headingIndex = i;
      console.log(`✅ Found "${sectionName}" heading at index ${i}: "${items[i].text}"`);
      break;
    }
  }

  if (headingIndex === -1) {
    console.log(`⚠️ "${sectionName}" heading not found`);
    return null;
  }

  const heading = items[headingIndex];

  // Find NEXT section heading (to determine where this section ends)
  const allSectionStarters = [
    'summary', 'professional summary', 'objective',
    'skills', 'technical skills', 'core competencies',
    'experience', 'work experience', 'projects', 
    'education', 'certifications', 'internship'
  ];

  let nextHeadingIndex = -1;
  for (let i = headingIndex + 1; i < items.length; i++) {
    const text = items[i].text.toLowerCase();
    
    // Check if this is a different section heading
    const isNewSection = allSectionStarters.some(starter => {
      const matches = text.includes(starter) || text === starter;
      const isDifferent = !keywords.some(kw => text.includes(kw));
      return matches && isDifferent;
    });

    if (isNewSection) {
      nextHeadingIndex = i;
      console.log(`   Next section found at index ${i}: "${items[i].text}"`);
      break;
    }
  }

  // Get items ONLY in this section
  const endIndex = nextHeadingIndex === -1 ? items.length : nextHeadingIndex;
  const sectionItems = items.slice(headingIndex + 1, endIndex);

  if (sectionItems.length === 0) {
    console.log(`⚠️ No content found for "${sectionName}"`);
    return null;
  }

  // Calculate bounding box for THIS section only
  const xValues = sectionItems.map(item => item.x);
  const yValues = sectionItems.map(item => item.y);

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const boundingBox = {
    x: minX - 5,
    y: minY - 5,
    width: (maxX - minX) + 50, // Add padding
    height: (maxY - minY) + 20
  };

  const content = sectionItems.map(item => item.text).join(' ').trim();

  console.log(`📍 "${sectionName}" bounding box:`, {
    x: boundingBox.x.toFixed(1),
    y: boundingBox.y.toFixed(1),
    width: boundingBox.width.toFixed(1),
    height: boundingBox.height.toFixed(1),
    contentLength: content.length
  });

  return {
    heading,
    content,
    boundingBox,
    itemCount: sectionItems.length
  };
}

/**
 * Wrap text to fit width
 */
function wrapText(text, maxWidth, fontSize) {
  const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanText.split(' ');
  const lines = [];
  let currentLine = '';

  const avgCharWidth = fontSize * 0.55;
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    if (testLine.length > maxCharsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Replace text in bounding box
 */
function replaceInBox(page, box, newText, font, fontSize, pageHeight) {
  // Convert Y coordinate (pdfjs gives Y from bottom, we need Y from bottom)
  const y = box.y;

  console.log(`   Replacing at: x=${box.x.toFixed(1)}, y=${y.toFixed(1)}, w=${box.width.toFixed(1)}, h=${box.height.toFixed(1)}`);

  // White out
  page.drawRectangle({
    x: box.x,
    y: y,
    width: box.width,
    height: box.height,
    color: rgb(1, 1, 1),
    opacity: 1
  });

  // Wrap text
  const lines = wrapText(newText, box.width - 10, fontSize);
  const lineHeight = fontSize * 1.3;
  const maxLines = Math.floor((box.height - 10) / lineHeight);

  console.log(`   Drawing ${Math.min(lines.length, maxLines)} lines`);

  // Draw text
  let yPos = y + box.height - 12;
  lines.slice(0, maxLines).forEach((line, index) => {
    if (index === maxLines - 1 && lines.length > maxLines) {
      line = line.substring(0, line.length - 3) + '...';
    }

    page.drawText(line, {
      x: box.x + 5,
      y: yPos,
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    });
    yPos -= lineHeight;
  });
}

/**
 * ✅ MAIN: Generate tailored PDF (focused extraction)
 */
exports.generateTailoredPdfWithOverlay = async (
  originalPdfPath,
  tailoredSummary,
  tailoredSkills,
  outputPath
) => {
  try {
    console.log('📄 Starting FOCUSED extraction...');

    // 1. Extract all text items
    const { items, pageHeight } = await extractAllTextItems(originalPdfPath);

    // 2. Find ONLY Summary section
    console.log('🔍 Finding Summary section...');
    const summarySection = findSectionBoundaries(items, 'summary');

    // 3. Find ONLY Skills section
    console.log('🔍 Finding Skills section...');
    const skillsSection = findSectionBoundaries(items, 'skills');

    if (!summarySection && !skillsSection) {
      throw new Error('Could not find Summary or Skills sections');
    }

    // 4. Load PDF
    console.log('📂 Loading PDF...');
    const existingPdfBytes = await fs.readFile(originalPdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;

    // 5. Replace Summary
    if (summarySection && tailoredSummary) {
      console.log('✏️ Replacing SUMMARY...');
      replaceInBox(
        firstPage,
        summarySection.boundingBox,
        tailoredSummary,
        font,
        fontSize,
        pageHeight
      );
      console.log('   ✅ Summary replaced');
    }

    // 6. Replace Skills
    if (skillsSection && tailoredSkills) {
      console.log('✏️ Replacing SKILLS...');
      const skillsText = Array.isArray(tailoredSkills)
        ? tailoredSkills.join(', ')
        : tailoredSkills;

      replaceInBox(
        firstPage,
        skillsSection.boundingBox,
        skillsText,
        font,
        fontSize,
        pageHeight
      );
      console.log('   ✅ Skills replaced');
    }

    // 7. Save
    console.log('💾 Saving PDF...');
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    console.log('✅ Tailored PDF saved!');
    return outputPath;

  } catch (error) {
    console.error('❌ Tailoring failed:', error);
    throw error;
  }
};

/**
 * Extract original content for AI
 */
exports.extractOriginalContent = async (pdfPath) => {
  try {
    const { items } = await extractAllTextItems(pdfPath);

    const summarySection = findSectionBoundaries(items, 'summary');
    const skillsSection = findSectionBoundaries(items, 'skills');

    return {
      originalSummary: summarySection?.content || '',
      originalSkills: skillsSection?.content || ''
    };
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    return {
      originalSummary: '',
      originalSkills: ''
    };
  }
};
