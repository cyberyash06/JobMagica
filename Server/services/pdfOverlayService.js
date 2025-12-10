// Server/services/pdfOverlayService.js
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
      const rawX = transform[4];
      const rawY = transform[5]; // this is the PDF.js transform y (baseline/top depending on font)
      // Convert rawY to bottom-left origin (pdf-lib uses bottom-left origin too)
      const convertedY = viewport.height - rawY;

      items.push({
        text: item.str.trim(),
        x: rawX,
        y: convertedY,         // converted y (bottom-left origin)
        rawY,
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

  // Ensure box size has reasonable padding and not inverted
  const paddingX = 5;
  const paddingY = 5;
  const computedWidth = Math.max(40, (maxX - minX) + 50); // ensure min width
  const computedHeight = Math.max(24, (maxY - minY) + 20); // ensure min height

  const boundingBox = {
    x: Math.max(0, minX - paddingX),
    y: Math.max(0, minY - paddingY),
    width: computedWidth,
    height: computedHeight
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
 * Wrap text to fit width using font metrics (pdf-lib font.widthOfTextAtSize)
 */
function wrapText(text, maxWidth, font, fontSize) {
  const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanText.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && currentLine) {
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
  // box.y is already bottom-left origin (because we converted in extraction)
  let y = box.y;

  // Clamp width/height to avoid tiny/negative boxes
  const width = Math.max(40, Math.round(box.width));
  const height = Math.max(24, Math.round(box.height));

  console.log(`   Replacing at: x=${box.x.toFixed(1)}, y=${y.toFixed(1)}, w=${width.toFixed(1)}, h=${height.toFixed(1)}`);

  // White out background first (draw behind)
  page.drawRectangle({
    x: box.x,
    y: y,
    width,
    height,
    color: rgb(1, 1, 1),
    opacity: 1
  });

  // Clean text: remove zero-widths and trim
  const cleanedText = (newText || '').replace(/[\u200B-\u200F\uFEFF]/g, '').trim() || '';

  // Wrap text using font metrics so width calculation is accurate
  const maxTextWidth = Math.max(10, width - 10);
  const lines = wrapText(cleanedText, maxTextWidth, font, fontSize);
  const lineHeight = fontSize * 1.25;
  const maxLines = Math.floor((height - 10) / lineHeight);

  console.log(`   Drawing up to ${maxLines} lines (calculated), actual lines: ${lines.length}`);

  // If there are no lines (empty), skip drawing text
  if (lines.length === 0) return;

  // PDF baseline: y coordinate is baseline. We want first baseline to be slightly below top of box.
  const topPadding = 8;
  const ascentAdjustment = fontSize * 0.15; // tune if necessary
  let yPos = y + height - topPadding - ascentAdjustment;

  lines.slice(0, maxLines).forEach((line, index) => {
    if (index === maxLines - 1 && lines.length > maxLines) {
      // add ellipsis in a width-safe way: trim until it fits with '...'
      let truncated = line;
      while (font.widthOfTextAtSize(`${truncated}...`, fontSize) > maxTextWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      line = `${truncated}...`;
    }

    page.drawText(line, {
      x: box.x + 5,
      y: yPos,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth: maxTextWidth
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

    // optional debug: see a few extracted items
    console.log('DEBUG extracted items sample:', items.slice(0, 6));

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

    // debug: draw red rectangle for the extracted summary to validate coords
    // Uncomment to see a red border where the service thinks the section is.
    /*
    if (summarySection) {
      const dbgBox = summarySection.boundingBox;
      firstPage.drawRectangle({
        x: dbgBox.x,
        y: dbgBox.y,
        width: Math.max(40, dbgBox.width),
        height: Math.max(24, dbgBox.height),
        borderColor: rgb(1, 0, 0),
        borderWidth: 1,
        color: undefined
      });
      console.log('DEBUG: drew red rectangle for summary bbox');
    }
    */

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
