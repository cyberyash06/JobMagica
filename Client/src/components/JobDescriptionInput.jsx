import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBriefcase, FiFileText } from 'react-icons/fi';

const JobDescriptionInput = ({ jobData, onChange, onSubmit, disabled }) => {
  const [keywords, setKeywords] = useState([]);

  const handleDescriptionChange = (value) => {
    onChange('jobDescription', value);
    
    // Extract keywords (simple implementation)
    const extractedKeywords = value
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 4)
      .slice(0, 10);
    setKeywords([...new Set(extractedKeywords)]);
  };

  return (
    <motion.div
      className="job-input-card glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3>Job Details</h3>

      {/* Job Title */}
      <div className="input-group">
        <label>
          <FiBriefcase />
          Job Title *
        </label>
        <input
          type="text"
          placeholder="e.g., Senior Full-Stack Developer"
          value={jobData.jobTitle}
          onChange={(e) => onChange('jobTitle', e.target.value)}
          disabled={disabled}
          className="glass-input"
        />
      </div>

      {/* Company */}
      <div className="input-group">
        <label>
          <FiFileText />
          Company *
        </label>
        <input
          type="text"
          placeholder="e.g., TechCorp Inc."
          value={jobData.company}
          onChange={(e) => onChange('company', e.target.value)}
          disabled={disabled}
          className="glass-input"
        />
      </div>

      {/* Job Description */}
      <div className="input-group">
        <label>
          Job Description *
          <span className="label-hint">
            Paste the full job posting for best results
          </span>
        </label>
        <textarea
          placeholder="We are seeking a talented full-stack developer with expertise in React, Node.js, and MongoDB..."
          value={jobData.jobDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          disabled={disabled}
          className="glass-textarea"
          rows={12}
        />
        <p className="char-count text-muted">
          {jobData.jobDescription.length} characters
        </p>
      </div>

      {/* Keyword Preview */}
      {keywords.length > 0 && (
        <motion.div
          className="keyword-preview"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <h4>Detected Keywords</h4>
          <div className="keywords-grid">
            {keywords.map((keyword, index) => (
              <span key={index} className="keyword-tag">
                {keyword}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        className="btn-primary btn-tailor"
        onClick={onSubmit}
        disabled={disabled || !jobData.jobDescription || !jobData.jobTitle || !jobData.company}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        {disabled ? (
          <>
            <span className="spinner" />
            Tailoring...
          </>
        ) : (
          <>
            Tailor Resume
          </>
        )}
      </motion.button>
    </motion.div>
  );
};

export default JobDescriptionInput;
