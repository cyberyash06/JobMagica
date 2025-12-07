/**
 * Environment configuration loader
 * Validates required environment variables
 */
require('dotenv').config();

const requiredEnvVars = [
  'MONGO_URI',
  'PORT'
];

// Check for required environment variables
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Optional warnings
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set - using placeholder AI functions');
}

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  openaiApiKey: process.env.OPENAI_API_KEY,
  targetMatchScoreMin: parseFloat(process.env.TARGET_MATCH_SCORE_MIN) || 0.90,
  targetMatchScoreMax: parseFloat(process.env.TARGET_MATCH_SCORE_MAX) || 0.92,
  maxTailoringIterations: parseInt(process.env.MAX_TAILORING_ITERATIONS) || 3
};
