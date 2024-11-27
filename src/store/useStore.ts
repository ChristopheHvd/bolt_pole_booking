import { create } from 'zustand';
import { User, Class, School, StudentCredit, StudentSubscription } from '../types';
import { parseISO, addYears, addMonths } from 'date-fns';
import { generateRecurringDates } from '../utils/dateUtils';
import { 
  collection, 
  doc,
  query,
  where,
  getDocs,
  writeBatch,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { db, auth } from '../config/firebase';

interface Store {
  user: User | null;
  school: School | null;
  classes: Class[];
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSchool: (school: School | null) => void;
  signUp: (email: string, password: string, name: string, role: 'student' | 'teacher') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  addClass: (newClass: Omit<Class, 'id'>) => Promise<void>;
  updateClass: (classId: string, updatedClass: Partial<Class>, updateRecurring: boolean) => Promise<void>;
  deleteClass: (classId: string, deleteRecurring: boolean) => Promise<void>;
  enrollInClass: (classId: string, userId: string, enrollAll: boolean) => Promise<void>;
  unenrollFromClass: (classId: string, userId: string, unenrollAll: boolean) => Promise<void>;
  fetchClasses: () => Promise<void>;
  fetchSchools: () => Promise<School[]>;
  fetchCurrentSchool: () => Promise<void>;
  createSchool: (schoolData: Omit<School, 'id' | 'teacherIds'>) => Promise<void>;
  updateSchool: (schoolData: Omit<School, 'id' | 'teacherIds'>) => Promise<void>;
  updateUserSchool: (userId: string, schoolId: string) => Promise<void>;
  leaveSchool: () => Promise<void>;
  initializeAuthListener: () => void;
  updateProfile: (data: {
    name: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
  updateStudentCredits: (studentId: string, update: StudentCredit | StudentSubscription) => Promise<void>;
  fetchSchoolStudents: (schoolId: string) => Promise<User[]>;
}

export const useStore = create<Store>((set, get) => ({
  user: null,
  school: null,
  classes: [],
  isLoading: true,

  setUser: (user) => set({ user }),
  setSchool: (school) => set({ school }),

  initializeAuthListener: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'id'>;
          set({ 
            user: { 
              id: firebaseUser.uid,
              ...userData
            },
            isLoading: false 
          });
          
          if (userData.schoolId) {
            const schoolDoc = await getDoc(doc(db, 'schools', userData.schoolId));
            if (schoolDoc.exists()) {
              set({ 
                school: { 
                  id: schoolDoc.id,
                  ...schoolDoc.data() as Omit<School, 'id'>
                }
              });
            }
          }
        }
      } else {
        set({ user: null, school: null, isLoading: false });
      }
    });
  },

  signUp: async (email, password, name, role) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      const userData: Omit<User, 'id'> = {
        email,
        name,
        role,
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      set({ 
        user: { 
          id: firebaseUser.uid,
          ...userData
        }
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  signIn: async (email, password) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        set({ 
          user: { 
            id: firebaseUser.uid,
            ...userData
          }
        });
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, school: null });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  addClass: async (newClass) => {
    try {
      const classRef = doc(collection(db, 'classes'));
      const classData = { ...newClass, id: classRef.id };

      if (newClass.isRecurring) {
        const startDate = parseISO(newClass.datetime);
        const endDate = addYears(startDate, 1);
        const dates = generateRecurringDates(startDate, endDate);
        
        const batch = writeBatch(db);
        const baseId = crypto.randomUUID();
        
        dates.forEach((date, index) => {
          const recurringClassRef = doc(collection(db, 'classes'));
          batch.set(recurringClassRef, {
            ...classData,
            id: recurringClassRef.id,
            datetime: date.toISOString(),
            baseId: index === 0 ? null : baseId,
          });
        });
        
        await batch.commit();
      } else {
        await setDoc(classRef, classData);
      }

      await get().fetchClasses();
    } catch (error) {
      console.error('Error adding class:', error);
      throw error;
    }
  },

  updateClass: async (classId, updatedClass, updateRecurring) => {
    try {
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      
      if (!classDoc.exists()) {
        throw new Error('Class not found');
      }

      const classData = classDoc.data() as Class;

      if (updateRecurring && classData.baseId) {
        const classesQuery = query(
          collection(db, 'classes'),
          where('baseId', '==', classData.baseId),
          where('datetime', '>=', classData.datetime)
        );
        
        const snapshot = await getDocs(classesQuery);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, updatedClass);
        });
        
        await batch.commit();
      } else {
        await updateDoc(classRef, updatedClass);
      }
      
      await get().fetchClasses();
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  },

  deleteClass: async (classId, deleteRecurring) => {
    try {
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      
      if (!classDoc.exists()) {
        throw new Error('Class not found');
      }

      const classData = classDoc.data() as Class;

      if (deleteRecurring && classData.baseId) {
        const classesQuery = query(
          collection(db, 'classes'),
          where('baseId', '==', classData.baseId),
          where('datetime', '>=', classData.datetime)
        );
        
        const snapshot = await getDocs(classesQuery);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
      } else {
        await deleteDoc(classRef);
      }
      
      await get().fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  },

  enrollInClass: async (classId, userId, enrollAll) => {
    try {
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      
      if (!classDoc.exists()) {
        throw new Error('Class not found');
      }

      const classData = classDoc.data() as Class;

      if (enrollAll && classData.baseId) {
        const classesQuery = query(
          collection(db, 'classes'),
          where('baseId', '==', classData.baseId),
          where('datetime', '>=', classData.datetime)
        );
        
        const snapshot = await getDocs(classesQuery);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {
            enrolledStudents: arrayUnion(userId)
          });
        });
        
        await batch.commit();
      } else {
        await updateDoc(classRef, {
          enrolledStudents: arrayUnion(userId)
        });
      }
      
      await get().fetchClasses();
    } catch (error) {
      console.error('Error enrolling in class:', error);
      throw error;
    }
  },

  unenrollFromClass: async (classId, userId, unenrollAll) => {
    try {
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      
      if (!classDoc.exists()) {
        throw new Error('Class not found');
      }

      const classData = classDoc.data() as Class;

      if (unenrollAll && classData.baseId) {
        const classesQuery = query(
          collection(db, 'classes'),
          where('baseId', '==', classData.baseId),
          where('datetime', '>=', classData.datetime)
        );
        
        const snapshot = await getDocs(classesQuery);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {
            enrolledStudents: arrayRemove(userId)
          });
        });
        
        await batch.commit();
      } else {
        await updateDoc(classRef, {
          enrolledStudents: arrayRemove(userId)
        });
      }
      
      await get().fetchClasses();
    } catch (error) {
      console.error('Error unenrolling from class:', error);
      throw error;
    }
  },

  fetchClasses: async () => {
    try {
      const user = get().user;
      if (!user?.schoolId) return;

      const now = new Date();
      const classesQuery = query(
        collection(db, 'classes'),
        where('schoolId', '==', user.schoolId),
        where('datetime', '>=', now.toISOString())
      );
      
      const snapshot = await getDocs(classesQuery);
      const classes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Class[];
      
      set({ classes });
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },

  fetchSchools: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'schools'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as School[];
    } catch (error) {
      console.error('Error fetching schools:', error);
      throw error;
    }
  },

  fetchCurrentSchool: async () => {
    try {
      const user = get().user;
      if (!user?.schoolId) return;

      const schoolDoc = await getDoc(doc(db, 'schools', user.schoolId));
      if (schoolDoc.exists()) {
        set({ 
          school: {
            id: schoolDoc.id,
            ...schoolDoc.data() as Omit<School, 'id'>
          }
        });
      }
    } catch (error) {
      console.error('Error fetching current school:', error);
      throw error;
    }
  },

  createSchool: async (schoolData) => {
    try {
      const user = get().user;
      if (!user) throw new Error('User not authenticated');

      const schoolRef = doc(collection(db, 'schools'));
      const school: School = {
        id: schoolRef.id,
        ...schoolData,
        teacherIds: [user.id],
      };

      await setDoc(schoolRef, school);
      await updateDoc(doc(db, 'users', user.id), {
        schoolId: school.id,
      });

      set({ 
        school,
        user: {
          ...user,
          schoolId: school.id,
        },
      });
    } catch (error) {
      console.error('Error creating school:', error);
      throw error;
    }
  },

  updateSchool: async (schoolData) => {
    try {
      const user = get().user;
      const school = get().school;
      if (!user || !school) throw new Error('User not authenticated or no school selected');

      const schoolRef = doc(db, 'schools', school.id);
      await updateDoc(schoolRef, {
        ...schoolData,
        teacherIds: school.teacherIds,
      });

      set({
        school: {
          ...school,
          ...schoolData,
        },
      });
    } catch (error) {
      console.error('Error updating school:', error);
      throw error;
    }
  },

  updateUserSchool: async (userId, schoolId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        schoolId,
      });

      const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
      if (schoolDoc.exists()) {
        const user = get().user;
        if (user) {
          set({
            user: {
              ...user,
              schoolId,
            },
            school: {
              id: schoolDoc.id,
              ...schoolDoc.data() as Omit<School, 'id'>
            },
          });
        }
      }
    } catch (error) {
      console.error('Error updating user school:', error);
      throw error;
    }
  },

  leaveSchool: async () => {
    try {
      const user = get().user;
      const school = get().school;
      if (!user || !school) throw new Error('User not authenticated or no school selected');

      // Get all classes where the user is enrolled
      const classesQuery = query(
        collection(db, 'classes'),
        where('schoolId', '==', school.id),
        where('enrolledStudents', 'array-contains', user.id)
      );
      
      const snapshot = await getDocs(classesQuery);
      const batch = writeBatch(db);

      // Remove user from all enrolled classes
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          enrolledStudents: arrayRemove(user.id)
        });
      });

      // Remove schoolId from user
      batch.update(doc(db, 'users', user.id), {
        schoolId: null
      });

      await batch.commit();

      set({
        user: {
          ...user,
          schoolId: undefined
        },
        school: null
      });
    } catch (error) {
      console.error('Error leaving school:', error);
      throw error;
    }
  },

  updateProfile: async ({ name, email, currentPassword, newPassword }) => {
    const user = get().user;
    if (!user || !auth.currentUser) throw new Error('Utilisateur non connecté');

    try {
      const updates: any = { name };
      
      if ((email !== user.email || newPassword) && currentPassword) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email!,
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        if (email !== user.email) {
          await updateEmail(auth.currentUser, email);
          updates.email = email;
        }

        if (newPassword) {
          await updatePassword(auth.currentUser, newPassword);
        }
      }

      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, updates);

      set({
        user: {
          ...user,
          ...updates,
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  updateStudentCredits: async (studentId: string, update: StudentCredit | StudentSubscription) => {
    try {
      const userRef = doc(db, 'users', studentId);
      
      if (update.type === 'credits') {
        await updateDoc(userRef, {
          credits: update.amount,
          subscription: {
            type: 'pay-as-you-go',
            startDate: new Date().toISOString(),
            endDate: new Date(2099, 11, 31).toISOString(),
          }
        });
      } else {
        const startDate = new Date();
        let endDate: Date;
        
        switch (update.plan) {
          case 'monthly':
            endDate = addMonths(startDate, 1);
            break;
          case 'quarterly':
            endDate = addMonths(startDate, 3);
            break;
          case 'yearly':
            endDate = addYears(startDate, 1);
            break;
          case 'pay-as-you-go':
            endDate = new Date(2099, 11, 31);
            break;
        }

        await updateDoc(userRef, {
          subscription: {
            type: update.plan,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          credits: update.plan === 'pay-as-you-go' ? 0 : 999
        });
      }
    } catch (error) {
      console.error('Error updating student credits:', error);
      throw error;
    }
  },

  fetchSchoolStudents: async (schoolId: string) => {
    try {
      const studentsQuery = query(
        collection(db, 'users'),
        where('schoolId', '==', schoolId),
        where('role', '==', 'student')
      );
      
      const snapshot = await getDocs(studentsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('Error fetching school students:', error);
      throw error;
    }
  },
}));