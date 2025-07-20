#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function fetchGamesWithUsernames() {
  try {
    console.log('Fetching games and user data...\n');

    // Fetch all games
    const gamesSnapshot = await db.collection('games').get();
    
    if (gamesSnapshot.empty) {
      console.log('No games found.');
      return;
    }

    // Fetch all users to create a lookup map
    const usersSnapshot = await db.collection('users').get();
    const userMap = new Map();
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const username = userData.username && userData.username.trim() 
        ? userData.username 
        : `username-${doc.id}`;
      userMap.set(doc.id, username);
    });

    console.log(`Found ${gamesSnapshot.size} games and ${usersSnapshot.size} users\n`);
    console.log('='.repeat(90));
    console.log('USERNAME'.padEnd(20) + 'START TIME'.padEnd(25) + 'END TIME'.padEnd(25) + 'SCORE'.padEnd(8) + 'DURATION');
    console.log('='.repeat(90));

    const games = [];
    
    // Process each game
    gamesSnapshot.forEach(doc => {
      const gameData = doc.data();
      const username = userMap.get(gameData.userId) || `username-${gameData.userId}`;
      
      let startAt = 'N/A';
      let endAt = 'N/A';
      let duration = 'N/A';
      
      // Format start time
      if (gameData.startAt) {
        startAt = gameData.startAt.toDate().toLocaleString();
      }
      
      // Format end time and calculate duration
      if (gameData.endAt) {
        endAt = gameData.endAt.toDate().toLocaleString();
        
        // Calculate duration in seconds
        if (gameData.startAt && gameData.endAt) {
          const durationMs = gameData.endAt.toDate().getTime() - gameData.startAt.toDate().getTime();
          duration = Math.round(durationMs / 1000) + 's';
        }
      }
      
      games.push({
        username,
        startAt,
        endAt,
        finalScore: gameData.finalScore !== null && gameData.finalScore !== undefined ? gameData.finalScore : 'N/A',
        duration,
        startTimestamp: gameData.startAt ? gameData.startAt.toDate() : new Date(0)
      });
    });

    // Sort games by start time (newest first)
    games.sort((a, b) => b.startTimestamp.getTime() - a.startTimestamp.getTime());

    // Print each game
    games.forEach(game => {
      const usernameCol = game.username.length > 18 ? game.username.substring(0, 17) + '…' : game.username;
      const startCol = game.startAt.length > 23 ? game.startAt.substring(0, 22) + '…' : game.startAt;
      const endCol = game.endAt.length > 23 ? game.endAt.substring(0, 22) + '…' : game.endAt;
      
      console.log(
        usernameCol.padEnd(20) +
        startCol.padEnd(25) +
        endCol.padEnd(25) +
        String(game.finalScore).padEnd(8) +
        game.duration
      );
    });

    console.log('='.repeat(90));
    
    // Calculate per-user statistics
    const userStats = new Map();
    
    games.forEach(game => {
      const username = game.username;
      if (!userStats.has(username)) {
        userStats.set(username, {
          gameCount: 0,
          totalPlayTime: 0, // in seconds
          completedGames: 0
        });
      }
      
      const stats = userStats.get(username);
      stats.gameCount++;
      
      // Add play time if the game was completed
      if (game.finalScore !== 'N/A' && game.duration !== 'N/A') {
        const durationSeconds = parseInt(game.duration.replace('s', ''));
        if (!isNaN(durationSeconds)) {
          stats.totalPlayTime += durationSeconds;
          stats.completedGames++;
        }
      }
    });
    
    // Print per-user statistics
    console.log('\nPER-USER STATISTICS:');
    console.log('='.repeat(90));
    console.log('USERNAME'.padEnd(20) + 'GAMES PLAYED'.padEnd(15) + 'COMPLETED'.padEnd(12) + 'TOTAL PLAY TIME');
    console.log('='.repeat(90));
    
    // Sort users by total games played (descending)
    const sortedUserStats = Array.from(userStats.entries())
      .sort((a, b) => b[1].gameCount - a[1].gameCount);
    
    sortedUserStats.forEach(([username, stats]) => {
      const usernameCol = username.length > 18 ? username.substring(0, 17) + '…' : username;
      const totalPlayTimeFormatted = stats.totalPlayTime > 0 ? `${stats.totalPlayTime}s` : 'N/A';
      
      console.log(
        usernameCol.padEnd(20) +
        String(stats.gameCount).padEnd(15) +
        String(stats.completedGames).padEnd(12) +
        totalPlayTimeFormatted
      );
    });
    
    console.log('='.repeat(90));
    
    // Print summary statistics
    const completedGames = games.filter(g => g.finalScore !== 'N/A');
    const totalGames = games.length;
    const completedCount = completedGames.length;
    const abandonedCount = totalGames - completedCount;
    
    console.log(`\nSUMMARY:`);
    console.log(`Total games: ${totalGames}`);
    console.log(`Completed games: ${completedCount}`);
    console.log(`Abandoned games: ${abandonedCount}`);
    
    if (completedGames.length > 0) {
      const scores = completedGames
        .map(g => typeof g.finalScore === 'number' ? g.finalScore : parseInt(g.finalScore))
        .filter(s => !isNaN(s));
        
      if (scores.length > 0) {
        const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        
        console.log(`Average score: ${avgScore}`);
        console.log(`Highest score: ${maxScore}`);
        console.log(`Lowest score: ${minScore}`);
      }
    }

  } catch (error) {
    console.error('Error fetching games:', error);
  } finally {
    // Close the admin app
    await admin.app().delete();
  }
}

// Run the script
fetchGamesWithUsernames()
  .then(() => {
    console.log('\nScript completed successfully.');
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
