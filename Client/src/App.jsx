import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import UploadPage from './pages/UploadPage';
import ParsedPage from './pages/ParsedPage';
import TailorPage from './pages/TailorPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  const { theme } = useTheme();

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/parsed/:id" element={<ParsedPage />} />
          <Route path="/tailor/:id" element={<TailorPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
