import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Clock, CalendarCheck, Repeat, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Class, ClassFormData } from '../types';
import { useStore } from '../store/useStore';
import { ClassForm } from './ClassForm';
import { ConfirmDialog } from './ConfirmDialog';

interface ClassCardProps {
  classData: Class;
}

export function ClassCard({ classData }: ClassCardProps) {
  const { user, enrollInClass, unenrollFromClass, updateClass, deleteClass } = useStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showEnrollConfirm, setShowEnrollConfirm] = React.useState(false);
  const [showUnenrollConfirm, setShowUnenrollConfirm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeletingOne, setIsDeletingOne] = React.useState(false);
  const [isDeletingAll, setIsDeletingAll] = React.useState(false);
  const [isEnrollingOne, setIsEnrollingOne] = React.useState(false);
  const [isEnrollingAll, setIsEnrollingAll] = React.useState(false);
  const [isUnenrollingOne, setIsUnenrollingOne] = React.useState(false);
  const [isUnenrollingAll, setIsUnenrollingAll] = React.useState(false);
  
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

      await enrollInClass(classData.id, user.id, enrollAll);
      setShowEnrollConfirm(false);
    } finally {
      setIsEnrollingAll(false);
      setIsEnrollingOne(false);
    }
  };

  const handleUnenrollment = async (unenrollAll: boolean = false) => {
    if (!user) return;
    
    try {
      if (unenrollAll) {
        setIsUnenrollingAll(true);
      } else {
        setIsUnenrollingOne(true);
      }

      await unenrollFromClass(classData.id, user.id, unenrollAll);
      setShowUnenrollConfirm(false);
    } finally {
      setIsUnenrollingAll(false);
      setIsUnenrollingOne(false);
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
    <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative ${isFull ? 'opacity-75' : ''}`}>
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Confirmation de suppression"
          message={classData.baseId
            ? "Voulez-vous supprimer uniquement ce cours ou tous les prochains cours récurrents ?"
            : "Êtes-vous sûr de vouloir supprimer ce cours ?"}
          onConfirmOne={() => handleDelete(false)}
          onConfirmAll={() => handleDelete(true)}
          onClose={() => setShowDeleteConfirm(false)}
          confirmOneText="Ce cours uniquement"
          confirmAllText={classData.baseId ? "Tous les prochains cours" : "Supprimer"}
          isLoadingOne={isDeletingOne}
          isLoadingAll={isDeletingAll}
          variant="danger"
        />
      )}

      {showEnrollConfirm && !isEnrolled && classData.baseId && (
        <ConfirmDialog
          title="Inscription"
          message="Voulez-vous vous inscrire uniquement à ce cours ou à tous les prochains cours récurrents ?"
          onConfirmOne={() => handleEnrollment(false)}
          onConfirmAll={() => handleEnrollment(true)}
          onClose={() => setShowEnrollConfirm(false)}
          confirmOneText="Ce cours uniquement"
          confirmAllText="Tous les prochains cours"
          isLoadingOne={isEnrollingOne}
          isLoadingAll={isEnrollingAll}
          variant="primary"
        />
      )}

      {showUnenrollConfirm && isEnrolled && classData.baseId && (
        <ConfirmDialog
          title="Désinscription"
          message="Voulez-vous vous désinscrire uniquement de ce cours ou de tous les prochains cours récurrents ?"
          onConfirmOne={() => handleUnenrollment(false)}
          onConfirmAll={() => handleUnenrollment(true)}
          onClose={() => setShowUnenrollConfirm(false)}
          confirmOneText="Ce cours uniquement"
          confirmAllText="Tous les prochains cours"
          isLoadingOne={isUnenrollingOne}
          isLoadingAll={isUnenrollingAll}
          variant="danger"
        />
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
              ? `${availableSpots} place${availableSpots > 1 ? 's' : ''} restante${availableSpots > 1 ? 's' : ''}`
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
            if (isEnrolled) {
              if (classData.baseId) {
                setShowUnenrollConfirm(true);
              } else {
                handleUnenrollment(false);
              }
            } else if (!isFull) {
              if (classData.baseId) {
                setShowEnrollConfirm(true);
              } else {
                handleEnrollment(false);
              }
            }
          }}
          disabled={(!isEnrolled && isFull) || isLoading}
          className={`w-full flex justify-center items-center py-2 px-4 rounded-md transition-colors ${
            isEnrolled
              ? 'text-gray-700 hover:text-red-600 bg-gray-100 hover:bg-red-50'
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