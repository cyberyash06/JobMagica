import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFileText, FiDownload, FiEye, FiX, FiZap } from 'react-icons/fi';
import Loader from '../components/Loader';
import { getAllResumes, downloadTailoredResume } from '../api/resumeApi';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    loadAllResumes();
  }, []);

  const loadAllResumes = async () => {
    try {
      setLoading(true);
      const response = await getAllResumes();
      setResumes(response.data.resumes);
    } catch (err) {
      console.error('Failed to load resumes:', err);
      setError('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeClick = (resume) => {
    setSelectedResume(resume);
  };

  const handleDownload = async (tailoredId, jobTitle, company) => {
    try {
      const blob = await downloadTailoredResume(tailoredId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${jobTitle}-${company}-tailored.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download resume');
    }
  };

  const handlePreview = (tailoredId) => {
    setPreviewUrl(`http://localhost:5000/api/resumes/tailored/${tailoredId}/preview`);
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScoreColor = (score) => {
    const percentage = score * 100;
    if (percentage >= 90) return '#10b981';
    if (percentage >= 80) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return <Loader message="Loading your resumes..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="glass-card error-card">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/upload')}>
            Go to Upload
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
    >
      <div className="page-header">
        <h1>Resume History</h1>
        <p className="text-muted">
          View all your uploaded resumes and their tailored versions
        </p>
      </div>

      {resumes.length === 0 ? (
        <div className="glass-card empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
          <FiUpload style={{ fontSize: '4rem', color: 'var(--primaryAccent)', marginBottom: '1rem' }} />
          <h3>No Resumes Yet</h3>
          <p className="text-muted">
            Upload your first resume to get started with AI-powered tailoring
          </p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/upload')}
            style={{ marginTop: '1.5rem' }}
          >
            Upload Resume
          </button>
        </div>
      ) : (
        <div className="resumes-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {resumes.map((resume, index) => (
            <motion.div
              key={resume._id}
              className="resume-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => handleResumeClick(resume)}
              style={{
                cursor: 'pointer',
                padding: '1.5rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    <FiFileText style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primaryAccent)' }} />
                    Resume {index + 1}
                  </h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {resume.originalFilename}
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Uploaded: {formatDate(resume.uploadedAt)}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: 'rgba(6, 182, 212, 0.1)',
                borderRadius: '8px',
                marginTop: '1rem'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {resume.tailoredVersions?.length || 0} Tailored Versions
                </span>
                <button
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tailor/${resume._id}`);
                  }}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <FiZap /> Tailor
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal for Tailored Versions */}
      <AnimatePresence>
        {selectedResume && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedResume(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <motion.div
              className="modal-content glass-card"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '900px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                padding: '2rem',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setSelectedResume(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--mutedText)'
                }}
              >
                <FiX />
              </button>

              <h2 style={{ marginBottom: '0.5rem' }}>
                {selectedResume.originalFilename}
              </h2>
              <p className="text-muted" style={{ marginBottom: '2rem' }}>
                Uploaded: {formatDate(selectedResume.uploadedAt)}
              </p>

              {selectedResume.tailoredVersions && selectedResume.tailoredVersions.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {selectedResume.tailoredVersions.map((tailored) => (
                    <div
                      key={tailored._id}
                      className="tailored-item"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid var(--glassBorder)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {tailored.jobTitle}
                        </h4>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                          {tailored.company}
                        </p>
                        <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          {formatDate(tailored.createdAt)}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            background: getScoreColor(tailored.matchScore),
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.9rem'
                          }}
                        >
                          {Math.round(tailored.matchScore * 100)}%
                        </div>

                        <button
                          className="btn-action"
                          onClick={() => handlePreview(tailored._id)}
                          title="Preview"
                          style={{
                            padding: '0.5rem',
                            background: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid var(--primaryAccent)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--primaryAccent)',
                            fontSize: '1.2rem'
                          }}
                        >
                          <FiEye />
                        </button>

                        <button
                          className="btn-action"
                          onClick={() => handleDownload(tailored._id, tailored.jobTitle, tailored.company)}
                          title="Download"
                          style={{
                            padding: '0.5rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid var(--success)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--success)',
                            fontSize: '1.2rem'
                          }}
                        >
                          <FiDownload />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p className="text-muted">No tailored versions yet</p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setSelectedResume(null);
                      navigate(`/tailor/${selectedResume._id}`);
                    }}
                    style={{ marginTop: '1rem' }}
                  >
                    <FiZap /> Tailor This Resume
                  </button>
                </div>
              )}

              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedResume(null);
                  navigate(`/tailor/${selectedResume._id}`);
                }}
                style={{ width: '100%', marginTop: '2rem' }}
              >
                <FiZap /> Tailor Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            className="preview-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '2rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90%',
                height: '90%',
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <button
                onClick={closePreview}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FiX />
              </button>
              <iframe
                src={previewUrl}
                title="PDF Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HistoryPage;
