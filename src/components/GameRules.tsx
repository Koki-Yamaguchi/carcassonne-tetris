import React from 'react';
import './PageContent.css';

const GameRules: React.FC = () => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Rules</h2>
      </div>
      <div className="rules-content">
        <section>
          <h2>Objective</h2>
          <p>
            Carcassonne Tetris combines the strategic tile placement of Carcassonne with the falling block mechanics of Tetris. 
            Score points by completing cities as tiles fall from the top of the board. Try to complete as many cities as 
            possible and get on the leaderboard!
          </p>
        </section>

        <section>
          <h2>How to Play</h2>
          <div className="rule-item">
            <h3>Tile Movement</h3>
            <ul>
              <li><strong>Left (A) / Right (D):</strong> Move tile horizontally</li>
              <li><strong>Down (S):</strong> Drop tile faster</li>
              <li><strong>Up (W) / Space:</strong> Rotate tile 90 degrees clockwise</li>
            </ul>
          </div>

          <div className="rule-item">
            <h3>Tile Placement Rules</h3>
            <p>
              Tiles must be placed so that adjacent features match (roads connect to roads, cities to cities). 
              The game ends when at least one feature conflicts.
            </p>
          </div>
        </section>

        <section>
          <h2>Scoring</h2>
          <p>
            When a city is completely enclosed, you score <strong>2 points per tile</strong>, and an additional <strong>2 points per coat of arms (shield)</strong> in that city.
          </p>
        </section>
      </div>
    </div>
  );
};

export default GameRules;
