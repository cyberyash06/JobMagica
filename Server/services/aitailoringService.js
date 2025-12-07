const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);

/**
 * AI-powered summary tailoring
 */
exports.tailorSummary = async (originalSummary, jobDescription, jobTitle) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

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
    const response = result.response.text().trim();
    console.log('✅ Gemini response received');
    
    return response;
    
  } catch (error) {
    console.error('❌ AI Summary Tailoring Error:', error.message);
    
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

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
    const tailoredSkillsText = result.response.text().trim();
    console.log('✅ Gemini response received');

    const skillsArray = tailoredSkillsText
      .split(/[,\n]/)
      .map(s => s.trim().replace(/^[-•\d.)\]]+\s*/, ''))
      .filter(s => s.length > 0 && s.length < 50)
      .slice(0, 15);

    return skillsArray.length > 0 ? skillsArray : originalSkills.split(',').map(s => s.trim()).slice(0, 15);
    
  } catch (error) {
    console.error('❌ AI Skills Tailoring Error:', error.message);
    
    // Return original skills as fallback
    console.log('⚠️ Falling back to original skills');
    const fallbackSkills = originalSkills.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0).slice(0, 15);
    return fallbackSkills;
  }
};
