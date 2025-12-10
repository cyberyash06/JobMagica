// Client/src/api/resumeApi.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ✅ Response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Get All Resumes
 */
export const getAllResumes = async () => {
  return api.get('/resumes');
};

/**
 * Upload Resume
 */
export const uploadResume = async (formData) => {
  return api.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};



/**
 * ✅ Tailor Resume (PDF Overlay Method)
 */
export const tailorResume = async (resumeId, payload) => {
  return api.post(`/resumes/${resumeId}/tailor`, payload);
};

/**
 * Get Resume History
 */
export const getResumeHistory = async (resumeId) => {
  return api.get(`/resumes/${resumeId}/history`);
};

/**
 * Download Tailored Resume
 */
export const downloadTailoredResume = async (tailoredId) => {
  const response = await api.get(`/resumes/tailored/${tailoredId}/download`, {
    responseType: 'blob'
  });
  
  // ✅ Auto-download file
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'tailored-resume.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

/**
 * ✅ Preview Tailored Resume
 */
export const previewTailoredResume = (tailoredId) => {
  return `${API_BASE_URL}/resumes/tailored/${tailoredId}/preview`;
};

/**
 * ✅ Preview Original Resume
 */
export const previewResume = (resumeId) => {
  return `${API_BASE_URL}/resumes/${resumeId}/preview`;
};

export default api;
