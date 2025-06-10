import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';   

const firebaseConfig = {
  apiKey: "AIzaSyCLEDQHNae8Y_Efo89g5rYFLr_0Ot6BDoE",
  authDomain: "wefarm-web.firebaseapp.com",
  projectId: "wefarm-web",
  storageBucket: "wefarm-web.firebasestorage.app",
  messagingSenderId: "294962523309",
  appId: "1:294962523309:web:3457c0c40fbeda5de32a24",
  measurementId: "G-T9843V8RTL"
};

const app = initializeApp(firebaseConfig);

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, analytics, storage };