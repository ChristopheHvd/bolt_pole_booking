import React, { useEffect } from 'react';
import { isFuture, parseISO } from 'date-fns';
import { Plus, ChevronDown, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ClassCard } from '../components/ClassCard';
import { ClassForm } from '../components/ClassForm';
import { SchoolForm } from '../components/SchoolForm';
import { SchoolSelect } from '../components/SchoolSelect';
import { StudentManagement } from './StudentManagement';
import { Class, ClassFormData } from '../types';

const ITEMS_PER_PAGE = 10;

export function TeacherDashboard() {
  const { user, classes, addClass, fetchClasses } = useStore();
  const [showClassForm, setShowClassForm] = React.useState(false);
  const [showSchoolForm, setShowSchoolForm] = React.useState(false);
  const [showStudentManagement, setShowStudentManagement] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [visibleClasses, setVisibleClasses] = React.useState(ITEMS_PER_PAGE);

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

  const teacherClasses = classes
    .filter((c) => c.teacherId === user?.id && isFuture(parseISO(c.datetime)))
    .sort((a, b) => parseISO(a.datetime).getTime() - parseISO(b.datetime).getTime());

  const handleCreateClass = async (data: ClassFormData) => {
    if (!user?.schoolId) return;
    
    try {
      const newClass: Class = {
        id: crypto.randomUUID(),
        teacherId: user.id,
        schoolId: user.schoolId,
        enrolledStudents: [],
        ...data,
      };
      
      await addClass(newClass);
      setShowClassForm(false);
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const handleCreateSchool = async (data: any) => {
    try {
      await useStore.getState().createSchool({
        ...data,
        email: user?.email || data.email,
      });
      setShowSchoolForm(false);
    } catch (error) {
      console.error('Error creating school:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user?.schoolId) {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Gérer votre école</h2>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rejoindre une école existante</h3>
            <SchoolSelect />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Créer une nouvelle école</h3>
              <button
                onClick={() => setShowSchoolForm(!showSchoolForm)}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                {showSchoolForm ? 'Annuler' : 'Créer'}
              </button>
            </div>
            {showSchoolForm && <SchoolForm onSubmit={handleCreateSchool} />}
          </div>
        </div>
      </div>
    );
  }

  if (showStudentManagement) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setShowStudentManagement(false)}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            ← Retour aux cours
          </button>
        </div>
        <StudentManagement />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Mes cours sur l'année à venir</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowStudentManagement(true)}
            className="inline-flex items-center px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 mr-2" />
            Gérer les élèves
          </button>
          <button
            onClick={() => setShowClassForm(!showClassForm)}
            className="inline-flex items-center px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau cours
          </button>
        </div>
      </div>

      {showClassForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouveau cours</h3>
          <ClassForm onSubmit={handleCreateClass} />
        </div>
      )}

      {teacherClasses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">Vous n'avez pas encore de cours programmés</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teacherClasses.slice(0, visibleClasses).map((classItem) => (
              <ClassCard key={classItem.id} classData={classItem} />
            ))}
          </div>
          {teacherClasses.length > visibleClasses && (
            <div className="flex justify-center">
              <button
                onClick={() => setVisibleClasses(prev => prev + ITEMS_PER_PAGE)}
                className="flex items-center px-4 py-2 text-sm text-purple-600 hover:text-purple-700"
              >
                Voir plus
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}