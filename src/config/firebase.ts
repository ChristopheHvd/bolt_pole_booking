import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCvJxe5ZGS_Pq3qFmA_2BgymPRKDLi2JA8",
  authDomain: "boltpolebooking.firebaseapp.com",
  projectId: "boltpolebooking",
  storageBucket: "boltpolebooking.firebasestorage.app",
  messagingSenderId: "387821087826",
  appId: "1:387821087826:web:76bce40768bc9ac2d9838b",
  measurementId: "G-JQVGXD9EWN"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);