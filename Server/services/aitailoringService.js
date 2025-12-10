// Server/services/aitailoringService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);

/**
 * AI-powered summary tailoring
 */
exports.tailorSummary = async (originalSummary, jobDescription, jobTitle) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
You are an expert resume writer. Tailor this professional summary to match the job requirements.

**Original Summary:**
${originalSummary}

**Target Job Title:** ${jobTitle}

**Job Description:**
${jobDescription}

**Instructions:**
1. Keep the summary length similar to the original (2-4 sentences, max 80 words)
2. Highlight skills and experience relevant to the job description
3. Use keywords from the job description naturally
4. Maintain professional tone
5. DO NOT fabricate experience - only reframe existing content
6. DO NOT add extra explanations or headers

**Output the tailored summary only:**
`;

    console.log('🤖 Calling Gemini API for summary...');
    const result = await model.generateContent(prompt);

    // Some Gemini SDK variants provide text differently; keep defensive here
    const rawText = typeof result.response.text === 'function'
      ? result.response.text()
      : (result.response || result).text || '';

    // Remove invisible/zero-width chars and trim
    const response = rawText.replace(/[\u200B-\u200F\uFEFF]/g, '').trim();

    console.log('✅ Gemini response received:', response.slice(0, 200));
    return response || originalSummary; // fall back if empty

  } catch (error) {
    console.error('❌ AI Summary Tailoring Error:', error.message || error);
    // Return original summary as fallback
    console.log('⚠️ Falling back to original summary');
    return originalSummary;
  }
};

/**
 * AI-powered skills tailoring
 */
exports.tailorSkills = async (originalSkills, jobDescription) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
You are an expert resume optimizer. Reorder and optimize this skills list to match the job requirements.

**Original Skills:**
${originalSkills}

**Job Description:**
${jobDescription}

**Instructions:**
1. Prioritize skills mentioned in the job description (move to top)
2. Keep all original skills - just reorder them
3. If job requires a skill that's clearly implied by existing skills, make it explicit
4. Return as comma-separated list (no bullet points, no numbers)
5. Maximum 15 skills
6. DO NOT add explanations or headers

**Output the reordered skills only (comma-separated):**
`;

    console.log('🤖 Calling Gemini API for skills...');
    const result = await model.generateContent(prompt);

    const rawText = typeof result.response.text === 'function'
      ? result.response.text()
      : (result.response || result).text || '';

    // Remove zero-width/invisible characters and trim
    const tailoredSkillsText = rawText.replace(/[\u200B-\u200F\uFEFF]/g, '').trim();
    console.log('✅ Gemini response received (skills):', tailoredSkillsText.slice(0, 200));

    const skillsArray = tailoredSkillsText
      .split(/[,\n]/)
      .map(s => s.trim().replace(/^[-•\d.)\]]+\s*/, ''))
      .filter(s => s.length > 0 && s.length < 60)
      .slice(0, 15);

    if (skillsArray.length > 0) return skillsArray;

    // fallback parse original
    return originalSkills.split(/[,\n]/).map(s => s.trim()).filter(Boolean).slice(0, 15);

  } catch (error) {
    console.error('❌ AI Skills Tailoring Error:', error.message || error);
    // Return original skills as fallback
    console.log('⚠️ Falling back to original skills');
    const fallbackSkills = originalSkills.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0).slice(0, 15);
    return fallbackSkills;
  }
};
