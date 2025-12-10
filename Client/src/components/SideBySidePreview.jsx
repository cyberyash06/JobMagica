import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiCheckCircle, FiMaximize2 } from 'react-icons/fi';

const SideBySidePreview = ({ resumeId, tailoredId }) => {
  const [activeView, setActiveView] = useState('both');

  // ✅ FIXED: Use correct preview URLs
  const originalUrl = `http://localhost:5000/api/resumes/${resumeId}/preview`;
  const tailoredUrl = `http://localhost:5000/api/resumes/tailored/${tailoredId}/preview`;

  return (
    <motion.div
      className="side-by-side-preview glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{ marginTop: '2rem' }}
    >
      <div 
        className="preview-header" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--glassBorder)',
          paddingBottom: '1rem'
        }}
      >
        <h3>Resume Comparison</h3>
        <div className="view-toggle" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`toggle-btn ${activeView === 'original' ? 'active' : ''}`}
            onClick={() => setActiveView('original')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: activeView === 'original' ? '1px solid var(--success)' : '1px solid var(--glassBorder)',
              background: activeView === 'original' ? 'var(--success)' : 'transparent',
              color: activeView === 'original' ? 'white' : 'var(--mutedText)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            <FiFileText /> Original
          </button>
          <button
            className={`toggle-btn ${activeView === 'both' ? 'active' : ''}`}
            onClick={() => setActiveView('both')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: activeView === 'both' ? '1px solid var(--success)' : '1px solid var(--glassBorder)',
              background: activeView === 'both' ? 'var(--success)' : 'transparent',
              color: activeView === 'both' ? 'white' : 'var(--mutedText)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            <FiMaximize2 /> Both
          </button>
          <button
            className={`toggle-btn ${activeView === 'tailored' ? 'active' : ''}`}
            onClick={() => setActiveView('tailored')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: activeView === 'tailored' ? '1px solid var(--success)' : '1px solid var(--glassBorder)',
              background: activeView === 'tailored' ? 'var(--success)' : 'transparent',
              color: activeView === 'tailored' ? 'white' : 'var(--mutedText)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            <FiCheckCircle /> Tailored
          </button>
        </div>
      </div>

      <div 
        className={`preview-grid`}
        style={{
          display: 'grid',
          gridTemplateColumns: activeView === 'both' ? '1fr 1fr' : '1fr',
          gap: '1.5rem',
          minHeight: '600px'
        }}
      >
        <AnimatePresence>
          {(activeView === 'original' || activeView === 'both') && (
            <motion.div
              className="preview-panel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{
                border: '1px solid var(--glassBorder)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'white'
              }}
            >
              <div 
                className="panel-label"
                style={{
                  padding: '0.75rem',
                  background: 'var(--cardBg)',
                  borderBottom: '1px solid var(--glassBorder)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600
                }}
              >
                <FiFileText style={{ color: '#0bdbb6' }} />
                <span>Original Resume</span>
              </div>
              <iframe
                src={originalUrl}
                title="Original Resume"
                style={{
                  width: '100%',
                  height: '580px',
                  border: 'none'
                }}
              />
            </motion.div>
          )}

          {(activeView === 'tailored' || activeView === 'both') && (
            <motion.div
              className="preview-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                border: '2px solid var(--success)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'white'
              }}
            >
              <div 
                className="panel-label tailored"
                style={{
                  padding: '0.75rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderBottom: '1px solid var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  color: 'var(--success)'
                }}
              >
                <FiCheckCircle />
                <span>Tailored Resume ✨</span>
              </div>
              <iframe
                src={tailoredUrl}
                title="Tailored Resume"
                style={{
                  width: '100%',
                  height: '580px',
                  border: 'none'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Warning */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        background: 'rgba(245, 158, 11, 0.1)',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: 'var(--warning)'
      }}>
        💡 <strong>Tip:</strong> Use desktop/tablet for best side-by-side viewing. On mobile, toggle between views.
      </div>
    </motion.div>
  );
};

export default SideBySidePreview;
