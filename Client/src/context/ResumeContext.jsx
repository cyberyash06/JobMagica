import React, { createContext, useContext, useState, useEffect } from 'react';

const ResumeContext = createContext();

export const ResumeProvider = ({ children }) => {
  const [currentResumeId, setCurrentResumeId] = useState(null);
  const [workflowStep, setWorkflowStep] = useState('upload'); // upload, parsed, tailor, history

  // Load from localStorage on mount
  useEffect(() => {
    const savedResumeId = localStorage.getItem('currentResumeId');
    const savedStep = localStorage.getItem('workflowStep');
    
    if (savedResumeId) {
      setCurrentResumeId(savedResumeId);
      setWorkflowStep(savedStep || 'upload');
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (currentResumeId) {
      localStorage.setItem('currentResumeId', currentResumeId);
      localStorage.setItem('workflowStep', workflowStep);
    } else {
      localStorage.removeItem('currentResumeId');
      localStorage.removeItem('workflowStep');
    }
  }, [currentResumeId, workflowStep]);

  const startNewResume = (resumeId) => {
    setCurrentResumeId(resumeId);
    setWorkflowStep('parsed');
  };

  const resetWorkflow = () => {
    setCurrentResumeId(null);
    setWorkflowStep('upload');
    localStorage.removeItem('currentResumeId');
    localStorage.removeItem('workflowStep');
  };

  const updateStep = (step) => {
    setWorkflowStep(step);
  };

  return (
    <ResumeContext.Provider value={{
      currentResumeId,
      workflowStep,
      startNewResume,
      resetWorkflow,
      updateStep
    }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within ResumeProvider');
  }
  return context;
};
