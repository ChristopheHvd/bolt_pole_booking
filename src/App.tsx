import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Calendar, User as UserIcon } from 'lucide-react';
import { useStore } from './store/useStore';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { AuthForm } from './components/AuthForm';
import { UserProfile } from './components/UserProfile';
import { SchoolDetails } from './components/SchoolDetails';

export default function App() {
  const { user, school, signIn, signUp, signOut, isLoading, initializeAuthListener } = useStore();
  const [showProfile, setShowProfile] = useState(false);
  const [showSchoolDetails, setShowSchoolDetails] = useState(false);

  useEffect(() => {
    initializeAuthListener();
  }, [initializeAuthListener]);

  const handleAuth = async (data: {
    email: string;
    password: string;
    name?: string;
    role?: 'student' | 'teacher';
  }) => {
    try {
      if (!data.name || !data.role) {
        await signIn(data.email, data.password);
      } else {
        await signUp(data.email, data.password, data.name, data.role);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Email ou mot de passe incorrect');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link
                  to="/"
                  className="flex items-center px-2 py-2 text-purple-600 font-medium"
                >
                  <Calendar className="h-6 w-6 mr-2" />
                  Pole Booking
                </Link>
                {school && (
                  <button
                    onClick={() => setShowSchoolDetails(true)}
                    className="ml-4 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200 transition-colors"
                  >
                    {school.name}
                  </button>
                )}
              </div>
              <div className="flex items-center">
                {user && (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowProfile(!showProfile)}
                      className="flex items-center text-gray-700 hover:text-purple-600"
                    >
                      <UserIcon className="h-5 w-5 mr-2" />
                      <span>{user.name}</span>
                    </button>
                    <button
                      onClick={() => signOut()}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {showProfile && user ? (
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Mon compte</h2>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Retour
                  </button>
                </div>
                <UserProfile />
              </div>
            ) : (
              <Routes>
                <Route
                  path="/"
                  element={
                    user ? (
                      user.role === 'teacher' ? (
                        <TeacherDashboard />
                      ) : (
                        <StudentDashboard />
                      )
                    ) : (
                      <div className="max-w-md mx-auto">
                        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                          Bienvenue sur Pole Booking
                        </h1>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <AuthForm onSubmit={handleAuth} />
                        </div>
                      </div>
                    )
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </div>
        </main>

        {showSchoolDetails && school && (
          <SchoolDetails onClose={() => setShowSchoolDetails(false)} />
        )}
      </div>
    </Router>
  );
}