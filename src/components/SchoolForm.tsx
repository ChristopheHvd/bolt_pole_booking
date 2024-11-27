import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { School } from '../types';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
  address: z.string().min(5, "L'adresse doit faire au moins 5 caractères"),
  email: z.string().email('Email invalide'),
  instagram: z.string().url('URL Instagram invalide').optional().or(z.literal('')),
  logo: z.string().url('URL du logo invalide').optional().or(z.literal('')),
});

type FormInputs = z.infer<typeof schema>;

interface SchoolFormProps {
  onSubmit: (data: FormInputs) => Promise<void>;
  initialData?: School;
  isEditing?: boolean;
}

export function SchoolForm({ onSubmit, initialData, isEditing = false }: SchoolFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      email: initialData?.email || '',
      instagram: initialData?.instagram || '',
      logo: initialData?.logo || '',
    },
  });

  const handleFormSubmit = async (data: FormInputs) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nom de l'école
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
          Adresse
          <input
            type="text"
            {...register('address')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </label>
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email de contact
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

      <div>
        <label className="block text-sm font-medium text-gray-700">
          URL du logo (optionnel)
          <input
            type="url"
            {...register('logo')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            placeholder="https://example.com/logo.png"
          />
        </label>
        {errors.logo && (
          <p className="mt-1 text-sm text-red-600">{errors.logo.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Lien Instagram (optionnel)
          <input
            type="url"
            {...register('instagram')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            placeholder="https://www.instagram.com/votre_ecole"
          />
        </label>
        {errors.instagram && (
          <p className="mt-1 text-sm text-red-600">{errors.instagram.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {isEditing ? 'Modification...' : 'Création...'}
          </>
        ) : (
          isEditing ? "Modifier l'école" : "Créer l'école"
        )}
      </button>
    </form>
  );
}