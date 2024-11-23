import { db } from '../config/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

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