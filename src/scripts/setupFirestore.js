import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCvJxe5ZGS_Pq3qFmA_2BgymPRKDLi2JA8",
  authDomain: "boltpolebooking.firebaseapp.com",
  projectId: "boltpolebooking",
  storageBucket: "boltpolebooking.firebasestorage.app",
  messagingSenderId: "387821087826",
  appId: "1:387821087826:web:76bce40768bc9ac2d9838b",
  measurementId: "G-JQVGXD9EWN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupFirestore() {
  try {
    // Création d'une école exemple
    await setDoc(doc(db, 'schools', 'school1'), {
      name: 'Studio Pole Dance Paris',
      address: '123 rue de Paris, 75001 Paris',
      teacherIds: [],
    });

    console.log('✅ Configuration Firestore terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  }
}

setupFirestore();