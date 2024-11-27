export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  schoolId?: string;
  credits?: number;
  subscription?: {
    type: 'monthly' | 'quarterly' | 'yearly' | 'pay-as-you-go';
    startDate: string;
    endDate: string;
  };
  photoUrl?: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  email: string;
  logo?: string;
  instagram?: string;
  teacherIds: string[];
}

export interface Class {
  id: string;
  title: string;
  teacherId: string;
  datetime: string;
  duration: number;
  maxStudents: number;
  enrolledStudents: string[];
  isRecurring: boolean;
  level: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  baseId?: string | null;
  schoolId: string;
}

export interface ClassFormData {
  title: string;
  datetime: string;
  duration: number;
  maxStudents: number;
  isRecurring: boolean;
  level: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
}

export interface StudentCredit {
  type: 'credits';
  amount: number;
}

export interface StudentSubscription {
  type: 'subscription';
  plan: 'monthly' | 'quarterly' | 'yearly' | 'pay-as-you-go';
  startDate: string;
  endDate: string;
}