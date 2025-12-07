const fs = require('fs').promises;
const path = require('path');

/**
 * Ensure directory exists, create if not
 */
exports.ensureDir = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Delete file if exists
 */
exports.deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    return false;
  }
};

/**
 * Check if file exists
 */
exports.fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file stats
 */
exports.getFileStats = async (filePath) => {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    return null;
  }
};
