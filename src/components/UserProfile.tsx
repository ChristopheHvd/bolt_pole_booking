import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '../store/useStore';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

const createProfileSchema = (initialEmail: string) => z.object({
  name: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  if ((data.email !== initialEmail || data.newPassword) && !data.currentPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le mot de passe actuel est requis pour changer l'email ou le mot de passe",
      path: ['currentPassword'],
    });
  }

  if (data.newPassword) {
    if (data.newPassword.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le nouveau mot de passe doit faire au moins 6 caractères",
        path: ['newPassword'],
      });
    }
    
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Les mots de passe ne correspondent pas",
        path: ['confirmPassword'],
      });
    }
  }
});

type ProfileInputs = z.infer<ReturnType<typeof createProfileSchema>>;

export function UserProfile() {
  const { user, school, updateProfile, leaveSchool } = useStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLeavingSchool, setIsLeavingSchool] = React.useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const initialEmail = user?.email || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ProfileInputs>({
    resolver: zodResolver(createProfileSchema(initialEmail)),
    defaultValues: {
      name: user?.name || '',
      email: initialEmail,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const email = watch('email');
  const newPassword = watch('newPassword');
  const needsPassword = email !== initialEmail || newPassword;

  const onSubmit = async (data: ProfileInputs) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);
      
      await updateProfile({
        name: data.name,
        email: data.email,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      setSuccess(true);
      reset({
        ...data,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveSchool = async () => {
    try {
      setIsLeavingSchool(true);
      await leaveSchool();
      setShowLeaveConfirm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    } finally {
      setIsLeavingSchool(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Mon profil</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nom complet
            <input
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </label>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </label>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {needsPassword && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mot de passe actuel (requis pour changer l'email ou le mot de passe)
              <input
                type="password"
                {...register('currentPassword')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </label>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nouveau mot de passe (optionnel)
            <input
              type="password"
              {...register('newPassword')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </label>
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
          )}
        </div>

        {newPassword && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirmer le nouveau mot de passe
              <input
                type="password"
                {...register('confirmPassword')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </label>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">Profil mis à jour avec succès</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Mise à jour...
            </>
          ) : (
            'Mettre à jour le profil'
          )}
        </button>
      </form>

      {user?.role === 'student' && school && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">École actuelle</h3>
            <p className="text-sm text-gray-600">{school.name}</p>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    En quittant l'école, vous serez automatiquement désinscrit(e) de tous vos cours réservés.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLeaveConfirm(true)}
              disabled={isLeavingSchool}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLeavingSchool ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Désinscription en cours...
                </>
              ) : (
                "Quitter l'école"
              )}
            </button>
          </div>

          {showLeaveConfirm && (
            <ConfirmDialog
              title="Confirmation de désinscription"
              message="Êtes-vous sûr de vouloir quitter cette école ? Cette action est irréversible et vous serez désinscrit(e) de tous vos cours réservés."
              onConfirmOne={handleLeaveSchool}
              onClose={() => setShowLeaveConfirm(false)}
              confirmOneText="Oui, quitter l'école"
              variant="danger"
              isLoadingOne={isLeavingSchool}
            />
          )}
        </div>
      )}
    </div>
  );
}