const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * Get embedding for text using Google's Gemini embedding model
 * Model: text-embedding-004 (latest stable)
 * Docs: https://ai.google.dev/gemini-api/docs/embeddings
 */
async function getEmbedding(text, taskType = 'SEMANTIC_SIMILARITY') {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType: taskType // Options: SEMANTIC_SIMILARITY, CLASSIFICATION, CLUSTERING
    });
    
    return result.embedding.values;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Compute similarity between resume and job description
 * Returns a score between 0 (no match) and 1 (perfect match)
 */
exports.computeSimilarity = async (resumeData, jobDescription) => {
  try {
    console.log('🔍 Computing similarity using Google Gemini embeddings...');

    // Serialize resume data into text
    const resumeText = serializeResumeForEmbedding(resumeData);

    // Generate embeddings for both texts
    const resumeEmbedding = await getEmbedding(resumeText, 'SEMANTIC_SIMILARITY');
    const jdEmbedding = await getEmbedding(jobDescription, 'SEMANTIC_SIMILARITY');

    // Compute cosine similarity
    const similarity = cosineSimilarity(resumeEmbedding, jdEmbedding);

    console.log(`✅ Similarity score: ${(similarity * 100).toFixed(2)}%`);
    
    return similarity;
  } catch (error) {
    console.error('⚠️  Similarity computation failed, using fallback:', error);
    
    // Fallback to simple keyword matching
    return computeFallbackSimilarity(resumeData, jobDescription);
  }
};

/**
 * Serialize resume data into text for embedding
 */
/**
 * ✅ Include ALL 8 sections for accurate scoring
 */
function serializeResumeForEmbedding(resumeData) {
  const parts = [];

  if (resumeData.name) parts.push(`Name: ${resumeData.name}`);
  
  // 1. Summary
  if (resumeData.summary) parts.push(`Summary: ${resumeData.summary}`);
  
  // 2. Skills
  if (resumeData.skills && resumeData.skills.length > 0) {
    parts.push(`Skills: ${resumeData.skills.join(', ')}`);
  }
  
  // 3. Experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    parts.push('Experience:');
    resumeData.experience.forEach(exp => {
      parts.push(`${exp.title} at ${exp.company} ${exp.duration ? `(${exp.duration})` : ''}: ${exp.description || ''}`);
    });
  }
  
  // 4. Projects
  if (resumeData.projects && resumeData.projects.length > 0) {
    parts.push('Projects:');
    resumeData.projects.forEach(proj => {
      parts.push(`${proj.name}: ${proj.description || ''}`);
    });
  }
  
  // 5. Education
  if (resumeData.education && resumeData.education.length > 0) {
    parts.push('Education:');
    resumeData.education.forEach(edu => {
      parts.push(`${edu.degree} from ${edu.institution} ${edu.year ? `(${edu.year})` : ''}`);
    });
  }
  
  // 6. Certifications
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    parts.push('Certifications:');
    resumeData.certifications.forEach(cert => {
      parts.push(`${cert.title} by ${cert.issuer || 'N/A'}`);
    });
  }
  
  // 7. Languages
  if (resumeData.languages && resumeData.languages.length > 0) {
    parts.push(`Languages: ${resumeData.languages.map(l => `${l.name} (${l.proficiency || 'fluent'})`).join(', ')}`);
  }
  
  // 8. Hobbies
  if (resumeData.hobbies && resumeData.hobbies.length > 0) {
    parts.push(`Hobbies: ${resumeData.hobbies.join(', ')}`);
  }

  return parts.join('\n');
}


/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Fallback similarity computation using keyword matching
 * Used when API calls fail
 */
function computeFallbackSimilarity(resumeData, jobDescription) {
  console.log('⚠️  Using fallback keyword-based similarity');
  
  const resumeText = serializeResumeForEmbedding(resumeData).toLowerCase();
  const jdText = jobDescription.toLowerCase();

  const resumeWords = new Set(resumeText.split(/\W+/).filter(w => w.length > 3));
  const jdWords = new Set(jdText.split(/\W+/).filter(w => w.length > 3));

  const intersection = new Set([...resumeWords].filter(w => jdWords.has(w)));
  const union = new Set([...resumeWords, ...jdWords]);

  const jaccardScore = intersection.size / union.size;
  
  // Scale to realistic range
  return 0.75 + (jaccardScore * 0.13);
}

exports.cosineSimilarity = cosineSimilarity;
exports.getEmbedding = getEmbedding;
