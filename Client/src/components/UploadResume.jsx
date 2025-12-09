import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiFile, FiCheck } from 'react-icons/fi';

const UploadResume = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFileSelection(droppedFile);
  };

  const handleFileSelection = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload a PDF or DOCX file');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await onUploadComplete(formData);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <motion.div
        className={`drop-zone glass-card ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => handleFileSelection(e.target.files[0])}
          style={{ display: 'none' }}
        />

        {!file ? (
          <div className="upload-prompt">
            <FiUpload className="upload-icon" />
            <h3>Drag & Drop Resume</h3>
            <p className="text-muted">Supports PDF and DOCX</p>
            <span className="file-types"></span>
            {/* New Upload Button */}
            <button
              className="btn-browse"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Resume
            </button>
          </div>
        ) : (
          <div className="file-selected">
            <FiFile className="file-icon" />
            <div className="file-info">
              <h4>{file.name}</h4>
              <p>{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <button
              className="btn-change"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            >
              Change
            </button>
          </div>
        )}
      </motion.div>

      {file && (
        <motion.button
          className="btn-primary btn-upload"
          onClick={handleUpload}
          disabled={uploading}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {uploading ? (
            <>
              <span className="spinner" />
              Uploading...
            </>
          ) : (
            <>
              <FiCheck />
              Upload Resume
            </>
          )}
        </motion.button>
      )}
    </div>
  );
};

export default UploadResume;
