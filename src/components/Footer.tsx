import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          © {currentYear} Koki Yamaguchi. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
