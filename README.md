# Carcassonne Tetris

A unique twist on classic Tetris using Carcassonne game tiles! This is a React TypeScript application that combines the falling block mechanics of Tetris with the tile-based gameplay of Carcassonne.

## Features

- Classic Tetris gameplay with 7 different piece types
- Responsive design that works on desktop and mobile
- Modern UI with glassmorphism effects
- Score and level progression system
- Keyboard controls (arrow keys)

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd carcassonne-tetris
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Controls

- **← →** Move piece left/right
- **↓** Drop piece faster
- **↑** Rotate piece

## Building for Production

To create a production build:

```bash
npm run build
```

The build folder will contain the optimized production files.

## Firebase Deployment

When you're ready to deploy to Firebase Hosting:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase: `firebase init hosting`
4. Build the project: `npm run build`
5. Deploy: `firebase deploy`

## Future Enhancements

- Replace standard Tetris pieces with actual Carcassonne tiles
- Implement Carcassonne scoring rules (monasteries, cities, roads)
- Add special effects for completed features
- Multiplayer support

## Tech Stack

- React 18
- TypeScript
- CSS3 with modern effects
- Firebase Hosting (for deployment)

## License

This project is open source and available under the [MIT License](LICENSE).
