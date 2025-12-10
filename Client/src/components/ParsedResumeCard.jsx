// Client/src/components/ParsedResumeCard.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLinkedin, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const ParsedResumeCard = ({ data }) => {
  const [expandedSections, setExpandedSections] = useState({
    contact: true,
    skills: true,
    experience: true,
    education: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <motion.div
      className="parsed-resume-card glass-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header - Name */}
      <div className="resume-header">
        <FiUser className="header-icon" />
        <h2>{data.name || 'Name not found'}</h2>
      </div>

      {/* Contact Information */}
      <Section
        title="Contact Information"
        isExpanded={expandedSections.contact}
        onToggle={() => toggleSection('contact')}
      >
        <div className="contact-grid">
          {data.email && (
            <div className="contact-item">
              <FiMail />
              <a href={`mailto:${data.email}`}>{data.email}</a>
            </div>
          )}
          {data.phone && (
            <div className="contact-item">
              <FiPhone />
              <span>{data.phone}</span>
            </div>
          )}
          {data.linkedin && (
            <div className="contact-item">
              <FiLinkedin />
              <a href={data.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn Profile
              </a>
            </div>
          )}
        </div>
      </Section>

      {/* Summary */}
      {data.summary && (
        <Section
          title="Summary"
          isExpanded={expandedSections.summary}
          onToggle={() => toggleSection('summary')}
        >
          <p className="summary-text">{data.summary}</p>
        </Section>
      )}

      {/* Skills */}
      <Section
        title="Skills"
        count={data.skills?.length || 0}
        isExpanded={expandedSections.skills}
        onToggle={() => toggleSection('skills')}
      >
        <div className="skills-grid">
          {data.skills && data.skills.map((skill, index) => (
            <motion.span
              key={index}
              className="skill-tag"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {skill}
            </motion.span>
          ))}
        </div>
      </Section>

      {/* Experience */}
      <Section
        title="Experience"
        count={data.experience?.length || 0}
        isExpanded={expandedSections.experience}
        onToggle={() => toggleSection('experience')}
      >
        <div className="experience-list">
          {data.experience && data.experience.map((exp, index) => (
            <motion.div
              key={index}
              className="experience-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <h4>{exp.title}</h4>
              <p className="company">{exp.company}</p>
              <p className="duration text-muted">{exp.duration}</p>
              {exp.description && (
                <p className="description">{exp.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Education */}
      <Section
        title="Education"
        count={data.education?.length || 0}
        isExpanded={expandedSections.education}
        onToggle={() => toggleSection('education')}
      >
        <div className="education-list">
          {data.education && data.education.map((edu, index) => (
            <motion.div
              key={index}
              className="education-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <h4>{edu.degree}</h4>
              <p className="institution">{edu.institution}</p>
              <p className="year text-muted">{edu.year}</p>
            </motion.div>
          ))}
        </div>
      </Section>
    </motion.div>
  );
};

// Collapsible Section Component
const Section = ({ title, count, isExpanded, onToggle, children }) => {
  return (
    <div className="resume-section">
      <button className="section-header" onClick={onToggle}>
        <h3>
          {title}
          {count !== undefined && <span className="count-badge">{count}</span>}
        </h3>
        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="section-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParsedResumeCard;
