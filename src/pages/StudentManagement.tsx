import React, { useEffect, useState } from 'react';
import { format, parseISO, addMonths, addYears, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { User, StudentCredit, StudentSubscription } from '../types';
import { Loader2, CreditCard, Calendar, Infinity, User as UserIcon } from 'lucide-react';

interface BadgeProps {
  variant: 'purple' | 'gray' | 'green';
  children: React.ReactNode;
}

function Badge({ variant, children }: BadgeProps) {
  const colors = {
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

function CreditsBadge({ student }: { student: User }) {
  const hasUnlimitedCredits = student.subscription && 
                             student.subscription.type !== 'pay-as-you-go' && 
                             isAfter(parseISO(student.subscription.endDate), new Date());

  if (hasUnlimitedCredits) {
    return (
      <Badge variant="purple">
        <Infinity className="w-3 h-3 mr-1" />
        Crédits illimités
      </Badge>
    );
  }

  return (
    <Badge variant={student.credits > 0 ? "purple" : "gray"}>
      {student.credits || 0} crédit{(student.credits || 0) !== 1 ? 's' : ''}
    </Badge>
  );
}

function SubscriptionBadge({ student }: { student: User }) {
  if (!student.subscription) return null;

  const subscriptionLabels = {
    'monthly': 'Abonnement mensuel',
    'quarterly': 'Abonnement trimestriel',
    'yearly': 'Abonnement annuel',
    'pay-as-you-go': 'À la carte'
  };

  const isActive = isAfter(parseISO(student.subscription.endDate), new Date());
  
  if (!isActive) return null;

  const endDate = parseISO(student.subscription.endDate);
  const formattedEndDate = student.subscription.type !== 'pay-as-you-go' 
    ? ` (${format(endDate, 'MMMM yyyy', { locale: fr })})`
    : '';
  
  return (
    <div className="inline-flex items-center">
      <Badge variant="green">
        {subscriptionLabels[student.subscription.type]}
      </Badge>
      {formattedEndDate && (
        <span className="ml-2 text-xs text-gray-400 whitespace-nowrap">{formattedEndDate}</span>
      )}
    </div>
  );
}

export function StudentManagement() {
  const { school, fetchSchoolStudents, updateStudentCredits } = useStore();
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(1);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'quarterly' | 'yearly' | 'pay-as-you-go'>('pay-as-you-go');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      if (!school?.id) return;
      try {
        const fetchedStudents = await fetchSchoolStudents(school.id);
        setStudents(fetchedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError("Erreur lors du chargement des élèves");
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, [school?.id, fetchSchoolStudents]);

  const handleAddCredits = async (studentId: string) => {
    if (!creditAmount) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      const credit: StudentCredit = {
        type: 'credits',
        amount: creditAmount,
      };
      await updateStudentCredits(studentId, credit);
      
      if (school) {
        const updatedStudents = await fetchSchoolStudents(school.id);
        setStudents(updatedStudents);
      }
      setSelectedStudent(null);
    } catch (error) {
      setError("Erreur lors de la mise à jour des crédits");
      console.error('Error updating credits:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSubscription = async (studentId: string) => {
    try {
      setIsUpdating(true);
      setError(null);
      const startDate = new Date();
      let endDate: Date;
      
      switch (subscriptionType) {
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

      const subscription: StudentSubscription = {
        type: 'subscription',
        plan: subscriptionType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      
      await updateStudentCredits(studentId, subscription);
      
      if (school) {
        const updatedStudents = await fetchSchoolStudents(school.id);
        setStudents(updatedStudents);
      }
      setSelectedStudent(null);
    } catch (error) {
      setError("Erreur lors de la mise à jour de l'abonnement");
      console.error('Error updating subscription:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Gestion des élèves</h2>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
        {students.map((student) => (
          <div key={student.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-500">{student.email}</p>
                  <div className="mt-2 flex items-center space-x-2 flex-wrap">
                    <CreditsBadge student={student} />
                    <SubscriptionBadge student={student} />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  {selectedStudent === student.id ? 'Annuler' : 'Gérer'}
                </button>
              </div>
            </div>

            {selectedStudent === student.id && (
              <div className="mt-4 space-y-4">
                <div className="bg-gray-50 p-4 rounded-md space-y-4">
                  {subscriptionType === 'pay-as-you-go' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Mettre à jour les crédits</h4>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min="1"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                          className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        />
                        <button
                          onClick={() => handleAddCredits(student.id)}
                          disabled={isUpdating || creditAmount < 1}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CreditCard className="w-4 h-4 mr-2" />
                          )}
                          Mettre à jour les crédits
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Ajouter un abonnement</h4>
                    <div className="flex items-center space-x-3">
                      <select
                        value={subscriptionType}
                        onChange={(e) => setSubscriptionType(e.target.value as any)}
                        className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      >
                        <option value="pay-as-you-go">À la carte</option>
                        <option value="monthly">Mensuel</option>
                        <option value="quarterly">Trimestriel</option>
                        <option value="yearly">Annuel</option>
                      </select>
                      <button
                        onClick={() => handleAddSubscription(student.id)}
                        disabled={isUpdating}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Calendar className="w-4 h-4 mr-2" />
                        )}
                        Mettre à jour l'abonnement
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}