import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParsedResumeCard from '../components/ParsedResumeCard';
import Loader from '../components/Loader';
import { parseResume } from '../api/resumeApi';

const ParsedPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadParsedData();
  }, [id]);

  const loadParsedData = async () => {
    try {
      setLoading(true);
      const response = await parseResume(id);
      setParsedData(response.data.parsedData);
    } catch (err) {
      console.error('Parse error:', err);
      setError('Failed to parse resume. Please try uploading again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTailorResume = () => {
    navigate(`/tailor/${id}`);
  };

  if (loading) {
    return <Loader message="Parsing your resume..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="glass-card error-card">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/upload')}>
            Upload New Resume
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="page-header">
        <h1>Resume Parsed Successfully</h1>
        <p className="text-muted">
          Review the extracted information and proceed to tailor your resume
        </p>
      </div>

      <ParsedResumeCard data={parsedData} />

      <motion.div
        className="action-buttons"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button className="btn-primary" onClick={handleTailorResume}>
          Tailor This Resume
        </button>
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/upload')}
        >
          Upload Another Resume
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ParsedPage;
