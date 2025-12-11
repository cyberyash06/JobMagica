import React, { useState, useEffect } from 'react'; // ✅ Added useEffect
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFileText, FiZap, FiClock, FiMenu, FiX } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import { useResume } from '../context/ResumeContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentResumeId, workflowStep } = useResume();

  // ✅ State for window width to handle mobile view properly
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fixed navigation items - paths don't change
  const navItems = [
    { 
      key: 'upload',
      path: '/upload', 
      icon: FiUpload, 
      label: 'Upload',
      enabled: true // Always enabled
    },
    { 
      key: 'parsed',
      path: currentResumeId ? `/parsed/${currentResumeId}` : '#', 
      icon: FiFileText, 
      label: 'Parsed',
      enabled: currentResumeId !== null && ['parsed', 'tailor', 'history'].includes(workflowStep)
    },
    { 
      key: 'tailor',
      path: currentResumeId ? `/tailor/${currentResumeId}` : '#', 
      icon: FiZap, 
      label: 'Tailor',
      enabled: currentResumeId !== null && ['parsed', 'tailor', 'history'].includes(workflowStep)
    },
    { 
      key: 'history',
      path: '/history', 
      icon: FiClock, 
      label: 'History',
      enabled: true 
    }
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleNavClick = (item, e) => {
    if (!item.enabled) {
      e.preventDefault();
      return;
    }
    if (windowWidth <= 768) {
      setIsOpen(false); // close sidebar on mobile after click
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={toggleSidebar}
        style={{ display: windowWidth <= 768 ? 'block' : 'none' }}
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || windowWidth > 768) && (
          <motion.aside
            className="sidebar glass-card"
            initial={{ x: windowWidth <= 768 ? -280 : 0 }} // mobile slide from left
            animate={{ x: 0 }}
            exit={{ x: windowWidth <= 768 ? -280 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="sidebar-header">
              <h2 className="logo">
                JobMagica
              </h2>
              <p className="logo-subtitle">Resume Tailoring</p>
            </div>

            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.key} 
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''} ${!item.enabled ? 'disabled' : ''}`
                  }
                  onClick={(e) => handleNavClick(item, e)}
                  style={{
                    opacity: item.enabled ? 1 : 0.5,
                    cursor: item.enabled ? 'pointer' : 'not-allowed',
                    pointerEvents: item.enabled ? 'auto' : 'none'
                  }}
                >
                  <item.icon className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="sidebar-footer">
              <ThemeToggle />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isOpen && windowWidth <= 768 && (
        <motion.div
          className="sidebar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
