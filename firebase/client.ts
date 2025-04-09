import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCKnmrMTr07Xilp-Vqcte3b6pSZQ7IiEAs",
  authDomain: "intervu-fe8b2.firebaseapp.com",
  projectId: "intervu-fe8b2",
  storageBucket: "intervu-fe8b2.firebasestorage.app",
  messagingSenderId: "96672433883",
  appId: "1:96672433883:web:c0ead1bf27a803cff7aefe",
  measurementId: "G-NSY6991TDC",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
