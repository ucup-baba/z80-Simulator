// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB5UOhfAv6Jw61ZWdj1HZ3euluYOEGhHjY",
  authDomain: "z80-simulation.firebaseapp.com",
  projectId: "z80-simulation",
  storageBucket: "z80-simulation.firebasestorage.app",
  messagingSenderId: "531493446677",
  appId: "1:531493446677:web:b36d99be759bb22e619a1c",
  measurementId: "G-02SKBGNVE4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
