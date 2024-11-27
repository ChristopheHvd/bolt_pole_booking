import React from 'react';
import { User } from '../types';
import { User as UserIcon, X, Loader2 } from 'lucide-react';

interface EnrolledStudentsListProps {
  students: User[];
  onClose: () => void;
  isLoading?: boolean;
}

export function EnrolledStudentsList({ students, onClose, isLoading = false }: EnrolledStudentsListProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Élèves inscrits ({students.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-sm text-gray-500">Chargement des élèves...</p>
            </div>
          ) : students.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun élève inscrit pour le moment
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-sm text-gray-500 truncate">{student.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}