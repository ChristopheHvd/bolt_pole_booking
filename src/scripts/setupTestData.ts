import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCvJxe5ZGS_Pq3qFmA_2BgymPRKDLi2JA8",
  authDomain: "boltpolebooking.firebaseapp.com",
  projectId: "boltpolebooking",
  storageBucket: "boltpolebooking.firebasestorage.app",
  messagingSenderId: "387821087826",
  appId: "1:387821087826:web:76bce40768bc9ac2d9838b",
  measurementId: "G-JQVGXD9EWN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const fakeUsers = [
  { name: 'Sophie Martin', email: 'sophie.martin@example.com' },
  { name: 'Emma Bernard', email: 'emma.bernard@example.com' },
  { name: 'Julie Dubois', email: 'julie.dubois@example.com' },
  { name: 'Laura Petit', email: 'laura.petit@example.com' },
  { name: 'Marie Roux', email: 'marie.roux@example.com' },
  { name: 'Léa Thomas', email: 'lea.thomas@example.com' },
  { name: 'Camille Robert', email: 'camille.robert@example.com' },
  { name: 'Alice Moreau', email: 'alice.moreau@example.com' },
  { name: 'Chloé Simon', email: 'chloe.simon@example.com' },
  { name: 'Inès Laurent', email: 'ines.laurent@example.com' },
];

const classes = [
  {
    id: 'class1',
    title: 'Débutante 1',
    datetime: '2024-11-25T18:00:00.000Z',
    duration: 60,
    maxStudents: 8,
    level: 'beginner',
    teacherId: 'teacher1',
    schoolId: 'school1',
    enrolledStudents: [],
    isRecurring: true,
    description: 'Cours pour débutantes',
  },
  {
    id: 'class2',
    title: 'Intermédiaire',
    datetime: '2024-12-02T19:00:00.000Z',
    duration: 60,
    maxStudents: 6,
    level: 'intermediate',
    teacherId: 'teacher1',
    schoolId: 'school1',
    enrolledStudents: [],
    isRecurring: true,
    description: 'Cours niveau intermédiaire',
  },
  {
    id: 'class3',
    title: 'Avancé',
    datetime: '2024-12-15T20:00:00.000Z',
    duration: 90,
    maxStudents: 4,
    level: 'advanced',
    teacherId: 'teacher1',
    schoolId: 'school1',
    enrolledStudents: [],
    isRecurring: true,
    description: 'Cours niveau avancé',
  },
];

async function createFakeUsers() {
  const password = 'password123';
  const userIds: string[] = [];

  for (const user of fakeUsers) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
      const userId = userCredential.user.uid;
      userIds.push(userId);

      await setDoc(doc(db, 'users', userId), {
        name: user.name,
        email: user.email,
        role: 'student',
        schoolId: 'school1',
      });

      console.log(`Created user: ${user.name}`);
    } catch (error) {
      if (error instanceof Error) {
        // Si l'utilisateur existe déjà, on continue
        if (error.message.includes('email-already-in-use')) {
          console.log(`User ${user.email} already exists, skipping...`);
          continue;
        }
      }
      console.error(`Error creating user ${user.name}:`, error);
    }
  }

  return userIds;
}

async function createTestClasses() {
  for (const classData of classes) {
    try {
      await setDoc(doc(db, 'classes', classData.id), classData);
      console.log(`Created class: ${classData.title}`);
    } catch (error) {
      console.error(`Error creating class ${classData.title}:`, error);
    }
  }
}

async function randomlyEnrollUsers(userIds: string[]) {
  for (const classData of classes) {
    const maxEnrollments = Math.min(
      classData.maxStudents,
      Math.floor(Math.random() * userIds.length)
    );
    
    // Shuffle users array
    const shuffledUsers = [...userIds].sort(() => Math.random() - 0.5);
    const selectedUsers = shuffledUsers.slice(0, maxEnrollments);

    try {
      const classRef = doc(db, 'classes', classData.id);
      await updateDoc(classRef, {
        enrolledStudents: selectedUsers,
      });
      console.log(`Enrolled ${selectedUsers.length} users in ${classData.title}`);
    } catch (error) {
      console.error(`Error enrolling users in ${classData.title}:`, error);
    }
  }

  // Make sure class2 is full
  const fullClass = doc(db, 'classes', 'class2');
  await updateDoc(fullClass, {
    enrolledStudents: userIds.slice(0, 6), // class2 has maxStudents: 6
  });
  console.log('Made class2 full with 6 students');
}

async function setupTestData() {
  try {
    console.log('Creating fake users...');
    const userIds = await createFakeUsers();
    
    console.log('Creating test classes...');
    await createTestClasses();
    
    console.log('Randomly enrolling users in classes...');
    await randomlyEnrollUsers(userIds);
    
    console.log('✅ Test data setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

setupTestData();