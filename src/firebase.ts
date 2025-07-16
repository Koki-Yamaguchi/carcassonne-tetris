import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyCppYqLoCw7qfkjlfQP70vM0m8-Pn1PDmo",
  authDomain: "carcassonne-tetris.firebaseapp.com",
  projectId: "carcassonne-tetris",
  storageBucket: "carcassonne-tetris.firebasestorage.app",
  messagingSenderId: "332216245656",
  appId: "1:332216245656:web:f0b764837159b8fb9d1fed",
  measurementId: "G-G8MG38MQHT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth and export
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
