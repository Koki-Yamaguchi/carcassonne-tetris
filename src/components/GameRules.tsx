import React from 'react';
import './PageContent.css';

const GameRules: React.FC = () => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Game Rules</h1>
      </div>
      
      <div className="rules-content">
        <section>
          <h2>Objective</h2>
          <p>
            Carcassonne Tetris combines the strategic tile placement of Carcassonne with the falling block mechanics of Tetris. 
            Score points by completing cities, roads, and monasteries as tiles fall from the top of the board.
          </p>
        </section>

        <section>
          <h2>How to Play</h2>
          <div className="rule-item">
            <h3>Tile Movement</h3>
            <ul>
              <li><strong>Arrow Keys / WASD:</strong> Move and rotate falling tiles</li>
              <li><strong>Left/Right:</strong> Move tile horizontally</li>
              <li><strong>Down:</strong> Drop tile faster</li>
              <li><strong>Up/Space:</strong> Rotate tile 90 degrees clockwise</li>
            </ul>
          </div>

          <div className="rule-item">
            <h3>Tile Placement Rules</h3>
            <ul>
              <li>Tiles must be placed so that adjacent features match (roads connect to roads, cities to cities)</li>
              <li>You cannot place a tile where features don't align properly</li>
              <li>If no valid placement is possible, the game ends</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Scoring</h2>
          <div className="rule-item">
            <h3>Cities</h3>
            <p>When a city is completely enclosed, you score <strong>2 points per tile</strong> in that city. Cities with coat of arms (shields) are worth double points.</p>
          </div>

          <div className="rule-item">
            <h3>Roads</h3>
            <p>When a road is complete (both ends connect to cities, intersections, or other roads), you score points based on the road's length.</p>
          </div>

          <div className="rule-item">
            <h3>Monasteries</h3>
            <p>When a monastery is completely surrounded by 8 tiles, you score <strong>9 points</strong> and all 9 tiles (monastery + surrounding tiles) are removed from the board.</p>
          </div>
        </section>

        <section>
          <h2>Special Features</h2>
          <div className="rule-item">
            <h3>Gravity</h3>
            <p>After tiles are removed for completed features, remaining tiles fall down due to gravity, potentially creating new scoring opportunities.</p>
          </div>

          <div className="rule-item">
            <h3>Tile Types</h3>
            <p>Different tiles appear with different frequencies. Some rare tiles (like quadruple cities) are more valuable but appear less often.</p>
          </div>
        </section>

        <section>
          <h2>Game Over</h2>
          <p>
            The game ends when a new tile cannot be placed due to conflicting features. 
            Try to achieve the highest score possible and join the leaderboard!
          </p>
        </section>
      </div>
    </div>
  );
};

export default GameRules;
