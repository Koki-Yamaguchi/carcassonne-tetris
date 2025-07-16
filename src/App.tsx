import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { UnionFind } from './union_find';
import { db, auth } from './firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';

// Carcassonne tile names mapping to your images
const CARCASSONNE_TILES = [
  'straight',
  'curve',
  'triple_road',
  'quadruple_road',
  'triangle',
  'connector',
  'city_cap',
  'monastery',
  'separator',
  'vertical_separator',
  'left',
  'right',
  'triangle_with_road',
  'city_cap_with_straight',
  'monastery_with_road',
  'triple_city',
  'connector_with_coa',
  'triangle_with_coa',
  'triangle_with_road_with_coa',
  'triple_city_with_coa',
  'triple_city_with_road',
  'triple_city_with_road_with_coa',
  'quadruple_city_with_coa',
  'city_cap_with_crossroads',
];

// Tile weights for probability distribution (higher number = more likely to appear)
const TILE_WEIGHTS = [
  10, // straight
  10, // curve
  6, // triple_road
  3, // quadruple_road
  5, // triangle
  2, // connector
  10, // city_cap
  0, // monastery
  0, // separator
  0, // vertical_separator
  10, // left
  10, // right
  5, // triangle_with_road
  10, // city_cap_with_straight
  0, // monastery_with_road
  5, // triple_city
  5, // connector_with_coa
  3, // triangle_with_coa
  3, // triangle_with_road_with_coa
  2, // triple_city_with_coa
  2, // triple_city_with_road
  4, // triple_city_with_road_with_coa
  1, // quadruple_city_with_coa
  8, // city_cap_with_crossroads
];

// Helper function to select a weighted random tile
function selectWeightedRandomTile(): string {
  const totalWeight = TILE_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < CARCASSONNE_TILES.length; i++) {
    random -= TILE_WEIGHTS[i];
    if (random <= 0) {
      return CARCASSONNE_TILES[i];
    }
  }

  // Fallback to last tile (should never happen)
  return CARCASSONNE_TILES[CARCASSONNE_TILES.length - 1];
}

// Each "piece" is now just a single Carcassonne tile

const BOARD_WIDTH = 8;
const BOARD_HEIGHT = 8;

interface Position {
  x: number;
  y: number;
}

interface GamePiece {
  shape: string[][];
  position: Position;
  tileName: string; // Store the actual tile name
  rotation: number; // Store rotation in degrees (0, 90, 180, 270)
}

interface BoardCell {
  tileName: string;
  rotation: number;
  id: number;
}

interface Side {
  num: number;
  feature: 'road' | 'city';
}

interface GlobalRankingEntry {
  score: number; // User's best score
  username: string;
  uid: string; // Firebase Auth UID
  timestamp: any; // User's lastPlayed timestamp
  date: string; // Formatted date of last play
  id?: string; // Firestore document ID (user's uid)
}

interface UserProfile {
  uid: string; // Firebase Auth UID (also the document ID)
  username: string;
  bestScore: number;
  totalGames: number;
  createdAt: any; // Firestore serverTimestamp
  lastPlayed: any; // Firestore serverTimestamp
}

// Helper function to get tile sides based on tile name (not rotated)
function getTileSides(tileName: string): (Side | null)[] {
  switch (tileName) {
    case 'straight':
      return [
        { num: 0, feature: 'road' },
        null,
        { num: 0, feature: 'road' },
        null,
      ];
    case 'curve':
      return [
        null,
        null,
        { num: 0, feature: 'road' },
        { num: 0, feature: 'road' },
      ];
    case 'triple_road':
      return [
        null,
        { num: 0, feature: 'road' },
        { num: 1, feature: 'road' },
        { num: 2, feature: 'road' },
      ];
    case 'quadruple_road':
      return [
        { num: 0, feature: 'road' },
        { num: 1, feature: 'road' },
        { num: 2, feature: 'road' },
        { num: 3, feature: 'road' },
      ];
    case 'triangle':
      return [
        { num: 0, feature: 'city' },
        null,
        null,
        { num: 0, feature: 'city' },
      ];
    case 'connector':
      return [
        null,
        { num: 0, feature: 'city' },
        null,
        { num: 0, feature: 'city' },
      ];
    case 'city_cap':
      return [{ num: 0, feature: 'city' }, null, null, null];
    case 'triple_city':
      return [
        { num: 0, feature: 'city' },
        { num: 0, feature: 'city' },
        null,
        { num: 0, feature: 'city' },
      ];
    case 'monastery':
      return [null, null, null, null];
    case 'monastery_with_road':
      return [null, null, { num: 0, feature: 'road' }, null];
    case 'city_cap_with_crossroads':
      return [
        { num: 0, feature: 'city' },
        { num: 0, feature: 'road' },
        { num: 1, feature: 'road' },
        { num: 2, feature: 'road' },
      ];
    case 'city_cap_with_straight':
      return [
        { num: 0, feature: 'city' },
        { num: 0, feature: 'road' },
        null,
        { num: 0, feature: 'road' },
      ];
    case 'connector_with_coa':
      return [
        null,
        { num: 0, feature: 'city' },
        null,
        { num: 0, feature: 'city' },
      ];
    case 'left':
      return [
        { num: 0, feature: 'city' },
        null,
        { num: 0, feature: 'road' },
        { num: 0, feature: 'road' },
      ];
    case 'right':
      return [
        { num: 0, feature: 'city' },
        { num: 0, feature: 'road' },
        { num: 0, feature: 'road' },
        null,
      ];
    case 'quadruple_city_with_coa':
      return [
        { num: 0, feature: 'city' },
        { num: 0, feature: 'city' },
        { num: 0, feature: 'city' },
        { num: 0, feature: 'city' },
      ];
    case 'separator':
      return [
        { num: 0, feature: 'city' },
        null,
        null,
        { num: 1, feature: 'city' },
      ];
    case 'triangle_with_coa':
      return [
        { num: 0, feature: 'city' },
        null,
        null,
        { num: 0, feature: 'city' },
      ];
    case 'triangle_with_road':
      return [
        { num: 0, feature: 'city' },
        { num: 0, feature: 'road' },
        { num: 0, feature: 'road' },
        { num: 0, feature: 'city' },
      ];
    case 'triangle_with_road_with_coa':
      return [
        { num: 0, feature: 'city' },
        { num: 0, feature: 'road' },
        { num: 0, feature: 'road' },
        { num: 0, feature: 'city' },
      ];
    case 'triple_city_with_coa':
      return [
        { num: 0, feature: 'city' },
        { num: 0, feature: 'city' },
        null,
        { num: 0, feature: 'city' },
      ];
    case 'triple_city_with_road':
      return [
        { num: 0, feature: 'city' },
        { num: 0, feature: 'city' },
        { num: 0, feature: 'road' },
        { num: 0, feature: 'city' },
      ];
    case 'triple_city_with_road_with_coa':
      return [
        { num: 0, feature: 'city' },
        { num: 0, feature: 'city' },
        { num: 0, feature: 'road' },
        { num: 0, feature: 'city' },
      ];
    case 'vertical_separator':
      return [
        { num: 0, feature: 'city' },
        null,
        { num: 1, feature: 'city' },
        null,
      ];
  }
  return [null, null, null, null];
}

