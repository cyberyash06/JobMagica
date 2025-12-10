import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTarget } from 'react-icons/fi';

const MatchScore = ({ originalScore, tailoredScore, improvement }) => {
  const [displayOriginal, setDisplayOriginal] = useState(0);
  const [displayTailored, setDisplayTailored] = useState(0);

  const originalPercentage = originalScore > 1 
  ? Math.round(originalScore) 
  : Math.round(originalScore * 100);

const tailoredPercentage = tailoredScore > 1 
  ? Math.round(tailoredScore) 
  : Math.round(tailoredScore * 100);
  const improvementNum = parseFloat(improvement || 0);

  // Animate scores
  useEffect(() => {
    let timerOriginal, timerTailored;
    let currentOriginal = 0;
    let currentTailored = 0;

    const animateOriginal = () => {
      currentOriginal += originalPercentage / 50;
      if (currentOriginal < originalPercentage) {
        setDisplayOriginal(Math.floor(currentOriginal));
        timerOriginal = setTimeout(animateOriginal, 20);
      } else {
        setDisplayOriginal(originalPercentage);
        // Start tailored animation after original completes
        animateTailored();
      }
    };

    const animateTailored = () => {
      currentTailored += tailoredPercentage / 50;
      if (currentTailored < tailoredPercentage) {
        setDisplayTailored(Math.floor(currentTailored));
        timerTailored = setTimeout(animateTailored, 20);
      } else {
        setDisplayTailored(tailoredPercentage);
      }
    };

    animateOriginal();

    return () => {
      clearTimeout(timerOriginal);
      clearTimeout(timerTailored);
    };
  }, [originalPercentage, tailoredPercentage]);

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 80) return '#f59e0b';
    return '#ef4444';
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const originalOffset = circumference - (displayOriginal / 100) * circumference;
  const tailoredOffset = circumference - (displayTailored / 100) * circumference;

  return (
    <motion.div
      className="match-score-container glass-card"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '2rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <FiTarget style={{ fontSize: '1.5rem', color: '#0bdbb6' }} />
        <h3 style={{ margin: 0 }}>Match Score Comparison</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
        {/* Original Score */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{ fontSize: '0.9rem', color: 'var(--mutedText)', marginBottom: '1rem', fontWeight: 600 }}>
            Before Tailoring
          </p>
          <div className="score-gauge" style={{ display: 'inline-block' }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="10"
              />
              <motion.circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={getScoreColor(originalPercentage)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={originalOffset}
                transform="rotate(-90 70 70)"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: originalOffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              <text
                x="70"
                y="70"
                textAnchor="middle"
                dy="8"
                style={{ fontSize: '28px', fontWeight: 700, fill: getScoreColor(originalPercentage) }}
              >
                {displayOriginal}%
              </text>
            </svg>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--mutedText)', marginTop: '0.5rem' }}>
            Original Resume
          </p>
        </motion.div>

        {/* Tailored Score */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{ fontSize: '0.9rem', color: 'var(--success)', marginBottom: '1rem', fontWeight: 600 }}>
            After Tailoring
          </p>
          <div className="score-gauge" style={{ display: 'inline-block' }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="10"
              />
              <motion.circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={getScoreColor(tailoredPercentage)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tailoredOffset}
                transform="rotate(-90 70 70)"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: tailoredOffset }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              />
              <text
                x="70"
                y="70"
                textAnchor="middle"
                dy="8"
                style={{ fontSize: '28px', fontWeight: 700, fill: getScoreColor(tailoredPercentage) }}
              >
                {displayTailored}%
              </text>
            </svg>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '0.5rem' }}>
            Optimized Resume
          </p>
        </motion.div>
      </div>

      {/* Improvement Badge */}
      {improvementNum > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))',
            borderRadius: '12px',
            border: '2px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          <FiTrendingUp style={{ fontSize: '1.5rem', color: 'var(--success)' }} />
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--mutedText)' }}>
              Score Improvement
            </p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
              +{improvementNum}%
            </p>
          </div>
        </motion.div>
      )}

      {/* Status Message */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p style={{ 
          fontSize: '0.9rem', 
          color: tailoredPercentage >= 90 ? 'var(--success)' : 'var(--warning)',
          fontWeight: 600 
        }}>
          {tailoredPercentage >= 90 
            ? '🎯 Excellent Match! Your resume is highly optimized.' 
            : tailoredPercentage >= 80 
            ? '✅ Good Match! Consider another iteration for better results.' 
            : '⚠️ Needs Improvement. Try tailoring again with more specific keywords.'}
        </p>
      </div>
    </motion.div>
  );
};

export default MatchScore;
