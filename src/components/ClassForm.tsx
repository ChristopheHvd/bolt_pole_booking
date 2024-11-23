import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClassFormData, Class } from '../types';
import { getNextDayOfWeek } from '../utils/dateUtils';
import { TimeSelect } from './TimeSelect';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères'),
  dayOfWeek: z.number().min(0).max(6),
  time: z.string().regex(/^([0-1][0-9]|2[0-3]):(00|15|30|45)$/, 'Heure invalide'),
  duration: z.number().min(30).max(180),
  maxStudents: z.number().min(1).max(20),
  isRecurring: z.boolean(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  description: z.string().optional(),
  updateRecurring: z.boolean().optional(),
});

type FormInputs = Omit<ClassFormData, 'datetime'> & {
  dayOfWeek: number;
  time: string;
  updateRecurring?: boolean;
};

interface ClassFormProps {
  onSubmit: (data: ClassFormData, updateRecurring: boolean) => Promise<void>;
  initialData?: Class;
  isEditing?: boolean;
}

export function ClassForm({ onSubmit, initialData, isEditing = false }: ClassFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const defaultValues = initialData
    ? {
        title: initialData.title,
        dayOfWeek: parseISO(initialData.datetime).getDay(),
        time: format(parseISO(initialData.datetime), 'HH:mm'),
        duration: initialData.duration,
        maxStudents: initialData.maxStudents,
        isRecurring: initialData.isRecurring,
        level: initialData.level,
        description: initialData.description || '',
        updateRecurring: true,
      }
    : {
        title: '',
        duration: 60,
        maxStudents: 8,
        isRecurring: false,
        level: 'beginner' as const,
        dayOfWeek: 1,
        time: '18:00',
        description: '',
        updateRecurring: false,
      };

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const isRecurring = watch('isRecurring');
  const isEditingRecurring = isEditing && initialData?.isRecurring;

  const handleFormSubmit = async (data: FormInputs) => {
    try {
      setIsSubmitting(true);
      const nextDate = getNextDayOfWeek(data.dayOfWeek, data.time);
      const { dayOfWeek, time, updateRecurring, ...formData } = data;
      
      await onSubmit(
        {
          ...formData,
          datetime: nextDate.toISOString(),
        },
        updateRecurring || false
      );
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Titre du cours
          <input
            type="text"
            {...register('title')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </label>
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Jour de la semaine
            <select
              {...register('dayOfWeek', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              disabled={isEditing}
            >
              <option value={1}>Lundi</option>
              <option value={2}>Mardi</option>
              <option value={3}>Mercredi</option>
              <option value={4}>Jeudi</option>
              <option value={5}>Vendredi</option>
              <option value={6}>Samedi</option>
              <option value={0}>Dimanche</option>
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Heure
            <Controller
              name="time"
              control={control}
              render={({ field }) => (
                <TimeSelect
                  value={field.value}
                  onChange={field.onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  disabled={isEditing}
                />
              )}
            />
          </label>
          {errors.time && (
            <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Durée (minutes)
            <input
              type="number"
              {...register('duration', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre maximum d'élèves
            <input
              type="number"
              {...register('maxStudents', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Niveau
          <select
            {...register('level')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="beginner">Débutant</option>
            <option value="intermediate">Intermédiaire</option>
            <option value="advanced">Avancé</option>
          </select>
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('isRecurring')}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            disabled={isEditing}
          />
          <label className="ml-2 block text-sm text-gray-700">
            Cours récurrent chaque semaine
            {isEditing && " (non modifiable)"}
          </label>
        </div>

        {isEditingRecurring && (
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('updateRecurring')}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Appliquer les modifications à tous les prochains cours
            </label>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description (optionnelle)
          <textarea
            {...register('description')}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {isEditing ? 'Modification en cours...' : 'Création en cours...'}
          </>
        ) : (
          isEditing ? 'Modifier le cours' : 'Créer le cours'
        )}
      </button>
    </form>
  );
}