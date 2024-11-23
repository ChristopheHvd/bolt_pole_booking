import React, { useEffect, useState } from 'react';
import { isFuture, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { ClassCard } from '../components/ClassCard';
import { SchoolSelect } from '../components/SchoolSelect';
import { ChevronDown } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export function StudentDashboard() {
  const { user, classes, fetchClasses, isLoading: isStoreLoading } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [visibleEnrolled, setVisibleEnrolled] = useState(ITEMS_PER_PAGE);
  const [visibleAvailable, setVisibleAvailable] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        await fetchClasses();
      } finally {
        setIsLoading(false);
      }
    };
    loadClasses();
  }, [fetchClasses]);

  const futureClasses = classes
    .filter((c) => isFuture(parseISO(c.datetime)))
    .sort((a, b) => parseISO(a.datetime).getTime() - parseISO(b.datetime).getTime());

  const enrolledClasses = futureClasses.filter((c) => 
    c.enrolledStudents.includes(user?.id || ''));
  
  const availableClasses = futureClasses.filter((c) => 
    !c.enrolledStudents.includes(user?.id || '') && 
    c.enrolledStudents.length < c.maxStudents);

  if (isLoading || isStoreLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user?.schoolId) {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Choisir une école</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <SchoolSelect />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mes cours à venir</h2>
        {enrolledClasses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            Vous n'êtes inscrit(e) à aucun cours pour le moment
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledClasses.slice(0, visibleEnrolled).map((classItem) => (
                <ClassCard key={classItem.id} classData={classItem} />
              ))}
            </div>
            {enrolledClasses.length > visibleEnrolled && (
              <div className="flex justify-center">
                <button
                  onClick={() => setVisibleEnrolled(prev => prev + ITEMS_PER_PAGE)}
                  className="flex items-center px-4 py-2 text-sm text-purple-600 hover:text-purple-700"
                >
                  Voir plus
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cours disponibles</h2>
        {availableClasses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            Aucun cours disponible pour le moment
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableClasses.slice(0, visibleAvailable).map((classItem) => (
                <ClassCard key={classItem.id} classData={classItem} />
              ))}
            </div>
            {availableClasses.length > visibleAvailable && (
              <div className="flex justify-center">
                <button
                  onClick={() => setVisibleAvailable(prev => prev + ITEMS_PER_PAGE)}
                  className="flex items-center px-4 py-2 text-sm text-purple-600 hover:text-purple-700"
                >
                  Voir plus
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}