// Rotate sides array according to rotation
function rotateSides(
  sides: (Side | null)[],
  rotation: number
): (Side | null)[] {
  const steps = (rotation / 90) % 4;
  if (steps === 0) return sides;

  const rotated = [...sides];
  for (let i = 0; i < steps; i++) {
    // Rotate clockwise: [0,1,2,3] -> [3,0,1,2]
    rotated.unshift(rotated.pop()!);
  }
  return rotated;
}

// Global tile ID counter
// let nextTileIdGlobal = 1;

// Map to store feature IDs for each tile's roads and cities
const tileRoadFeatures = new Map<number, number[]>();
const tileCityFeatures = new Map<number, number[]>();

const createOrUpdateUserProfile = async (uid: string, username: string, score: number): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user (don't increment totalGames here - it's handled separately)
      const userData = userDoc.data() as UserProfile;
      const newBestScore = Math.max(userData.bestScore, score);
      
      await updateDoc(userRef, {
        username,
        bestScore: newBestScore,
        lastPlayed: serverTimestamp()
      });
    } else {
      // Create new user profile (should rarely happen since totalGames is updated on game over)
      await setDoc(userRef, {
        uid,
        username,
        bestScore: score,
        totalGames: 1, // This will be correct if it's their first game
        createdAt: serverTimestamp(),
        lastPlayed: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
};

const createInitialUserProfile = async (uid: string): Promise<UserProfile> => {
  try {
    const userRef = doc(db, 'users', uid);
    const newProfile: UserProfile = {
      uid,
      username: '', // Empty initially, will be set when user submits first score
      bestScore: 0,
      totalGames: 0,
      createdAt: serverTimestamp(),
      lastPlayed: serverTimestamp()
    };
    
    await setDoc(userRef, newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error creating initial user profile:', error);
    // Return a fallback profile that can be used locally until Firestore is available
    return {
      uid,
      username: '',
      bestScore: 0,
      totalGames: 0,
      createdAt: new Date(),
      lastPlayed: new Date()
    };
  }
};

const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

const isPersonalBest = async (uid: string, score: number): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      return true; // First time playing
    }
    return score > userProfile.bestScore;
  } catch (error) {
    console.error('Error checking personal best:', error);
    return true; // Allow submission on error
  }
};

const getGlobalRankings = async (): Promise<GlobalRankingEntry[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('bestScore', 'desc'),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => {
        const userData = doc.data() as UserProfile;
        return {
          score: userData.bestScore,
          username: userData.username || 'Anonymous',
          uid: userData.uid,
          timestamp: userData.lastPlayed,
          date: userData.lastPlayed ? new Date(userData.lastPlayed.toDate()).toLocaleDateString() : 'Unknown',
          id: doc.id
        };
      })
      .filter(entry => entry.score > 0); // Only show users who have played at least one game
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};

// Local storage functions for username
const saveUsername = (username: string) => {
  localStorage.setItem('carcassonne-tetris-username', username);
};

const getSavedUsername = (): string => {
  return localStorage.getItem('carcassonne-tetris-username') || '';
};

