import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage';

// The configuration object for your Firebase project.
const firebaseConfig = {
  apiKey: "AIzaSyCpi0lyH3Ltzv14_Kj2ZrUoaPe7oEYu964",
  authDomain: "realife-cafe.firebaseapp.com",
  databaseURL: "https://realife-cafe-default-rtdb.firebaseio.com",
  projectId: "realife-cafe",
  storageBucket: "realife-cafe.firebasestorage.app",
  messagingSenderId: "761704661627",
  appId: "1:761704661627:web:2e7098e9b856da676018de",
  measurementId: "G-7C47EN8D36"
};


/**
 * A flag to check if the Firebase config has been filled out.
 * The app will show a warning if this is false.
 */
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "";

let database: firebase.database.Database | undefined;
let auth: firebase.auth.Auth | undefined;
let storage: firebase.storage.Storage | undefined;

if (isFirebaseConfigured) {
  try {
    // Initialize the app if it hasn't been already
    const app = firebase.apps.length
      ? firebase.app()
      : firebase.initializeApp(firebaseConfig);
    
    // Get a reference to the Realtime Database service
    database = app.database();
    auth = app.auth();
    storage = app.storage();
  } catch (error) {
    console.error("Firebase initialization error. Please check your firebaseConfig object in firebase/config.ts.", error);
  }
} else {
    console.warn("Firebase is not configured. Please update firebase/config.ts to enable real-time features.");
}

export { database, auth, storage };
