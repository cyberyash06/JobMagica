// Client/src/pages/UploadPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import UploadResume from '../components/UploadResume';
import { uploadResume } from '../api/resumeApi';
import { useResume } from '../context/ResumeContext';

const UploadPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { startNewResume, resetWorkflow } = useResume();

  React.useEffect(() => {
    resetWorkflow();
  }, []);

  const handleUploadComplete = async (formData) => {
    setLoading(true);
    try {
      // ✅ UPDATED: Only upload file (parsing happens automatically in background)
      const uploadResponse = await uploadResume(formData);
      const { resumeId } = uploadResponse.data;

      // ❌ REMOVED: await parseResume(resumeId); - No longer needed!

      startNewResume(resumeId);

      // ✅ UPDATED: Navigate directly to tailor page (skip parsed page)
      navigate(`/tailor/${resumeId}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="page-header">
        <h1>Upload Your Resume</h1>
        <p className="text-muted">
          Upload your PDF or DOCX resume to get started with AI-powered tailoring
        </p>
      </div>

      <div className="upload-section">
        <UploadResume onUploadComplete={handleUploadComplete} />
      </div>

      {loading && (
        <motion.div
          className="processing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="glass-card processing-card">
            <div className="spinner-large" />
            <h3>Uploading Your Resume...</h3>
            <p className="text-muted">Processing in background...</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UploadPage;
