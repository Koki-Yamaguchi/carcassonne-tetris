// Types for Carcassonne tile features and images

export type CarcassonneFeature = 'road' | 'city' | 'monastery' | 'field';

export interface CarcassonneTile {
  id: string;
  name: string;
  imagePath: string;
  features: {
    top?: CarcassonneFeature;
    right?: CarcassonneFeature;
    bottom?: CarcassonneFeature;
    left?: CarcassonneFeature;
    center?: CarcassonneFeature;
  };
  hasShield?: boolean; // For city tiles with shields
}

export interface CarcassonnePiece {
  id: string;
  shape: string[][]; // Same as current Tetris pieces
  tiles: CarcassonneTile[]; // The actual Carcassonne tiles that make up this piece
  imagePath?: string; // Optional: path to a pre-composed piece image
}

// Example tile definitions (to be expanded later)
export const SAMPLE_TILES: CarcassonneTile[] = [
  {
    id: 'monastery',
    name: 'Monastery',
    imagePath: '/images/tiles/monastery.png',
    features: {
      center: 'monastery',
      top: 'field',
      right: 'field',
      bottom: 'field',
      left: 'field',
    },
  },
  {
    id: 'road_straight',
    name: 'Straight Road',
    imagePath: '/images/tiles/road_straight.png',
    features: {
      top: 'road',
      right: 'field',
      bottom: 'road',
      left: 'field',
    },
  },
  {
    id: 'city_corner',
    name: 'City Corner',
    imagePath: '/images/tiles/city_corner.png',
    features: {
      top: 'city',
      right: 'city',
      bottom: 'field',
      left: 'field',
    },
  },
  // Add more tiles as needed
];
