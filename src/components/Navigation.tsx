import React, { useState } from 'react';
import './Navigation.css';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'game', label: 'Play Game' },
    { id: 'rules', label: 'Game Rules' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'terms', label: 'Terms of Use' }
  ];

  const handleMenuClick = (pageId: string) => {
    onPageChange(pageId);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo/Brand */}
        <div className="nav-brand" onClick={() => handleMenuClick('game')}>
          <h2>Carcassonne Tetris</h2>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => handleMenuClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </nav>
  );
};

export default Navigation;
