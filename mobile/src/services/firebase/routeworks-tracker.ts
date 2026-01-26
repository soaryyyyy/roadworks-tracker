import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getRemoteConfig } from 'firebase/remote-config'

const firebaseConfig = {
  apiKey: 'AIzaSyDehq2R623KKuuEpxX0Ubt-IokwP2hqINY',
  authDomain: 'roadworks-tracker.firebaseapp.com',
  projectId: 'roadworks-tracker',
  storageBucket: 'roadworks-tracker.firebasestorage.app',
  messagingSenderId: '915681241557',
  appId: '1:915681241557:web:27c4ef16db61b9be4ff55c'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const remoteConfig = getRemoteConfig(app);

remoteConfig.settings = {
  minimumFetchIntervalMillis: 3_600_000,
  fetchTimeoutMillis: 60_000,
};

// Default value to use if we cannot reach the remote one
remoteConfig.defaultConfig = {
  session_duration_millis: 3_600_000
};

export { auth, firestore, remoteConfig }