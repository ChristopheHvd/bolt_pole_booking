import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Clock, CalendarCheck, Repeat, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Class, ClassFormData } from '../types';
import { useStore } from '../store/useStore';
import { ClassForm } from './ClassForm';

interface ClassCardProps {
  classData: Class;
}

export function ClassCard({ classData }: ClassCardProps) {
  const { user, enrollInClass, unenrollFromClass, updateClass, deleteClass } = useStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showEnrollConfirm, setShowEnrollConfirm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeletingOne, setIsDeletingOne] = React.useState(false);
  const [isDeletingAll, setIsDeletingAll] = React.useState(false);
  const [isEnrollingOne, setIsEnrollingOne] = React.useState(false);
  const [isEnrollingAll, setIsEnrollingAll] = React.useState(false);
  
  const isEnrolled = user && classData.enrolledStudents.includes(user.id);
  const isFull = classData.enrolledStudents.length >= classData.maxStudents;
  const availableSpots = classData.maxStudents - classData.enrolledStudents.length;
  const isTeacher = user?.role === 'teacher';

  const handleEnrollment = async (enrollAll: boolean = false) => {
    if (!user) return;
    
    try {
      if (enrollAll) {
        setIsEnrollingAll(true);
      } else {
        setIsEnrollingOne(true);
      }

      if (isEnrolled) {
        await unenrollFromClass(classData.id, user.id);
      } else {
        await enrollInClass(classData.id, user.id, enrollAll);
      }
      setShowEnrollConfirm(false);
    } finally {
      setIsEnrollingAll(false);
      setIsEnrollingOne(false);
    }
  };

  const handleDelete = async (deleteRecurring: boolean) => {
    try {
      if (deleteRecurring) {
        setIsDeletingAll(true);
      } else {
        setIsDeletingOne(true);
      }
      await deleteClass(classData.id, deleteRecurring);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting class:', error);
    } finally {
      setIsDeletingAll(false);
      setIsDeletingOne(false);
    }
  };

  const handleUpdate = async (formData: ClassFormData, updateRecurring: boolean) => {
    try {
      setIsLoading(true);
      const updatedClass: Partial<Class> = {
        ...formData,
        teacherId: user?.id,
      };
      await updateClass(classData.id, updatedClass, updateRecurring);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const levelLabels = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Modifier le cours</h3>
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            Annuler
          </button>
        </div>
        <ClassForm
          initialData={classData}
          onSubmit={handleUpdate}
          isEditing
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative">
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white rounded-lg p-6 z-10">
          <h4 className="text-lg font-semibold text-red-600 mb-4">Confirmation de suppression</h4>
          <p className="text-sm text-gray-700 mb-6">
            {classData.baseId
              ? "Voulez-vous supprimer uniquement ce cours ou tous les prochains cours récurrents ?"
              : "Êtes-vous sûr de vouloir supprimer ce cours ?"}
          </p>
          <div className="flex flex-col space-y-2">
            {classData.baseId && (
              <button
                onClick={() => handleDelete(false)}
                disabled={isDeletingOne || isDeletingAll}
                className="w-full px-3 py-2 text-sm font-medium bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingOne ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Suppression...
                  </span>
                ) : (
                  "Ce cours uniquement"
                )}
              </button>
            )}
            <button
              onClick={() => handleDelete(true)}
              disabled={isDeletingOne || isDeletingAll}
              className="w-full px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeletingAll ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </span>
              ) : (
                classData.baseId ? "Tous les prochains cours" : "Supprimer"
              )}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeletingOne || isDeletingAll}
              className="w-full px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {showEnrollConfirm && !isEnrolled && classData.baseId && (
        <div className="absolute inset-0 bg-white rounded-lg p-6 z-10">
          <h4 className="text-lg font-semibold text-purple-600 mb-4">Confirmation d'inscription</h4>
          <p className="text-sm text-gray-700 mb-6">
            Voulez-vous vous inscrire uniquement à ce cours ou à tous les prochains cours récurrents ?
          </p>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleEnrollment(false)}
              disabled={isEnrollingOne || isEnrollingAll}
              className="w-full px-3 py-2 text-sm font-medium bg-white text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnrollingOne ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inscription...
                </span>
              ) : (
                "Ce cours uniquement"
              )}
            </button>
            <button
              onClick={() => handleEnrollment(true)}
              disabled={isEnrollingOne || isEnrollingAll}
              className="w-full px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnrollingAll ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inscription...
                </span>
              ) : (
                "Tous les prochains cours"
              )}
            </button>
            <button
              onClick={() => setShowEnrollConfirm(false)}
              disabled={isEnrollingOne || isEnrollingAll}
              className="w-full px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-800">{classData.title}</h3>
            {classData.baseId && (
              <Repeat className="w-4 h-4 text-purple-500" title="Cours récurrent" />
            )}
          </div>
          <p className="text-sm text-gray-500">
            Niveau : {levelLabels[classData.level]}
          </p>
        </div>
        {isTeacher && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-500 hover:text-purple-600 rounded-full hover:bg-purple-50"
              title="Modifier"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600">
          <CalendarCheck className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">
            {format(parseISO(classData.datetime), "EEEE d MMMM yyyy 'à' HH'h'mm", {
              locale: fr,
            })}
          </span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{classData.duration} minutes</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">
            {availableSpots > 0 
              ? `${availableSpots} place${availableSpots > 1 ? 's' : ''} disponible${availableSpots > 1 ? 's' : ''}`
              : 'Complet'}
          </span>
        </div>
      </div>

      {classData.description && (
        <p className="text-sm text-gray-600 mb-4">{classData.description}</p>
      )}

      {user?.role === 'student' && (
        <button
          onClick={() => {
            if (isEnrolled || !classData.baseId) {
              handleEnrollment(false);
            } else {
              setShowEnrollConfirm(true);
            }
          }}
          disabled={(!isEnrolled && isFull) || isLoading}
          className={`w-full flex justify-center items-center py-2 px-4 rounded-md transition-colors ${
            isEnrolled
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : isFull
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {isEnrolled ? 'Désinscription...' : 'Inscription...'}
            </span>
          ) : (
            isEnrolled ? 'Se désinscrire' : isFull ? 'Complet' : "S'inscrire"
          )}
        </button>
      )}
    </div>
  );
}