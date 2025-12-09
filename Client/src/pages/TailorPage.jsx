import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import JobDescriptionInput from '../components/JobDescriptionInput';
import MatchScore from '../components/MatchScore';
import SideBySidePreview from '../components/SideBySidePreview';
import Loader from '../components/Loader';
import { tailorResume } from '../api/resumeApi';
import { useResume } from '../context/ResumeContext';

const TailorPage = () => {
  const { id } = useParams();
  const { updateStep } = useResume();

  useEffect(() => {
    updateStep('tailor');
  }, []);

  const navigate = useNavigate();
  const [jobData, setJobData] = useState({
    jobDescription: '',
    jobTitle: '',
    company: ''
  });
  const [tailoring, setTailoring] = useState(false);
  const [tailoringResult, setTailoringResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const handleTailor = async () => {
    if (!jobData.jobDescription || !jobData.jobTitle || !jobData.company) {
      alert('Please fill in all required fields');
      return;
    }

    setTailoring(true);
    setError(null);
    setTailoringResult(null);

    try {
      const response = await tailorResume(id, jobData);
      console.log('✅ Full response:', response.data);

      // ✅ FIXED: Extract correct data structure
      const result = response.data.tailoredResume;

      if (!result || !result.id) {
        throw new Error('Invalid response: Missing tailored resume ID');
      }

      // ✅ FIXED: Transform to match your component's expectations
      const transformedResult = {
        tailoredId: result.id,  // ✅ Map 'id' to 'tailoredId'
        originalScore: 0.70,     // Placeholder (backend doesn't calculate this yet)
        tailoredScore: result.matchScore / 100, // Convert 90 to 0.90
        matchScore: result.matchScore / 100,
        improvement: result.matchScore - 70, // Placeholder calculation
        iterations: result.iterationSteps?.length || 1,
        jobTitle: result.jobTitle,
        company: result.company,
        downloadUrl: result.downloadUrl,
        previewUrl: result.previewUrl
      };

      console.log('✅ Transformed result:', transformedResult);
      setTailoringResult(transformedResult);

    } catch (err) {
      console.error('❌ Tailoring error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to tailor resume. Please try again.');
    } finally {
      setTailoring(false);
    }
  };

  const handleDownload = async () => {
    if (!tailoringResult || !tailoringResult.tailoredId) {
      alert('No tailored resume available to download');
      return;
    }

    try {
      const downloadUrl = `http://localhost:5000/api/resumes/tailored/${tailoringResult.tailoredId}/download`;
      console.log('📥 Downloading from:', downloadUrl);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download tailored resume');
    }
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  if (tailoring) {
    return <Loader message="Tailoring your resume to match the job description..." />;
  }

  return (
    <motion.div
      className="page-container tailor-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h1>Tailor Your Resume</h1>
        <p className="text-muted">
          Optimize your resume to match the job description with AI-driven tailoring
        </p>
      </div>

      {error && (
        <div className="error-banner glass-card">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="tailor-grid">
        <div className="input-section">
          <JobDescriptionInput
            jobData={jobData}
            onChange={handleInputChange}
            onSubmit={handleTailor}
            disabled={tailoring}
          />
        </div>

        {tailoringResult && (
          <div className="results-section">
            {/* ✅ Pass correct props to MatchScore */}
            <MatchScore
              originalScore={tailoringResult.originalScore}
              tailoredScore={tailoringResult.tailoredScore}
              improvement={tailoringResult.improvement}
            />

            <motion.div
              className="result-actions glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3>Tailoring Complete! 🎉</h3>
              <p className="text-muted">
                Your resume has been optimized with {tailoringResult.iterations} iteration(s)
                {tailoringResult.improvement && ` • Improved by +${tailoringResult.improvement}%`}
              </p>

              <div className="button-group">
                <button className="btn-primary" onClick={handleDownload}>
                  Download Tailored Resume
                </button>
                <button
                  className="btn-secondary"
                  style={{ marginLeft: '1rem' }}
                  onClick={handleViewHistory}
                >
                  View History
                </button>

              </div>
            </motion.div>

            {/* ✅ Pass correct tailoredId */}
            <SideBySidePreview
              resumeId={id}
              tailoredId={tailoringResult.tailoredId}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TailorPage;
