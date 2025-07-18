import React from 'react';
import './PageContent.css';

const TermsOfUse: React.FC = () => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Terms of Use</h1>
        <p className="last-updated">Last updated: January 17, 2025</p>
      </div>
      
      <div className="terms-content">
        <section>
          <h2>Acceptance of Terms</h2>
          <p>
            By accessing and playing Carcassonne Tetris, you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to these terms, please do not use our game.
          </p>
        </section>

        <section>
          <h2>Description of Service</h2>
          <p>
            Carcassonne Tetris is a free-to-play browser-based puzzle game that combines elements from 
            Carcassonne and Tetris. The game includes features such as:
          </p>
          <ul>
            <li>Single-player puzzle gameplay</li>
            <li>Score tracking and leaderboards</li>
            <li>Anonymous user accounts</li>
            <li>Optional username registration for leaderboard participation</li>
          </ul>
        </section>

        <section>
          <h2>User Conduct</h2>
          <p>You agree to use the game in a manner consistent with these terms and applicable laws. You agree NOT to:</p>
          <ul>
            <li>Use offensive, inappropriate, or misleading usernames</li>
            <li>Attempt to manipulate scores or game data</li>
            <li>Use automated tools, bots, or scripts to play the game</li>
            <li>Reverse engineer, decompile, or attempt to extract source code</li>
            <li>Interfere with the game's operation or other users' experience</li>
            <li>Use the game for any commercial purpose without permission</li>
          </ul>
        </section>

        <section>
          <h2>Intellectual Property</h2>
          <p>
            The game design, code, graphics, and other content are protected by copyright and other 
            intellectual property laws. The Carcassonne game concept is owned by Klaus-Jürgen Wrede 
            and Z-Man Games. This is a fan-made tribute game created for educational and entertainment purposes.
          </p>
        </section>

        <section>
          <h2>User Content</h2>
          <div className="terms-item">
            <h3>Usernames</h3>
            <p>
              When you choose a username for the leaderboard, you grant us the right to display it 
              publicly within the game. You are responsible for ensuring your username is appropriate 
              and does not violate these terms.
            </p>
          </div>

          <div className="terms-item">
            <h3>Content Moderation</h3>
            <p>
              We reserve the right to remove inappropriate usernames or content without notice. 
              Repeated violations may result in exclusion from leaderboards.
            </p>
          </div>
        </section>

        <section>
          <h2>Privacy and Data</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy to understand how we 
            collect, use, and protect your information. By using the game, you consent to our data 
            practices as described in the Privacy Policy.
          </p>
        </section>

        <section>
          <h2>Disclaimers</h2>
          <div className="terms-item">
            <h3>Service Availability</h3>
            <p>
              The game is provided "as is" without warranties of any kind. We do not guarantee 
              continuous, uninterrupted access to the game and may suspend or discontinue the 
              service at any time.
            </p>
          </div>

          <div className="terms-item">
            <h3>Data Loss</h3>
            <p>
              While we strive to maintain data integrity, we cannot guarantee against data loss. 
              Game scores and progress may be lost due to technical issues, maintenance, or other factors.
            </p>
          </div>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>
            In no event shall we be liable for any direct, indirect, incidental, special, or consequential 
            damages resulting from your use of the game, including but not limited to damages for loss of 
            data, loss of profits, or business interruption.
          </p>
        </section>

        <section>
          <h2>Termination</h2>
          <p>
            We reserve the right to terminate or suspend access to the game immediately, without prior 
            notice, for any reason, including breach of these Terms of Use.
          </p>
        </section>

        <section>
          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Changes will be effective immediately 
            upon posting. Your continued use of the game after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2>Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with applicable laws. 
            Any disputes shall be resolved through appropriate legal channels.
          </p>
        </section>

        <section>
          <h2>Contact Information</h2>
          <p>
            If you have any questions about these Terms of Use, please contact us through our 
            GitHub repository or email.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfUse;
