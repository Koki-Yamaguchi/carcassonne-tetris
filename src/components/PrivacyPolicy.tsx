import React from 'react';
import './PageContent.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Privacy Policy</h2>
        <p className="last-updated">Last updated: July 19, 2025</p>
      </div>
      
      <div className="policy-content">
        <section>
          <h2>Information We Collect</h2>
          <div className="policy-item">
            <h3>Game Data</h3>
            <ul>
              <li>Your username (when you choose to join the leaderboard)</li>
              <li>Game scores and statistics</li>
              <li>Number of games played</li>
              <li>Anonymous user identification for game progress</li>
            </ul>
          </div>

          <div className="policy-item">
            <h3>Analytics Data</h3>
            <p>
              We use Google Analytics to understand how users interact with our game. This includes:
            </p>
            <ul>
              <li>Page views and session duration</li>
              <li>Device and browser information</li>
              <li>Geographic location (country/region level)</li>
              <li>User interactions within the game</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>How We Use Your Information</h2>
          <ul>
            <li>To maintain and display the game leaderboard</li>
            <li>To improve game performance and user experience</li>
            <li>To analyze usage patterns and optimize the game</li>
            <li>To ensure the security and proper functioning of our services</li>
          </ul>
        </section>

        <section>
          <h2>Data Storage and Security</h2>
          <p>
            Your game data is stored securely using Google Firebase services. We implement appropriate 
            technical and organizational measures to protect your personal information against unauthorized 
            access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <div className="policy-item">
            <h3>Google Firebase</h3>
            <p>We use Google Firebase for user authentication and data storage. Please review Google's Privacy Policy for more information.</p>
          </div>

          <div className="policy-item">
            <h3>Google Analytics</h3>
            <p>We use Google Analytics to understand user behavior. Google Analytics may use cookies and collect data according to their privacy policy.</p>
          </div>

          <div className="policy-item">
            <h3>Google AdSense</h3>
            <p>We may display advertisements through Google AdSense. Google may use cookies to serve relevant ads based on your interests.</p>
          </div>
        </section>

        <section>
          <h2>Your Rights</h2>
          <ul>
            <li><strong>Access:</strong> You can view your game statistics and username in the game</li>
            <li><strong>Correction:</strong> You can update your username at any time</li>
            <li><strong>Deletion:</strong> You can request deletion of your data by contacting us</li>
            <li><strong>Opt-out:</strong> You can disable analytics cookies through your browser settings</li>
          </ul>
        </section>

        <section>
          <h2>Children's Privacy</h2>
          <p>
            Our game is suitable for all ages. We do not knowingly collect personal information from children 
            under 13 without parental consent. If you believe we have collected information from a child under 13, 
            please contact us immediately.
          </p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of any material changes 
            by updating the "Last updated" date at the top of this policy.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us through 
            our GitHub repository or email.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