const updateUserTotalGames = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user's total games count
      const userData = userDoc.data() as UserProfile;
      await updateDoc(userRef, {
        totalGames: userData.totalGames + 1,
        lastPlayed: serverTimestamp()
      });
    } else {
      // If no profile exists, create one with 1 game played
      await setDoc(userRef, {
        uid,
        username: '',
        bestScore: 0,
        totalGames: 1,
        createdAt: serverTimestamp(),
        lastPlayed: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating user total games:', error);
  }
};

function App() {
  const [board, setBoard] = useState<(BoardCell | null)[][]>(
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<GamePiece | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('carcassonne-tetris-best');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [nextTileId, setNextTileId] = useState(1);
  const [blinkingTiles, setBlinkingTiles] = useState<Set<number>>(new Set());
  const [globalRankings, setGlobalRankings] = useState<GlobalRankingEntry[]>([]);
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [username, setUsername] = useState(() => getSavedUsername());
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const uf = useState(() => new UnionFind())[0];

  // Initialize anonymous authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser(firebaseUser);
        let profile = await getUserProfile(firebaseUser.uid);
        
        // If no profile exists, create one immediately
        if (!profile) {
          profile = await createInitialUserProfile(firebaseUser.uid);
          console.log('Created initial user profile for new user');
        }
        
        setUserProfile(profile);
        
        // If user has a profile with username, use it
        if (profile && profile.username) {
          setUsername(profile.username);
          saveUsername(profile.username);
        }
      } else {
        // No user is signed in, sign in anonymously
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Error signing in anonymously:', error);
        }
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  // Helper functions for road management
  const getAdjacentPosition = useCallback(
    (x: number, y: number, side: number): { x: number; y: number } => {
      // side: 0=north, 1=east, 2=south, 3=west
      switch (side) {
        case 0:
          return { x, y: y - 1 }; // north
        case 1:
          return { x: x + 1, y }; // east
        case 2:
          return { x, y: y + 1 }; // south
        case 3:
          return { x: x - 1, y }; // west
        default:
          return { x, y };
      }
    },
    []
  );

  const getOppositeSide = useCallback((side: number): number => {
    return (side + 2) % 4;
  }, []);

  // DISABLED: Road feature creation function - commented out for city testing
  // const createRoadFeatures = useCallback((tileName: string, tileId: number): number[] => {
  //   const sides = getTileSides(tileName);
  //   const featureIds: number[] = [];
  //   const featureMap = new Map<number, number>(); // roadNum -> featureId
  //
  //   for (let i = 0; i < sides.length; i++) {
  //     const side = sides[i];
  //     if (side && side.feature === 'road') {
  //       if (!featureMap.has(side.num)) {
  //         // Count how many sides this road connects to
  //         const sameRoadSides = sides.filter(s => s && s.feature === 'road' && s.num === side.num);
  //         const roadSideCount = sameRoadSides.length;
  //
  //         // Calculate initial open sides based on actual connections
  //         let initialOpenSides: number;
  //         if (roadSideCount === 1) {
  //           // Single-ended road (like monastery_with_road south side, or roads that end at city centers)
  //           initialOpenSides = 1;
  //         } else if (roadSideCount === 2) {
  //           // Two-ended road (like straight roads, curves)
  //           initialOpenSides = 2;
  //         } else if (roadSideCount === 3) {
  //           // Three-way intersection
  //           initialOpenSides = 3;
  //         } else if (roadSideCount === 4) {
  //           // Four-way intersection
  //           initialOpenSides = 4;
  //         } else {
  //           // Fallback
  //           initialOpenSides = roadSideCount;
  //         }
  //
  //         // Create new feature for this road
  //         const featureId = uf.par.length;
  //
  //         console.log('ROAD FEATURE CREATED:', { tileName, roadNum: side.num, initialOpenSides, featureId })
  //
  //         uf.newFeature(tileId, initialOpenSides, false);
  //         featureMap.set(side.num, featureId);
  //         featureIds.push(featureId);
  //       }
  //     }
  //   }
  //
  //   return featureIds;
  // }, [uf]);

  const createCityFeatures = useCallback(
    (tileName: string, tileId: number): number[] => {
      const sides = getTileSides(tileName);
      const featureIds: number[] = [];
      const featureMap = new Map<number, number>(); // cityNum -> featureId

      for (let i = 0; i < sides.length; i++) {
        const side = sides[i];
        if (side && side.feature === 'city') {
          if (!featureMap.has(side.num)) {
            // Count how many sides this city connects to
            const sameCitySides = sides.filter(
              (s) => s && s.feature === 'city' && s.num === side.num
            );
            const citySideCount = sameCitySides.length;

            // Calculate initial open sides based on actual connections
            let initialOpenSides: number;
            if (citySideCount === 1) {
              // Single-ended city (like city_cap)
              initialOpenSides = 1;
            } else if (citySideCount === 2) {
              // Two-ended city (like triangle, connector)
              initialOpenSides = 2;
            } else if (citySideCount === 3) {
              // Three-ended city (like triple_city)
              initialOpenSides = 3;
            } else if (citySideCount === 4) {
              // Four-ended city (like quadruple_city_with_coa)
              initialOpenSides = 4;
            } else {
              // Fallback
              initialOpenSides = citySideCount;
            }

            // Create new feature for this city
            const featureId = uf.par.length;

            // Check if tile has coat of arms (ends with _with_coa)
            const withCoa = tileName.endsWith('_with_coa');

            console.log('CITY FEATURE CREATED:', {
              tileName,
              cityNum: side.num,
              initialOpenSides,
              featureId,
              withCoa,
            });

            uf.newFeature(tileId, initialOpenSides, withCoa);
            featureMap.set(side.num, featureId);
            featureIds.push(featureId);
          }
        }
      }

      return featureIds;
    },
    [uf]
  );

  // DISABLED: Road merging function - commented out for city testing
  // const mergeAdjacentRoads = useCallback((board: (BoardCell | null)[][], x: number, y: number, tileId: number) => {
  //   const cell = board[y][x];
  //   if (!cell) return;
  //
  //   const tileSides = rotateSides(getTileSides(cell.tileName), cell.rotation);
  //   console.log({ tileSides })
  //   const currentFeatures = tileRoadFeatures.get(tileId) || [];
  //
  //   for (let side = 0; side < 4; side++) {
  //     const currentSide = tileSides[side];
  //     if (!currentSide || currentSide.feature !== 'road') continue;
  //
  //     // Get adjacent position
  //     const adj = getAdjacentPosition(x, y, side);
  //     if (adj.x < 0 || adj.x >= BOARD_WIDTH || adj.y < 0 || adj.y >= BOARD_HEIGHT) continue;
  //
  //     const adjCell = board[adj.y][adj.x];
  //     if (!adjCell) continue;
  //
  //     // Check if adjacent tile has a road on the opposite side
  //     const adjSides = rotateSides(getTileSides(adjCell.tileName), adjCell.rotation);
  //     console.log({ adjSides })
  //     const oppositeSide = getOppositeSide(side);
  //     const adjSide = adjSides[oppositeSide];
  //
  //     if (adjSide && adjSide.feature === 'road') {
  //       // Find the feature IDs to merge
  //       const currentFeatureIndex = currentSide.num;
  //       const adjFeatures = tileRoadFeatures.get(adjCell.id) || [];
  //       const adjFeatureIndex = adjSide.num;
  //
  //       console.log("BEFORE IF")
  //       console.log(currentFeatureIndex, currentFeatures.length,  adjFeatureIndex , adjFeatures.length)
  //       if (currentFeatureIndex < currentFeatures.length && adjFeatureIndex < adjFeatures.length) {
  //         console.log("INSIDE IF")
  //         const currentFeatureId = currentFeatures[currentFeatureIndex];
  //         const adjFeatureId = adjFeatures[adjFeatureIndex];
  //
  //         // Log before merge
  //         console.log('ROAD MERGE - Before:', {
  //           currentTile: cell.tileName,
  //           currentFeatureId,
  //           currentFeatureIndex,
  //           currentOpenSides: uf.getOpenSides(currentFeatureId),
  //           adjTile: adjCell.tileName,
  //           adjFeatureId,
  //           adjFeatureIndex,
  //           adjOpenSides: uf.getOpenSides(adjFeatureId),
  //           currentRoadFeaturesCount: currentFeatures.length,
  //           adjRoadFeaturesCount: adjFeatures.length
  //         });
  //
  //         // Merge the features
  //         uf.unite(currentFeatureId, adjFeatureId);
  //
  //         // Log after merge
  //         const rootAfterMerge = uf.root(currentFeatureId);
  //         console.log('ROAD MERGE - After:', {
  //           rootFeatureId: rootAfterMerge,
  //           openSides: uf.getOpenSides(currentFeatureId),
  //           isCompleted: uf.isCompleted(currentFeatureId)
  //         });
  //       }
  //     }
  //   }
  // }, [uf, getAdjacentPosition, getOppositeSide]);

  const mergeAdjacentCities = useCallback(
    (board: (BoardCell | null)[][], x: number, y: number, tileId: number) => {
      const cell = board[y][x];
      if (!cell) return;

      const tileSides = rotateSides(getTileSides(cell.tileName), cell.rotation);

      console.log({ tileSides });

      const currentFeatures = tileCityFeatures.get(tileId) || [];

      for (let side = 0; side < 4; side++) {
        const currentSide = tileSides[side];
        if (!currentSide || currentSide.feature !== 'city') continue;

        // Get adjacent position
        const adj = getAdjacentPosition(x, y, side);
        if (
          adj.x < 0 ||
          adj.x >= BOARD_WIDTH ||
          adj.y < 0 ||
          adj.y >= BOARD_HEIGHT
        )
          continue;

        const adjCell = board[adj.y][adj.x];
        if (!adjCell) continue;

        // Check if adjacent tile has a city on the opposite side
        const adjSides = rotateSides(
          getTileSides(adjCell.tileName),
          adjCell.rotation
        );

        console.log({ adjSides });

        const oppositeSide = getOppositeSide(side);
        const adjSide = adjSides[oppositeSide];

        if (adjSide && adjSide.feature === 'city') {
          // Find the feature IDs to merge
          const currentFeatureIndex = currentSide.num;
          const adjFeatures = tileCityFeatures.get(adjCell.id) || [];
          const adjFeatureIndex = adjSide.num;

          if (
            currentFeatureIndex < currentFeatures.length &&
            adjFeatureIndex < adjFeatures.length
          ) {
            const currentFeatureId = currentFeatures[currentFeatureIndex];
            const adjFeatureId = adjFeatures[adjFeatureIndex];

            // Log before merge
            console.log('CITY MERGE - Before:', {
              currentTile: cell.tileName,
              currentFeatureId,
              currentFeatureIndex,
              currentOpenSides: uf.getOpenSides(currentFeatureId),
              adjTile: adjCell.tileName,
              adjFeatureId,
              adjFeatureIndex,
              adjOpenSides: uf.getOpenSides(adjFeatureId),
              currentCityFeaturesCount: currentFeatures.length,
              adjCityFeaturesCount: adjFeatures.length,
            });

            // Merge the features
            uf.unite(currentFeatureId, adjFeatureId);

            // Log after merge
            const rootAfterMerge = uf.root(currentFeatureId);
            console.log('CITY MERGE - After:', {
              rootFeatureId: rootAfterMerge,
              openSides: uf.getOpenSides(currentFeatureId),
              isCompleted: uf.isCompleted(currentFeatureId),
            });
          }
        }
      }
    },
    [uf, getAdjacentPosition, getOppositeSide]
  );

  // DISABLED: Road completion function - commented out for city testing
  // const checkRoadCompletions = useCallback((board: (BoardCell | null)[][]): number[] => {
  //   const completedRoads: number[] = [];
  //   const checkedFeatures = new Set<number>();
  //
  //   // Check all tiles for completed roads
  //   for (let y = 0; y < BOARD_HEIGHT; y++) {
  //     for (let x = 0; x < BOARD_WIDTH; x++) {
  //       const cell = board[y][x];
  //       if (!cell) continue;
  //
  //       const features = tileRoadFeatures.get(cell.id) || [];
  //       for (const featureId of features) {
  //         const rootId = uf.root(featureId);
  //         if (!checkedFeatures.has(rootId)) {
  //           const isCompleted = uf.isCompleted(featureId);
  //
  //           if (isCompleted) {
  //             console.log('road completed')
  //             completedRoads.push(rootId);
  //             checkedFeatures.add(rootId);
  //           }
  //         }
  //       }
  //     }
  //   }
  //
  //   return completedRoads;
  // }, [uf]);

  const checkCityCompletions = useCallback(
    (board: (BoardCell | null)[][]): number[] => {
      const completedCities: number[] = [];
      const checkedFeatures = new Set<number>();

      // Check all tiles for completed cities
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          const cell = board[y][x];
          if (!cell) continue;

          const features = tileCityFeatures.get(cell.id) || [];
          for (const featureId of features) {
            const rootId = uf.root(featureId);
            if (!checkedFeatures.has(rootId)) {
              const isCompleted = uf.isCompleted(featureId);

              if (isCompleted) {
                console.log('city completed');
                completedCities.push(rootId);
                checkedFeatures.add(rootId);
              }
            }
          }
        }
      }

      return completedCities;
    },
    [uf]
  );

  // DISABLED: Road tile removal function - commented out for city testing
  // const removeCompletedRoadTiles = useCallback((board: (BoardCell | null)[][], completedRoads: number[]): (BoardCell | null)[][] => {
  //   if (completedRoads.length === 0) return board;
  //
  //   const newBoard = board.map(row => [...row]);
  //   const tilesToRemove = new Set<number>();
  //
  //   // Collect all tiles that belong to completed roads
  //   for (const roadId of completedRoads) {
  //     const tileIds = uf.getTileIds(roadId);
  //     tileIds.forEach(tileId => tilesToRemove.add(tileId));
  //   }
  //
  //   // Remove tiles from board
  //   for (let y = 0; y < BOARD_HEIGHT; y++) {
  //     for (let x = 0; x < BOARD_WIDTH; x++) {
  //       const cell = newBoard[y][x];
  //       if (cell && tilesToRemove.has(cell.id)) {
  //         newBoard[y][x] = null;
  //         // Clean up feature mapping
  //         tileRoadFeatures.delete(cell.id);
  //         tileCityFeatures.delete(cell.id);
  //       }
  //     }
  //   }
  //
  //   return newBoard;
  // }, [uf]);

  const removeCompletedCityTiles = useCallback(
    (
      board: (BoardCell | null)[][],
      completedCities: number[]
    ): (BoardCell | null)[][] => {
      if (completedCities.length === 0) return board;

      const newBoard = board.map((row) => [...row]);
      const tilesToRemove = new Set<number>();

      // Collect all tiles that belong to completed cities
      for (const cityId of completedCities) {
        const tileIds = uf.getTileIds(cityId);
        tileIds.forEach((tileId) => tilesToRemove.add(tileId));
      }

      // Remove tiles from board
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          const cell = newBoard[y][x];
          if (cell && tilesToRemove.has(cell.id)) {
            newBoard[y][x] = null;
            // Clean up feature mapping
            tileRoadFeatures.delete(cell.id);
            tileCityFeatures.delete(cell.id);
          }
        }
      }

      return newBoard;
    },
    [uf]
  );

  const createNewPiece = useCallback((): GamePiece => {
    // Use weighted random selection based on tile probabilities
    const randomTile = selectWeightedRandomTile();

    return {
      shape: [[randomTile]], // Single tile in a 1x1 grid
      position: { x: Math.floor(BOARD_WIDTH / 2), y: 0 },
      tileName: randomTile,
      rotation: 0, // Start with no rotation
    };
  }, []);

  const checkTileSideConflicts = useCallback(
    (piece: GamePiece, position: Position): boolean => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const boardX = position.x + x;
            const boardY = position.y + y;

            // Skip if out of bounds
            if (
              boardX < 0 ||
              boardX >= BOARD_WIDTH ||
              boardY < 0 ||
              boardY >= BOARD_HEIGHT
            ) {
              continue;
            }

            // Get the sides of the current tile with rotation
            const tileSides = rotateSides(
              getTileSides(piece.shape[y][x]),
              piece.rotation
            );

            // Check each side for conflicts with adjacent tiles
            for (let side = 0; side < 4; side++) {
              const currentSide = tileSides[side];
              const adj = getAdjacentPosition(boardX, boardY, side);

              // Skip if adjacent position is out of bounds
              if (
                adj.x < 0 ||
                adj.x >= BOARD_WIDTH ||
                adj.y < 0 ||
                adj.y >= BOARD_HEIGHT
              ) {
                continue;
              }

              const adjCell = board[adj.y][adj.x];
              if (adjCell) {
                // Get the adjacent tile's sides
                const adjSides = rotateSides(
                  getTileSides(adjCell.tileName),
                  adjCell.rotation
                );
                const oppositeSide = getOppositeSide(side);
                const adjSide = adjSides[oppositeSide];

                // Check for conflicts:
                // 1. If current side has a feature but adjacent doesn't (or vice versa)
                // 2. If both have features but they're different types
                if ((currentSide && !adjSide) || (!currentSide && adjSide)) {
                  return true; // Conflict: one has feature, other doesn't
                }

                if (
                  currentSide &&
                  adjSide &&
                  currentSide.feature !== adjSide.feature
                ) {
                  return true; // Conflict: different feature types (road vs city)
                }
              }
            }
          }
        }
      }
      return false; // No conflicts found
    },
    [board, getAdjacentPosition, getOppositeSide]
  );

  const isValidPosition = useCallback(
    (piece: GamePiece, newPosition: Position): boolean => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = newPosition.x + x;
            const newY = newPosition.y + y;

            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
              return false;
            }

            if (newY >= 0 && board[newY][newX]) {
              return false;
            }
          }
        }
      }

      return true;
    },
    [board]
  );

  const canPlaceTile = useCallback(
    (piece: GamePiece, position: Position): boolean => {
      // First check if position is valid (no overlaps, within bounds)
      if (!isValidPosition(piece, position)) {
        return false;
      }

      // Then check for side conflicts
      if (checkTileSideConflicts(piece, position)) {
        return false;
      }

      return true;
    },
    [isValidPosition, checkTileSideConflicts]
  );

  const applyGravity = useCallback((boardState: (BoardCell | null)[][]) => {
    const newBoard = boardState.map((row) => [...row]);

    // Process each column from bottom to top
    for (let x = 0; x < BOARD_WIDTH; x++) {
      // Collect all non-null tiles in this column
      const tiles: BoardCell[] = [];
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (newBoard[y][x]) {
          tiles.push(newBoard[y][x]!);
          newBoard[y][x] = null; // Clear the position
        }
      }

      // Place tiles back from bottom up
      for (let i = 0; i < tiles.length; i++) {
        newBoard[BOARD_HEIGHT - 1 - i][x] = tiles[i];
      }
    }

    return newBoard;
  }, []);

  const startBlinkingEffect = useCallback((tilesToBlink: Set<number>) => {
    setBlinkingTiles(tilesToBlink);

    // Clear blinking after animation completes
    setTimeout(() => {
      setBlinkingTiles(new Set());
    }, 1500); // 1.5 seconds for the simple fade animation
  }, []);

  const placePiece = useCallback(
    (piece: GamePiece) => {
      const newBoard = board.map((row) => [...row]);
      const currentId = nextTileId;

      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const boardY = piece.position.y + y;
            const boardX = piece.position.x + x;
            if (boardY >= 0) {
              newBoard[boardY][boardX] = {
                tileName: piece.shape[y][x],
                rotation: piece.rotation,
                id: currentId,
              };

              // Create road and city features for this tile based on its definition
              const tileName = piece.shape[y][x];
              const tileSides = getTileSides(tileName);

              // Check if this tile has any cities
              // const hasRoads = tileSides.some(side => side && side.feature === 'road'); // DISABLED for testing
              const hasCities = tileSides.some(
                (side) => side && side.feature === 'city'
              );

              // DISABLED: Road feature creation and merging - commented out for city testing
              // if (hasRoads) {
              //   const featureIds = createRoadFeatures(tileName, currentId);
              //   tileRoadFeatures.set(currentId, featureIds);
  //
              //   // Merge with adjacent roads
              //   mergeAdjacentRoads(newBoard, boardX, boardY, currentId);
              // }

              if (hasCities) {
                const cityFeatureIds = createCityFeatures(tileName, currentId);
                tileCityFeatures.set(currentId, cityFeatureIds);

                // Merge with adjacent cities
                mergeAdjacentCities(newBoard, boardX, boardY, currentId);
              }
            }
          }
        }
      }

      // Increment tile ID for next tile
      setNextTileId((prev) => prev + 1);

      // Check for completed cities only (roads disabled for testing)
      // const completedRoads = checkRoadCompletions(newBoard);
      const completedCities = checkCityCompletions(newBoard);

      // Collect all tiles that will be removed for blinking effect
      const allTilesToBlink = new Set<number>();
      // for (const roadId of completedRoads) {
      //   const tileIds = uf.getTileIds(roadId);
      //   tileIds.forEach(tileId => allTilesToBlink.add(tileId));
      // }
      for (const cityId of completedCities) {
        const tileIds = uf.getTileIds(cityId);
        tileIds.forEach((tileId) => allTilesToBlink.add(tileId));
      }

      // If there are tiles to remove, start blinking effect and delay removal
      if (allTilesToBlink.size > 0) {
        startBlinkingEffect(allTilesToBlink);

        // Set the board with the new tile first
        setBoard(newBoard);

        // Delay the removal and processing until after animation completes
        setTimeout(() => {
          // Skip road completion logic entirely
          let boardAfterRoads = newBoard;
          let roadCompletions = 0;

          // Check for completed cities directly on the initial board
          const completedCitiesAfter = checkCityCompletions(boardAfterRoads);
          let boardAfterCities = boardAfterRoads;

          if (completedCitiesAfter.length > 0) {
            boardAfterCities = removeCompletedCityTiles(
              boardAfterRoads,
              completedCitiesAfter
            );

            // Apply gravity after city removals
            boardAfterCities = applyGravity(boardAfterCities);
          }

          // Check for monastery completions on the board after city removals and gravity
          let boardAfterMonasteries = [
            ...boardAfterCities.map((row) => [...row]),
          ];
          let monasteryCompletions = 0;

          // Check each cell for monasteries
          for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
              const cell = boardAfterCities[y][x];

              // Check if this cell contains a monastery
              if (
                cell &&
                (cell.tileName === 'monastery' ||
                  cell.tileName === 'monastery_with_road')
              ) {
                // Check if all 8 surrounding cells are filled
                let isSurrounded = true;

                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    if (dy === 0 && dx === 0) continue; // Skip the monastery itself

                    const checkY = y + dy;
                    const checkX = x + dx;

                    // Check bounds and if cell is filled
                    if (
                      checkY < 0 ||
                      checkY >= BOARD_HEIGHT ||
                      checkX < 0 ||
                      checkX >= BOARD_WIDTH ||
                      !boardAfterCities[checkY][checkX]
                    ) {
                      isSurrounded = false;
                      break;
                    }
                  }
                  if (!isSurrounded) break;
                }

                // If monastery is surrounded, mark all 9 tiles for removal
                if (isSurrounded) {
                  monasteryCompletions++;

                  for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                      const removeY = y + dy;
                      const removeX = x + dx;

                      if (
                        removeY >= 0 &&
                        removeY < BOARD_HEIGHT &&
                        removeX >= 0 &&
                        removeX < BOARD_WIDTH
                      ) {
                        boardAfterMonasteries[removeY][removeX] = null;
                      }
                    }
                  }
                }
              }
            }
          }

          // Apply gravity after monastery removals
          let boardAfterGravity = boardAfterMonasteries;
          if (monasteryCompletions > 0) {
            boardAfterGravity = applyGravity(boardAfterMonasteries);
          }

          setBoard(boardAfterGravity);

          // Award points using actual Carcassonne scoring
          if (roadCompletions > 0) {
            setScore((prev) => prev + roadCompletions * 300);
          }

          // City scoring: 2 * size of the union find for each completed city
          if (completedCitiesAfter.length > 0) {
            let cityPoints = 0;
            for (const cityId of completedCitiesAfter) {
              const citySize = uf.size(cityId);
              cityPoints += citySize * 2;
            }
            setScore((prev) => prev + cityPoints);
          }

          // Monastery scoring: 9 points per completed monastery (actual Carcassonne rule)
          if (monasteryCompletions > 0) {
            setScore((prev) => prev + monasteryCompletions * 9);
          }
        }, 1500); // Wait for simple fade animation to complete

        return; // Exit early to prevent immediate processing
      }

      // If no tiles to remove, process normally
      setBoard(newBoard);
    },
    [
      board,
      applyGravity,
      nextTileId,
      createCityFeatures,
      mergeAdjacentCities,
      checkCityCompletions,
      removeCompletedCityTiles,
      startBlinkingEffect,
      uf,
    ]
  );

  const movePiece = useCallback(
    (direction: 'left' | 'right' | 'rotate' | 'down') => {
      if (!currentPiece || gameOver) return;

      let newPosition = { ...currentPiece.position };
      let newRotation = currentPiece.rotation;

      switch (direction) {
        case 'left':
          newPosition.x -= 1;
          break;
        case 'right':
          newPosition.x += 1;
          break;
        case 'down':
          newPosition.y += 1;
          break;
        case 'rotate':
          newRotation = (currentPiece.rotation + 90) % 360;
          break;
      }

      const newPiece = {
        ...currentPiece,
        position: newPosition,
        rotation: newRotation,
      };

      // For user input, only allow valid moves without triggering placement
      if (isValidPosition(newPiece, newPosition)) {
        setCurrentPiece(newPiece);
      }
      // For user input, never trigger placement - that's handled by dropPiece only
    },
    [currentPiece, gameOver, isValidPosition]
  );

  const dropPiece = useCallback(async () => {
    if (!currentPiece || gameOver) return;

    // Force the piece to move down, regardless of user input
    const newPosition = {
      ...currentPiece.position,
      y: currentPiece.position.y + 1,
    };
    const newPiece = { ...currentPiece, position: newPosition };

    if (isValidPosition(newPiece, newPosition)) {
      setCurrentPiece(newPiece);
    } else {
      // Piece can't move down, try to place it
      // But first check if placement would create conflicts
      if (!canPlaceTile(currentPiece, currentPiece.position)) {
        // Cannot place due to conflicts - game over
        setGameOver(true);
        // Update total games count when game ends
        if (user) {
          await updateUserTotalGames(user.uid);
          // Refresh user profile to show updated total games
          const updatedProfile = await getUserProfile(user.uid);
          setUserProfile(updatedProfile);
        }
        return;
      }

      placePiece(currentPiece);

      const nextPiece = createNewPiece();

      if (isValidPosition(nextPiece, nextPiece.position)) {
        setCurrentPiece(nextPiece);
      } else {
        setGameOver(true);
        // Update total games count when game ends
        if (user) {
          await updateUserTotalGames(user.uid);
          // Refresh user profile to show updated total games
          const updatedProfile = await getUserProfile(user.uid);
          setUserProfile(updatedProfile);
        }
      }
    }
  }, [
    currentPiece,
    gameOver,
    isValidPosition,
    canPlaceTile,
    placePiece,
    createNewPiece,
    user,
  ]);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('carcassonne-tetris-best', score.toString());
    }
  }, [score, bestScore]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't handle game controls if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          movePiece('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          movePiece('right');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          movePiece('down');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          event.preventDefault();
          movePiece('rotate');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece]);

  useEffect(() => {
    if (!gameOver) {
      const interval = setInterval(dropPiece, 1000); // Constant 1 second interval
      return () => clearInterval(interval);
    }
  }, [dropPiece, gameOver]);

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(createNewPiece());
    }
  }, [currentPiece, gameOver, createNewPiece]);

  const handleTouchControl = useCallback(
    (direction: 'left' | 'right' | 'rotate' | 'down') => {
      movePiece(direction);
    },
    [movePiece]
  );

  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row]);

    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH
            ) {
              displayBoard[boardY][boardX] = {
                tileName: currentPiece.shape[y][x],
                rotation: currentPiece.rotation,
                id: -1, // Temporary ID for display purposes
              };
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="board-row">
        {row.map((cell, x) => (
          <div key={x} className="board-cell">
            {cell ? (
              <img
                src={`/images/${cell.tileName}.png`}
                alt={cell.tileName}
                className={`tile-image ${blinkingTiles.has(cell.id) ? 'blinking' : ''}`}
                style={{ transform: `rotate(${cell.rotation}deg)` }}
              />
            ) : null}
          </div>
        ))}
      </div>
    ));
  };

  // Ranking functions
  const fetchGlobalRankings = useCallback(async () => {
    const rankings = await getGlobalRankings();
    setGlobalRankings(rankings);
  }, []);

  const handleSubmitScore = useCallback(async () => {
    if (!user) {
      alert('Please wait for authentication to complete.');
      return;
    }

    if (!username.trim()) {
      setShowUsernameInput(true);
      return;
    }

    if (score <= 0) {
      alert('Cannot submit a score of 0!');
      return;
    }

    // Check if this is a personal best
    const isNewPersonalBest = await isPersonalBest(user.uid, score);
    if (!isNewPersonalBest) {
      alert('You can only submit scores that are your personal best!');
      return;
    }

    setIsSubmittingScore(true);
    try {
      await createOrUpdateUserProfile(user.uid, username.trim(), score);
      saveUsername(username.trim());
      
      // Refresh user profile and rankings
      const updatedProfile = await getUserProfile(user.uid);
      setUserProfile(updatedProfile);
      await fetchGlobalRankings();
      
      // Mark score as submitted for this game
      setScoreSubmitted(true);
      
      alert('Score submitted successfully!');
    } catch (error) {
      alert('Failed to submit score. Please try again.');
    } finally {
      setIsSubmittingScore(false);
    }
  }, [score, username, user, fetchGlobalRankings]);

  const handleUsernameSubmit = useCallback(async () => {
    if (username.trim()) {
      saveUsername(username.trim());
      setShowUsernameInput(false);
      await handleSubmitScore();
    }
  }, [username, handleSubmitScore]);

  // Load rankings on component mount
  useEffect(() => {
    fetchGlobalRankings();
  }, [fetchGlobalRankings]);

  const resetGame = () => {
    setBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null))
    );
    setCurrentPiece(null);
    setScore(0);
    setGameOver(false);
    setNextTileId(1);
    setBlinkingTiles(new Set());
    setShowUsernameInput(false);
    setScoreSubmitted(false); // Reset score submission status for new game
    // Reset the UnionFind and tile features
    uf.reset();
    tileRoadFeatures.clear();
    tileCityFeatures.clear();
  };

  return (
    <div className="App">
      {authLoading ? (
        <div className="loading">
          <h2>Carcassonne Tetris</h2>
          <div>Initializing...</div>
        </div>
      ) : (
        <>
          <h2>Carcassonne Tetris</h2>
          <div className="score-header">
            <div className="score-left">Score: {score}</div>
            <div className="score-right">
              Best: {userProfile ? userProfile.bestScore : bestScore}
            </div>
          </div>
          <div className="header-controls">
          </div>
      <div className="game-container">
        <div className="game-board-container">
          <div className="game-board">{renderBoard()}</div>
          {gameOver && (
            <div className="game-over">
              <div className="game-over-title">Game Over!</div>
              <div className="game-over-score">Final Score: {score}</div>
              <div className="game-over-buttons">
                <button onClick={resetGame}>New Game</button>
                {score > 0 && !authLoading && !scoreSubmitted && score > (userProfile ? userProfile.bestScore : bestScore) && (
                  <button 
                    onClick={handleSubmitScore} 
                    disabled={isSubmittingScore}
                  >
                    {isSubmittingScore ? 'Submitting...' : 'Submit Score'}
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Username Input Dialog */}
          {showUsernameInput && (
            <div className="username-input">
              <h3>Enter Your Username</h3>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && handleUsernameSubmit()}
              />
              <div>
                <button onClick={handleUsernameSubmit} disabled={!username.trim()}>
                  Submit Score
                </button>
                <button onClick={() => setShowUsernameInput(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Leaderboard positioned for desktop layout */}
        <div className="rankings desktop-rankings">
          <h3>Leaderboard</h3>
          <div className="rankings-list">
            {globalRankings.length > 0 ? (
              globalRankings.map((entry, index) => (
                <div key={entry.id || index} className="ranking-entry">
                  <span className="rank">#{index + 1}</span>
                  <span className="username">{entry.username}</span>
                  <span className="score">{entry.score}</span>
                </div>
              ))
            ) : (
              <div className="no-scores">No scores yet! Be the first to submit a score.</div>
            )}
          </div>
        </div>
        
        {/* Control buttons moved below game board */}
        <div className="controls">
          <div>← / A: Move Left</div>
          <div>→ / D: Move Right</div>
          <div>↓ / S: Move Down</div>
          <div>↑ / W / Space: Rotate</div>
        </div>
        <div className="mobile-controls">
          <div className="control-row">
            <button
              className="control-button rotate"
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchControl('rotate');
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleTouchControl('rotate');
              }}
            >
              ↻
            </button>
          </div>
          <div className="control-row">
            <button
              className="control-button"
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchControl('left');
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleTouchControl('left');
              }}
            >
              ←
            </button>
            <button
              className="control-button"
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchControl('down');
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleTouchControl('down');
              }}
            >
              ↓
            </button>
            <button
              className="control-button"
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchControl('right');
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleTouchControl('right');
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Rankings Display - shown only on mobile */}
      <div className="rankings mobile-rankings">
        <h3>Leaderboard</h3>
        <div className="rankings-list">
          {globalRankings.length > 0 ? (
            globalRankings.map((entry, index) => (
              <div key={entry.id || index} className="ranking-entry">
                <span className="rank">#{index + 1}</span>
                <span className="username">{entry.username}</span>
                <span className="score">{entry.score}</span>
              </div>
            ))
          ) : (
            <div className="no-scores">No scores yet! Be the first to submit a score.</div>
          )}
        </div>
      </div>
      
      {/* User Identification ID at bottom */}
      {!authLoading && user && (
        <div className="user-id-display">
          Identification ID: {user.uid.substring(0, 12)}
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default App;
